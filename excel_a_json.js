  const ALERTAS_VALIDAS = [
    "1. PASO A DEMANDA",
    "2. PREJURIDICO EN FIRME",
    "3. PREJURIDICO 1",
    "4. COBRO NORMAL",
    "5. FUERA DE CICLO",
    "6. EMPRESA EN CEROS"
  ];

  const MAPEO = {
    "NIT":                        "nit",
    "Razon Social":               "razon_social",
    "Razón Social":               "razon_social",
    "Asesor Comercial":           "asesor_comercial",
    "Alerta Ciclo Cobro UGPP":    "alerta_ciclo_cobro",
    "Deuda Presunta":             "deuda_presunta",
    "Deuda Real":                 "deuda_real",
    "Pagos sin planilla (PO)":    "pagos_po",
    "Rezagos sin Acreditar (PO)": "aportes_po",
    "Pagos sin planilla (CES)":   "pagos_ces",
    "Pagos sin planilla (PV)":    "pagos_pv",
    "Rezagos sin Acreditar (PV)": "aportes_pv"
  };

  const CAMPOS_MONETARIOS = [
    "deuda_presunta","deuda_real","pagos_po",
    "aportes_po","pagos_ces","pagos_pv","aportes_pv"
  ];

  const ORDEN_CAMPOS = [
    "nit","razon_social","asesor_comercial","alerta_ciclo_cobro",
    "deuda_presunta","deuda_real","pagos_po","aportes_po",
    "pagos_ces","pagos_pv","aportes_pv"
  ];

  let workbook      = null;
  let jsonResultado = "";
  let nombreBase    = "empleadores";
  let advertencias  = [];

  // ── Drag & Drop ──────────────────────────────────
  const dropZone = document.getElementById("dropZone");
  dropZone.addEventListener("dragover", e => { e.preventDefault(); dropZone.classList.add("drag-over"); });
  dropZone.addEventListener("dragleave", () => dropZone.classList.remove("drag-over"));
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    if (e.dataTransfer.files[0]) procesarArchivo(e.dataTransfer.files[0]);
  });
  document.getElementById("fileInput").addEventListener("change", function() {
    if (this.files[0]) procesarArchivo(this.files[0]);
  });

  // ── Procesar archivo ─────────────────────────────
  function procesarArchivo(file) {
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["xlsx","xls"].includes(ext)) {
      mostrarToast("❌ Solo se aceptan archivos .xlsx o .xls");
      return;
    }
    nombreBase = file.name.replace(/\.[^/.]+$/, "");
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        workbook = XLSX.read(e.target.result, { type: "array", raw: false });
        document.getElementById("nombreArchivo").textContent =
          `${file.name}  —  ${(file.size / 1024).toFixed(1)} KB`;
        document.getElementById("archivoInfo").style.display = "flex";
        document.getElementById("btnConvertir").disabled = false;
        mostrarToast("✅ Archivo cargado — listo para convertir");
      } catch(err) {
        mostrarToast("❌ Error leyendo el archivo: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ── Transformaciones del protocolo ───────────────

  function transformarNIT(valor) {
    if (valor === null || valor === undefined) return "";
    let s = String(valor).trim();
    s = s.replace(/[\.\s]/g, "");   // quitar puntos y espacios
    s = s.replace(/-\d$/, "");       // quitar guión + dígito de verificación
    s = s.replace(/\D/g, "");        // quitar cualquier no-dígito restante
    return s;
  }

  function transformarMonetario(valor) {
    if (valor === null || valor === undefined) return "";
    let s = String(valor).trim();
    const vacios = ["", "0", "$ -", "$-", "$ 0", "$0", "-", "$ -"];
    if (vacios.includes(s)) return "";
    // Limpiar para parsear: quitar $, espacios, puntos de miles
    let limpio = s.replace(/\$\s*/g, "").replace(/\./g, "").replace(/,/g, ".").trim();
    let num = parseFloat(limpio);
    if (!isNaN(num)) {
      if (num === 0) return "";
      // Formatear: separador de miles con punto, sin decimales
      let entero = Math.round(num);
      let formateado = entero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      return "$ " + formateado;
    }
    return "";
  }

  function transformarTexto(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor).trim();
  }

  function transformarAsesor(valor) {
    const t = transformarTexto(valor);
    return t === "" ? "Sin Consultor Asignado" : t;
  }

  function transformarAlerta(valor, nit, advertenciasArr) {
    const t = transformarTexto(valor);
    if (t === "") {
      advertenciasArr.push({ nit, campo: "alerta_ciclo_cobro",
        mensaje: "Campo VACÍO — requiere revisión manual" });
      return "";
    }
    if (!ALERTAS_VALIDAS.includes(t)) {
      advertenciasArr.push({ nit, campo: "alerta_ciclo_cobro",
        mensaje: `Valor no reconocido: "${t}" — no coincide con ninguno de los 6 valores válidos` });
    }
    return t;
  }

  // ── Convertir ────────────────────────────────────
  function convertir() {
    if (!workbook) return;
    advertencias = [];

    const hojaName = workbook.SheetNames[0];
    const hoja     = workbook.Sheets[hojaName];

    const filas = XLSX.utils.sheet_to_json(hoja, { defval: "", raw: false });

    if (filas.length === 0) {
      mostrarToast("⚠️ La hoja está vacía");
      return;
    }

    // Función para obtener valor de fila por nombre de columna (tolerante a tildes/espacios)
    const get = (fila, colExcel) => {
      if (fila[colExcel] !== undefined) return fila[colExcel];
      const key = Object.keys(fila).find(
        k => k.trim().replace(/\s+/g," ").toLowerCase() === colExcel.trim().replace(/\s+/g," ").toLowerCase()
      );
      return key !== undefined ? fila[key] : "";
    };

    const empleadores = filas.map((fila, idx) => {
      const nitRaw = get(fila, "NIT");
      const nit    = transformarNIT(nitRaw);
      const ref    = nit || `fila ${idx + 2}`;

      const registro = {};

      ORDEN_CAMPOS.forEach(campo => {
        const colExcel = Object.keys(MAPEO).find(k => MAPEO[k] === campo);
        const valorRaw = colExcel ? get(fila, colExcel) : "";

        switch(campo) {
          case "nit":               registro[campo] = nit; break;
          case "razon_social":      registro[campo] = transformarTexto(valorRaw); break;
          case "asesor_comercial":  registro[campo] = transformarAsesor(valorRaw); break;
          case "alerta_ciclo_cobro":registro[campo] = transformarAlerta(valorRaw, ref, advertencias); break;
          default:
            registro[campo] = CAMPOS_MONETARIOS.includes(campo)
              ? transformarMonetario(valorRaw)
              : transformarTexto(valorRaw);
        }
      });

      return registro;
    });

    const resultado = { empleadores };
    jsonResultado   = JSON.stringify(resultado, null, 2);

    document.getElementById("jsonOutput").value = jsonResultado;
    document.getElementById("outputSection").style.display = "flex";
    document.getElementById("btnCopiar").disabled    = false;
    document.getElementById("btnDescargar").disabled = false;

    const kb = (new Blob([jsonResultado]).size / 1024).toFixed(1);
    document.getElementById("statsBar").innerHTML = `
      <span class="stat-badge">👥 ${empleadores.length} empleadores</span>
      <span class="stat-badge">⚖️ ${kb} KB</span>
      ${advertencias.length > 0
        ? `<span class="stat-badge warn">⚠️ ${advertencias.length} advertencia(s)</span>`
        : `<span class="stat-badge" style="background:var(--verde)">✅ Sin advertencias</span>`}
    `;

    // Advertencias
    const wBody = document.getElementById("warningsBody");
    const wSec  = document.getElementById("warningsSection");
    wBody.innerHTML = "";
    if (advertencias.length > 0) {
      advertencias.forEach(w => {
        const div = document.createElement("div");
        div.className = "warn-item";
        div.innerHTML = `<strong>NIT ${w.nit}</strong> — ${w.campo}: ${w.mensaje}`;
        wBody.appendChild(div);
      });
      wSec.style.display = "flex";
    } else {
      wSec.style.display = "none";
    }

    ejecutarChecklist(empleadores);
    mostrarToast(`✅ ${empleadores.length} registros convertidos con el protocolo Protección`);
  }

  // ── Checklist ────────────────────────────────────
  function ejecutarChecklist(empleadores) {
    const checks = [
      {
        ok: empleadores.every(e => /^\d+$/.test(e.nit) || e.nit === ""),
        texto: "Todos los NITs son strings numéricos sin puntos, guiones ni dígito de verificación"
      },
      {
        ok: empleadores.every(e =>
          CAMPOS_MONETARIOS.every(c => {
            const v = e[c];
            return v !== null && v !== "0" && v !== "$ -" && v !== "$ 0";
          })
        ),
        texto: 'Ningún campo monetario vacío contiene null, 0 o "$ -" — solo ""'
      },
      {
        ok: empleadores.every(e =>
          CAMPOS_MONETARIOS.every(c => {
            const v = e[c];
            return v === "" || /^\$ \d{1,3}(\.\d{3})*$/.test(v);
          })
        ),
        texto: 'Los valores monetarios tienen el formato "$ 1.234.567"'
      },
      {
        ok: empleadores.every(e => ORDEN_CAMPOS.every(c => c in e)),
        texto: "Cada registro tiene los 11 campos obligatorios"
      },
      {
        ok: jsonResultado.includes('"empleadores"'),
        texto: 'El JSON tiene la estructura {"empleadores": [...]}'
      },
      {
        ok: empleadores.every(e => e.asesor_comercial !== ""),
        texto: 'Ningún asesor_comercial está vacío — los sin asignar dicen "Sin Consultor Asignado"'
      },
      {
        ok: empleadores.every(e => ALERTAS_VALIDAS.includes(e.alerta_ciclo_cobro)),
        texto: "Todos los alerta_ciclo_cobro tienen uno de los 6 valores válidos y ninguno está vacío"
      }
    ];

    const body    = document.getElementById("checklistBody");
    const section = document.getElementById("checklistSection");
    body.innerHTML = "";
    section.style.display = "flex";

    checks.forEach(c => {
      const div = document.createElement("div");
      div.className = "check-item-line";
      div.innerHTML = `
        <span class="${c.ok ? 'check-ok' : 'check-fail'}">${c.ok ? '✅' : '❌'}</span>
        <span>${c.texto}</span>
      `;
      body.appendChild(div);
    });
  }

  // ── Copiar / Descargar / Limpiar ─────────────────
  function copiarJSON() {
    if (!jsonResultado) return;
    navigator.clipboard.writeText(jsonResultado)
      .then(() => mostrarToast("📋 JSON copiado al portapapeles"))
      .catch(() => mostrarToast("❌ No se pudo copiar — usa Ctrl+C sobre el texto"));
  }

  function descargarJSON() {
    if (!jsonResultado) return;
    const blob = new Blob([jsonResultado], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = nombreBase + ".json";
    a.click();
    URL.revokeObjectURL(url);
    mostrarToast("💾 Descargando " + nombreBase + ".json");
  }

  function limpiarTodo() {
    workbook = null; jsonResultado = "";
    document.getElementById("fileInput").value            = "";
    document.getElementById("archivoInfo").style.display  = "none";
    document.getElementById("outputSection").style.display   = "none";
    document.getElementById("warningsSection").style.display = "none";
    document.getElementById("checklistSection").style.display= "none";
    document.getElementById("btnConvertir").disabled = true;
    document.getElementById("btnCopiar").disabled    = true;
    document.getElementById("btnDescargar").disabled = true;
    document.getElementById("jsonOutput").value      = "";
    mostrarToast("🗑️ Limpiado");
  }

  // ── Toast ─────────────────────────────────────────
  function mostrarToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3200);
  }
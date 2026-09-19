async function descargarExcel() {

  // ==========================
  // VALIDACIÓN: OBLIGATORIO SELECCIONAR SI o NO
  // ==========================
  const seleccion = document.querySelector('input[name="actualizacionDatos"]:checked');
  if (!seleccion) {
    await Swal.fire({
      title: "Selecciona una opción",
      text: "Debes marcar SI o NO en 'Actualización de datos en APOLO' antes de generar el Excel.",
      icon: "warning",
      confirmButtonText: "Entendido"
    });
    return; // Detener ejecución si no hay selección
  }

  // Guardar valor elegido (si/no)
  const valorSeleccionado = seleccion.value;
  console.log("Opción elegida:", valorSeleccionado);

// ==========================
// OBTENER NOMBRE Y CORREO DEL EJECUTIVO (ingreso manual)
// ==========================
const nombreEjecutivo = document.getElementById("nombreEjecutivo").value.trim();
const emailEjecutivo = document.getElementById("emailEjecutivo").value.trim();

if (!nombreEjecutivo || !emailEjecutivo) {
    Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Debes ingresar el nombre y el correo del Ejecutivo de Asistencia Empresarial antes de descargar el Excel.',
        confirmButtonColor: '#091057'
    });
    return;
}
  // ==========================
  // PLANTILLA FIJA DE COLUMNAS
  // ==========================
  const fila = {
    "Fecha de Acompañamiento": document.getElementById("fecha").value || "",
    "NIT": document.getElementById("nit").value || "",
    "Razón Social": document.getElementById("empresa").value || "",
    "Asesor Comercial": document.getElementById("asesor").value || "",
    "Alerta Ciclo Cobro UGPP": document.getElementById("alertaCiclo")?.value || "",
    "Contactos Empresa": document.getElementById("representante").value || "",
    "Ejecutivo Asistencia Empresarial": nombreEjecutivo,
    "E-mail Ejecutivo": document.getElementById("emailEjecutivo").value || "",

    "Deuda Presunta (PO)": document.getElementById("valorDeudaPresunta").value || "",
    "Observación DP (PO)": document.getElementById("obsDeudaPresunta").value || "",

    "Deuda Real (PO)": document.getElementById("valorDeudaReal").value || "",
    "Observación DR (PO)": document.getElementById("obsDeudaReal").value || "",

    "Pagos sin planilla (PO)": document.getElementById("valorPagosPO").value || "",
    "Observación PSP (PO)": document.getElementById("obsPagosPO").value || "",

    "Rezagos sin Acreditar (PO)": document.getElementById("valorAportesPO").value || "",
    "Observación RSA (PO)": document.getElementById("obsAportesPO").value || "",

    "Pagos sin planilla (CES)": document.getElementById("valorPagosCES").value || "",
    "Observación PSP (CES)": document.getElementById("obsPagosCES").value || "",

    "Pagos sin planilla (PV)": document.getElementById("valorPagosPV").value || "",
    "Observación PSP (PV)": document.getElementById("obsPagosPV").value || "",

    "Rezagos sin Acreditar (PV)": document.getElementById("valorAportesPV").value || "",
    "Observación RSA (PV)": document.getElementById("obsAportesPV").value || "",

    "Clave Empresarial Portal WEB":
      document.querySelector('input[name="claveEmpresarial"]:checked')?.value || "",

    "Observación Clave Empresarial":
      document.getElementById("obsClaveEmpresarial").value || "",

    "Observación Asesoría General Portal WEB":
      document.getElementById("obsAsesoriaGeneral").value || "",

    "Actualización de Datos":
      document.querySelector('input[name="actualizacionDatos"]:checked')?.value || "",

    "CASOS PENDIENTES DE GESTIÓN (PQR)":
      document.getElementById("obsCasosPendientes").value || "",

    "Compromisos Empleador":
      document.getElementById("obsCompromisosEmpleador").value || "",

    "Compromisos Protección":
      document.getElementById("obsCompromisosProteccion").value || "",

    "Nuevo Agendamiento":
      document.querySelector('input[name="proximoEncuentro"]:checked')?.value || "",

    "Detalle del próximo encuentro / observaciones":
      document.getElementById("obsProximoEncuentro").value || "",

    "Encuesta de Satisfacción":
      document.querySelector('input[name="encuestaSatisfaccion"]:checked')?.value || "",

    "Caso Salesforce":
      document.getElementById("casoSalesforce")?.value || ""
  };

  // =====================
  // HISTÓRICO LOCALFORAGE
  // =====================
  let historial = await localforage.getItem("historicoVisitas") || [];
  historial.push(fila);

  await localforage.setItem("historicoVisitas", historial);

  // =====================
  // CREAR EXCEL
  // =====================
  const ws = XLSX.utils.json_to_sheet(historial);

  // Ajustar ancho columnas
  ws["!cols"] = Object.keys(fila).map(() => ({ wch: 35 }));

  // Wrap text (saltos de línea)
  Object.keys(ws).forEach(cell => {
    if (cell[0] === "!") return;
    ws[cell].s = {
      alignment: {
        wrapText: true,
        vertical: "top"
      }
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Informe");

  XLSX.writeFile(wb, "Informe_Acompanamiento.xlsx");

  marcarExcelDescargado();
}

// _____________________Fin Función Excel_____________________ //

async function generarPDF() {

  const { jsPDF } = window.jspdf;

  try {

    if (!verificarPermisoPDF()) return;

    Swal.fire({
      title: "Generando PDF...",
      text: "Preparando documento de alta calidad",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const header = document.querySelector("header");
    const main = document.querySelector("main");

    if (!header || !main) {
      throw new Error("No se encontró contenido");
    }

    // =============================
    // CONTENEDOR TEMPORAL
    // =============================
    const captura = document.createElement("div");
    captura.style.background = "#fff";
    captura.style.position = "absolute";
    captura.style.left = "-10000px";
    captura.style.top = "0";
    captura.style.width = main.offsetWidth + "px";
    captura.style.zIndex = "1";

    // =============================
    // HEADER SIN MENU
    // =============================
    const headerClone = header.cloneNode(true);
    const nav = headerClone.querySelector(".header-title0");
    if (nav) nav.remove();

    captura.appendChild(headerClone);

    // =============================
    // MAIN CLON
    // =============================
    const mainClone = main.cloneNode(true);

    const botones = mainClone.querySelector(".botones-container");
    if (botones) botones.remove();

    captura.appendChild(mainClone);

    // =============================
    // COPIAR VALORES DE INPUTS
    // =============================
    const inputsOriginales = main.querySelectorAll("input");
    const inputsClonados = mainClone.querySelectorAll("input");
    
    inputsOriginales.forEach((input, index) => {
      if (inputsClonados[index]) {
        if (input.type === "checkbox" || input.type === "radio") {
          inputsClonados[index].checked = input.checked;
        } else {
          inputsClonados[index].value = input.value;
        }
      }
    });

    // =============================
    // COPIAR VALORES DE SELECTS
    // =============================
    const selectsOriginales = main.querySelectorAll("select");
    const selectsClonados = mainClone.querySelectorAll("select");
    
    selectsOriginales.forEach((select, index) => {
      if (selectsClonados[index]) {
        selectsClonados[index].value = select.value;
      }
    });

    // =============================
    // CONVERTIR TEXTAREAS A DIVS
    // =============================
    const textareasOriginales = main.querySelectorAll("textarea");
    const textareasClonados = mainClone.querySelectorAll("textarea");
    
    textareasOriginales.forEach((textarea, index) => {
      if (textareasClonados[index]) {
        const textoOriginal = textarea.value;
        
        // Crear un DIV que reemplace el textarea
        const divReemplazo = document.createElement("div");
        
        // Copiar estilos del textarea
        const estilosComputados = window.getComputedStyle(textarea);
        divReemplazo.style.cssText = textarea.style.cssText;
        divReemplazo.style.width = estilosComputados.width;
        divReemplazo.style.minHeight = estilosComputados.minHeight;
        divReemplazo.style.padding = estilosComputados.padding;
        divReemplazo.style.border = estilosComputados.border;
        divReemplazo.style.borderRadius = estilosComputados.borderRadius;
        divReemplazo.style.backgroundColor = estilosComputados.backgroundColor;
        divReemplazo.style.fontFamily = estilosComputados.fontFamily;
        divReemplazo.style.fontSize = estilosComputados.fontSize;
        divReemplazo.style.lineHeight = estilosComputados.lineHeight;
        divReemplazo.style.color = estilosComputados.color;
        
        // Estilos adicionales para el texto
        divReemplazo.style.whiteSpace = "pre-wrap";
        divReemplazo.style.wordWrap = "break-word";
        divReemplazo.style.overflow = "visible";
        divReemplazo.style.boxSizing = "border-box";
        
        // Preservar el id para que el bloque de sincronización pueda encontrarlo después
        if (textareasClonados[index].id) {
          divReemplazo.id = textareasClonados[index].id;
        }

        // Insertar el texto
        divReemplazo.textContent = textoOriginal;
        
        // Reemplazar el textarea con el div
        textareasClonados[index].parentNode.replaceChild(divReemplazo, textareasClonados[index]);
      }
    });

    // =============================
    // SINCRONIZAR VISIBILIDAD DE DIVS (antes textareas) CON CHECKBOXES
    // Se ejecuta DESPUÉS de la conversión a divs para no ser pisado por getComputedStyle.
    // Muestra el div SOLO si el check está marcado Y tiene texto — si vacío, oculto.
    // =============================
    const checksConToggle = [
      { checkId: "checkCasosPendientes",       obsId: "obsCasosPendientes"       },
      { checkId: "checkCompromisosEmpleador",  obsId: "obsCompromisosEmpleador"  },
      { checkId: "checkCompromisosProteccion", obsId: "obsCompromisosProteccion" },
    ];

    checksConToggle.forEach(({ checkId, obsId }) => {
      const checkOriginal = main.querySelector(`#${checkId}`);
      // Buscar el div reemplazo por data-id o buscar el que quedó en esa posición
      // buscamos por id en el clon
      const divClonado = mainClone.querySelector(`#${obsId}`);

      if (checkOriginal) {
        const tieneTexto = document.getElementById(obsId)?.value?.trim() !== "";
        const mostrar = checkOriginal.checked && tieneTexto;

        if (divClonado) {
          divClonado.style.display = mostrar ? "block" : "none";
        }
      }
    });

    // =============================
    // SINCRONIZAR VISIBILIDAD DE SUBCHECKS (gestión de deudas e inconsistencias)
    // Mismo problema: cloneNode copia display del DOM real sin respetar el estado
    // del subcheck. Se oculta el textarea/div si el check no está marcado o está vacío.
    // =============================
    mainClone.querySelectorAll(".subcheck").forEach(checkClonado => {
      const checkOriginal = main.querySelector(`#${checkClonado.id}`);
      if (!checkOriginal) return;

      const filaClonada = checkClonado.closest(".check-item");
      if (!filaClonada) return;

      const divObs = filaClonada.nextElementSibling;
      if (!divObs) return;

      const estaChecked = checkOriginal.checked;
      const obsId = divObs.id;
      const tieneTexto = obsId
        ? document.getElementById(obsId)?.value?.trim() !== ""
        : false;

      divObs.style.display = (estaChecked && tieneTexto) ? "block" : "none";
    });

    // =============================
    // LIMPIAR PLACEHOLDERS INPUTS
    // =============================
    captura.querySelectorAll("input").forEach(input => {
      const ph = input.getAttribute("placeholder");
      if (ph && !ph.includes("$")) {
        input.setAttribute("placeholder", "");
      }
    });

    // =============================
    // OCULTAR CAMPOS NO-PDF EN EL CLON
    // Campos marcados con clase .no-pdf no deben aparecer en el documento
    // =============================
    captura.querySelectorAll('.no-pdf').forEach(el => {
      el.classList.add('no-pdf-oculto');
    });

    document.body.appendChild(captura);

    // Delay para renderizado
    await new Promise(resolve => setTimeout(resolve, 150));

    // =============================
    // CAPTURA DE ALTA CALIDAD
    // =============================
    const canvas = await html2canvas(captura, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: false,
      imageTimeout: 0,
      width: captura.scrollWidth,
      height: captura.scrollHeight,
      windowWidth: captura.scrollWidth,
      windowHeight: captura.scrollHeight,
      removeContainer: false,
      foreignObjectRendering: false
    });

    document.body.removeChild(captura);

    if (!canvas.width || !canvas.height) {
      throw new Error("Canvas vacío");
    }

    // =============================
    // CREAR PDF CON MEJOR CALIDAD
    // =============================
    const imgData = canvas.toDataURL("image/jpeg", 0.88);

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = 210;
    const pageHeight = 297;

    const imgProps = pdf.getImageProperties(imgData);

    const imgHeight =
      (imgProps.height * pdfWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = 0;

    // PRIMERA PAGINA
    pdf.addImage(
      imgData,
      "JPEG",
      0,
      position,
      pdfWidth,
      imgHeight,
      undefined,
      "SLOW"
    );

    heightLeft -= pageHeight;

    // PAGINAS EXTRA
    while (heightLeft > 0) {

      position = heightLeft - imgHeight;

      pdf.addPage();

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        pdfWidth,
        imgHeight,
        undefined,
        "SLOW"
      );

      heightLeft -= pageHeight;
    }

    pdf.save("Informe_Acompanamiento.pdf");

    Swal.fire({
      icon: "success",
      title: "PDF generado",
      text: "Documento de alta calidad creado exitosamente",
      timer: 2000,
      showConfirmButton: false
    });

  } catch (error) {

    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Error al generar PDF",
      text: "No fue posible crear el documento."
    });
  }
}
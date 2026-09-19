// ======================================
// AUTOSAVE + RECUPERACIÓN (SweetAlert2)
// ======================================

const KEY_VISITA = "visitaActual";
let autoSaveTimer;


// ===========================
// GUARDAR VISITA
// ===========================
async function guardarVisitaAuto() {

  const datos = {};

  // inputs y textareas
  document.querySelectorAll("input, textarea, select").forEach(el => {

    // ⚡ RADIOS: Se guardan por NAME, no por ID
    if (el.type === "radio") {
      if (el.checked) datos[el.name] = el.value;
      return;
    }

    // El resto necesita ID
    if (!el.id) return;

    if (el.type === "checkbox") {
      datos[el.id] = el.checked;
      return;
    }

    datos[el.id] = el.value;
  });

  await localforage.setItem(KEY_VISITA, datos);
  console.log("💾 Datos guardados:", datos);
}



// ===========================
// AUTOGUARDADO (DEBOUNCE)
// ===========================
function programarAutoGuardado() {

  clearTimeout(autoSaveTimer);

  autoSaveTimer = setTimeout(async () => {
    try {
      await guardarVisitaAuto();
      console.log("✔ Autoguardado");
    } catch (err) {
      console.error("Error autoguardado:", err);
    }
  }, 2000);

}


// ===========================
// ACTIVAR AUTOGUARDADO
// ===========================
function activarAutoguardado() {

  document.addEventListener("input", programarAutoGuardado);
  document.addEventListener("change", programarAutoGuardado);

}


// ===========================
// CARGAR DATOS EN FORMULARIO
// ===========================
function aplicarDatosFormulario(datos) {

  // PASO 1: Cargar todos los valores
Object.keys(datos).forEach(key => {

    const el = document.getElementById(key);

    if (el) {
      if (el.type === "checkbox") {
        el.checked = datos[key];
        return;
      }
      el.value = datos[key];
      return; 
    }

    // Solo buscar radios si NO encontró elemento por ID
    // Y solo si el valor es corto y seguro (sin caracteres problemáticos)
    const valor = datos[key];
    if (typeof valor === "string" && valor.length < 50 && !/["<>\n\r\\]/.test(valor)) {
      try {
        const radio = document.querySelector(
          `input[name="${key}"][value="${valor}"]`
        );
        if (radio) radio.checked = true;
      } catch (e) {
        console.warn(`⚠️ Selector inválido para [${key}]:`, e.message);
      }
    }
});

  // PASO 2: Restaurar visibilidad de observaciones
  restaurarVisibilidadObservaciones();
}


// ===========================
// RESTAURAR VISIBILIDAD
// ===========================
function restaurarVisibilidadObservaciones() {
  
  // 🔥 SUBCHECKS (Deudas, Inconsistencias, etc.)
  document.querySelectorAll(".subcheck").forEach(check => {
    if (check.checked) {
      const fila = check.closest(".check-item");
      if (!fila) return;
      
      const textarea = fila.nextElementSibling;
      if (textarea && textarea.tagName === "TEXTAREA") {
        textarea.style.display = "block";
      }
    }
  });

  // 🔥 CHECKBOXES PRINCIPALES con observaciones (Casos Pendientes, Compromisos)
  const checksPrincipales = [
    { checkId: 'checkCasosPendientes', obsId: 'obsCasosPendientes' },
    { checkId: 'checkCompromisosEmpleador', obsId: 'obsCompromisosEmpleador' },
    { checkId: 'checkCompromisosProteccion', obsId: 'obsCompromisosProteccion' }
  ];

  checksPrincipales.forEach(({ checkId, obsId }) => {
    const check = document.getElementById(checkId);
    const obs = document.getElementById(obsId);
    
    if (check && check.checked && obs) {
      obs.style.display = "block";
    }
  });

  // 🔥 PRÓXIMO ENCUENTRO (radio)
  const radioProximo = document.querySelector('input[name="proximoEncuentro"]:checked');
  if (radioProximo && radioProximo.value === "si") {
    const container = document.getElementById("proximoObservacionContainer");
    if (container) {
      container.style.display = "flex";
    }
  }

  // 🔥 CLAVE EMPRESARIAL (resaltar si es NO)
  const radioClave = document.querySelector('input[name="claveEmpresarial"]:checked');
  const obsClave = document.getElementById("obsClaveEmpresarial");
  if (radioClave && radioClave.value === "no" && obsClave) {
    obsClave.style.borderColor = "var(--color-1)";
  }

  // 🔥 LOGS PARA DEBUGGING - Ver qué radios se recuperaron
  console.log("📻 Radios recuperados:");
  console.log("  - Clave Empresarial:", document.querySelector('input[name="claveEmpresarial"]:checked')?.value || "ninguno");
  console.log("  - Actualización Datos:", document.querySelector('input[name="actualizacionDatos"]:checked')?.value || "ninguno");
  console.log("  - Encuesta Satisfacción:", document.querySelector('input[name="encuestaSatisfaccion"]:checked')?.value || "ninguno");
  console.log("  - Próximo Encuentro:", document.querySelector('input[name="proximoEncuentro"]:checked')?.value || "ninguno");
}



// ===========================
// RECUPERAR CON SWEETALERT
// ===========================
async function recuperarInformacion() {

  const datos = await localforage.getItem(KEY_VISITA);

  if (!datos) {

    await Swal.fire({
      icon: "info",
      title: "Sin información",
      text: "No hay datos guardados para recuperar."
    });

    return;
  }

  const respuesta = await Swal.fire({
    title: "Recuperar información",
    text: "Se cargarán los datos guardados automáticamente.",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Recuperar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#3085d6"
  });

  if (!respuesta.isConfirmed) return;

  aplicarDatosFormulario(datos);

  await Swal.fire({
    icon: "success",
    title: "Información recuperada",
    timer: 1500,
    showConfirmButton: false
  });
}


// ===========================
// INICIO AUTOMÁTICO
// ===========================
document.addEventListener("DOMContentLoaded", () => {
  activarAutoguardado();
});
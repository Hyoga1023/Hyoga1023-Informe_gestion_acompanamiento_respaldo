// ============================================================
// ORDEN_DOCUMENTOS.JS
// Control de flujo: el Excel debe descargarse ANTES del PDF
// - Persiste solo en sesión (se reinicia al recargar)
// - Se reinicia también al limpiar el formulario
// ============================================================

// ============================================================
// ESTADO: bandera en memoria de sesión
// ============================================================
let excelDescargado = false;

// ============================================================
// FUNCIÓN PÚBLICA: llamar desde limpiar.js cuando se limpie
// el formulario para reiniciar el candado del PDF
// ============================================================
function reiniciarCandadoPDF() {
  excelDescargado = false;
}

// ============================================================
// FUNCIÓN: Verificar si se puede generar el PDF
// Retorna true si está permitido, false si está bloqueado
// ============================================================
function verificarPermisoPDF() {
  if (!excelDescargado) {
    Swal.fire({
      icon: "warning",
      title: "¡Primero descarga el Excel!",
      html: `
        Para generar el PDF primero debes guardar el registro 
        descargando el <strong>Excel</strong>.<br><br>
      `,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#cf7712",
      allowOutsideClick: false
    });
    return false;
  }
  return true;
}

// ============================================================
// FUNCIÓN: Marcar que el Excel ya fue descargado
// Se llama desde descargarExcel() en botones_finales.js
// ============================================================
function marcarExcelDescargado() {
  excelDescargado = true;
}
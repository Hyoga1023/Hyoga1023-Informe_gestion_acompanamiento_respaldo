// ============================================
// FECHA.JS - Manejo exclusivo del campo fecha
// Informe de Acompañamiento Empresas
// ============================================

document.addEventListener("DOMContentLoaded", () => {

  const inputFecha = document.getElementById("fecha");

  if (!inputFecha) return; // Si no existe el campo, no hace nada

  // ============================================
  // CARGAR FECHA DE HOY POR DEFECTO
  // Solo si el campo está vacío (respeta autosave)
  // ============================================
  if (!inputFecha.value) {
    inputFecha.value = obtenerFechaHoy();
  }

});

// ============================================
// FUNCIÓN: Retorna la fecha actual en formato
// YYYY-MM-DD (requerido por input type="date")
// ============================================
function obtenerFechaHoy() {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}
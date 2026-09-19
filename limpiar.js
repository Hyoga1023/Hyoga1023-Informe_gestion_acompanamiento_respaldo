async function limpiarFormulario() {

  const resultado = await Swal.fire({
    title: "¿Limpiar formulario?",
    text: "Se borrarán los datos actuales ingresados.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, limpiar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "rgb(8, 8, 8)",
    reverseButtons: true
  });

  if (!resultado.isConfirmed) return;

  // =========================
  // LIMPIAR TODOS LOS CAMPOS
  // =========================
  document.querySelectorAll("input, textarea, select").forEach(el => {

    if (el.type === "radio" || el.type === "checkbox") {
      el.checked = false;
      return;
    }

    if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
      return;
    }

    el.value = "";
  });

  // borrar solo autoguardado actual
  await localforage.removeItem("visitaActual");

  reiniciarCandadoPDF();

  await Swal.fire({
    icon: "success",
    title: "Formulario limpio",
    timer: 1300,
    showConfirmButton: false
  });
}
  
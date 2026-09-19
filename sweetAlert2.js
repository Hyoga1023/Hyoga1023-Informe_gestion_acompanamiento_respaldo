async function borrarDatos() {

const resultado = await Swal.fire({
    title: "¿Borrar histórico de Excel?",
    text: "Esto eliminará solo el historial exportado. La base de datos seguirá intacta. Aun así… el mundo, como lo conoces, podría desaparecer!",
    imageUrl: "img/calavera.png",
    imageWidth: 100,
    imageHeight: 100,
    imageAlt: "Peligro",
    showCancelButton: true,
    confirmButtonText: "Sí, borrar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    reverseButtons: true
  });

  if (!resultado.isConfirmed) return;

  try {

    // SOLO limpiar el histórico del Excel
    await localforage.setItem("historicoVisitas", []);

    await Swal.fire({
      title: "Historial eliminado",
      text: "El histórico de Excel fue borrado correctamente.",
      icon: "success",
      timer: 1800,
      showConfirmButton: false
    });

  } catch (error) {

    console.error(error);

    await Swal.fire({
      title: "Error",
      text: "No se pudo borrar el histórico.",
      icon: "error"
    });

  }
}

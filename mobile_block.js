// ============================================
// BLOQUEO PARA PANTALLAS MÓVILES CON SWEETALERT2
// Umbral: menos de 968px de ancho
// ============================================

(function () {
  const UMBRAL = 768;
  let alertaActiva = false;

  function mostrarAlertaMovil() {
    if (alertaActiva) return;
    alertaActiva = true;

    Swal.fire({
      icon: "error",
      title: "Dispositivo no compatible",
      html: `
        <div style="text-align: center; line-height: 1.7; color: #091057;">
          <p style="font-size: 1rem; margin-bottom: 12px;">
            El <strong>Informe de Acompañamiento Empresas</strong> fue diseñado 
            exclusivamente para <strong>portátil o PC de escritorio</strong>.
          </p>
          <p style="font-size: 0.9rem; color: #555;">
            Por favor accede desde un dispositivo con pantalla más grande para 
            disfrutar de la experiencia completa.
          </p>
          <div style="
            margin-top: 16px;
            background: rgba(223, 202, 14, 0.15);
            border: 1.5px solid #dfca0e;
            border-radius: 8px;
            padding: 10px 16px;
            font-size: 0.85rem;
            color: #091057;
          ">
            📐 Resolución mínima recomendada: <strong>968px</strong>
          </div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      showCloseButton: false,
      backdrop: `rgba(9, 16, 87, 0.92)`,
      customClass: {
        popup: "swal-mobile-block",
        title: "swal-mobile-title",
        icon: "swal-mobile-icon"
      }
    });
  }

  function cerrarAlertaMovil() {
    if (!alertaActiva) return;
    alertaActiva = false;
    Swal.close();
  }

  function verificarPantalla() {
    if (window.innerWidth < UMBRAL) {
      mostrarAlertaMovil();
    } else {
      cerrarAlertaMovil();
    }
  }

  // Esperar a que SweetAlert2 esté disponible
  function iniciar() {
    if (typeof Swal === "undefined") {
      setTimeout(iniciar, 100);
      return;
    }
    verificarPantalla();
  }

  document.addEventListener("DOMContentLoaded", iniciar);

  // Resize con debounce
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(verificarPantalla, 200);
  });
})();
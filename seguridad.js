document.addEventListener("DOMContentLoaded", () => {

    const PASSWORD = "proteccion123";

    function bloquearApp() {
        document.querySelector("main").style.display = "none";
    }

    function desbloquearApp() {
        document.querySelector("main").style.display = "flex";
    }

    function pedirClave() {

        const mostrarError = () => {
            document.body.innerHTML = `
                <div style="color:white; text-align:center; margin-top:20%;">
                    <h1>Acceso Denegado</h1>
                    <p>Intento no autorizado</p>
                </div>
            `;
        };

        const accesoConcedido = () => {
            Swal.fire({
                icon: 'success',
                title: 'Acceso concedido',
                timer: 1000,
                showConfirmButton: false,
                background: '#0b0f1a',
                color: '#00e5ff'
            });

            desbloquearApp();
        };

        Swal.fire({
    title: 'ACCESO RESTRINGIDO',
    html: '<span style="opacity:0.8;">ingrese la contraseña</span>',
    input: 'password',
    inputPlaceholder: '...',
    inputAttributes: {
        autocomplete: 'new-password'
    },
    allowOutsideClick: false,
    allowEscapeKey: false,
    confirmButtonText: 'VALIDAR',
    confirmButtonColor: '#dfca0e', // 🟡 color principal

    // estilo corporativo oscuro
    background: '#091057', // 🔵 azul corporativo
    color: '#ffffff',      // ⚪ texto limpio

    backdrop: 'rgba(0,0,0,0.95)',

    customClass: {
        popup: 'swal-proteccion',
        title: 'swal-title-proteccion',
        confirmButton: 'swal-btn-proteccion'
    },

    didOpen: () => {
        const input = Swal.getInput();
        if (input) input.value = "";
    },

    preConfirm: (value) => {

        const audio = new Audio("https://www.soundjay.com/button/beep-07.wav");
        audio.volume = 0.4;
        audio.play().catch(() => {});

        if (value !== PASSWORD) {
            Swal.showValidationMessage('Credencial inválida');
            return false;
        }

        return true;
    }

        }).then(({ isConfirmed }) => {

            if (isConfirmed) {
                accesoConcedido();
            } else {
                mostrarError();
            }

        });

    }

    // Inicio
    bloquearApp();
    pedirClave();

});
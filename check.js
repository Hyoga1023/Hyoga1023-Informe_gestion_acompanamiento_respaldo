document.addEventListener("DOMContentLoaded", () => {

   // ────────────────────────────────────────────────
  // Subchecks → solo habilitar textarea (valor ya está habilitado)
  // ────────────────────────────────────────────────
  document.querySelectorAll(".subcheck").forEach(check => {
    check.addEventListener("change", function () {
      const fila = this.closest(".check-item");
      if (!fila) return;

      const textarea = fila.nextElementSibling;

      if (this.checked) {
        if (textarea) textarea.style.display = "block";
      } else {
        if (textarea) {
          textarea.style.display = "none";
          textarea.value = "";
        }
      }
    });
  });

  // ────────────────────────────────────────────────
  // Formato moneda COP
  // ────────────────────────────────────────────────
  document.querySelectorAll(".moneda").forEach(input => {
    input.addEventListener("input", function () {
      let valor = this.value.replace(/\D/g, "");
      if (!valor) {
        this.value = "";
        return;
      }
      this.value = "$" + Number(valor).toLocaleString("es-CO");

      // ✅ Si ya hay número, quitar error visual
      this.style.borderColor = "#E0E0E0";
    });
  });

  // ────────────────────────────────────────────────
  // Lógica para Clave Empresarial
  // ────────────────────────────────────────────────
  const radiosClave = document.querySelectorAll('input[name="claveEmpresarial"]');
  const obsClave = document.getElementById("obsClaveEmpresarial");

  if (radiosClave.length > 0 && obsClave) {
    radiosClave.forEach(radio => {
      radio.addEventListener("change", () => {
        if (radio.value === "no") {
          obsClave.style.borderColor = "var(--color-1)";
        } else {
          obsClave.style.borderColor = "#E0E0E0";
        }
      });
    });
  }

  // ────────────────────────────────────────────────
  // Lógica para Próximo Encuentro
  // ────────────────────────────────────────────────
  const radiosProximo = document.querySelectorAll('input[name="proximoEncuentro"]');
  const container = document.getElementById("proximoObservacionContainer");

  function toggleProximoEncuentro() {
    const seleccionado = document.querySelector('input[name="proximoEncuentro"]:checked');
    if (!container) return;
    container.style.display = seleccionado?.value === "si" ? "flex" : "none";
  }

  radiosProximo.forEach(r => r.addEventListener("change", toggleProximoEncuentro));
  toggleProximoEncuentro();

  // ────────────────────────────────────────────────
  // VALIDACIÓN: si hay observación → valor obligatorio
  // ────────────────────────────────────────────────
  function getErrorActivo() {
    return [...document.querySelectorAll(".check-textarea")].find(textarea => {
      const fila = textarea.previousElementSibling;
      if (!fila) return false;
      const valor = fila.querySelector(".valor-input");
      if (!valor) return false;
      return textarea.value.trim() !== "" && valor.value.trim() === "";
    });
  }

  document.querySelectorAll(".check-textarea").forEach(textarea => {
    textarea.addEventListener("input", function () {
      const fila = this.previousElementSibling;
      if (!fila) return;

      const valor = fila.querySelector(".valor-input");
      if (!valor) return;

      if (this.value.trim() !== "") {
        valor.required = true;
        valor.style.borderColor = valor.value.trim() === "" ? "red" : "#E0E0E0";
      } else {
        valor.required = false;
        valor.style.borderColor = "#E0E0E0";
      }
    });
  });

  // ────────────────────────────────────────────────
  // BLOQUEO INTELIGENTE (pero deja escribir en valor)
  // ────────────────────────────────────────────────
  document.addEventListener("click", function (e) {
    const errorTextarea = getErrorActivo();
    if (!errorTextarea) return;

    const fila = errorTextarea.previousElementSibling;
    const valor = fila?.querySelector(".valor-input");

    if (valor && (e.target === valor || valor.contains(e.target))) return;

    if (e.target === errorTextarea || errorTextarea.contains(e.target)) return;

    // ❌ Todo lo demás se bloquea
    e.preventDefault();
    e.stopPropagation();
    valor?.focus();
    valor.style.borderColor = "red";
    alert("Debe ingresar el valor antes de continuar.");
  }, true);
});
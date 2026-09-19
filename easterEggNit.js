let nitEasterUsed = false;

document.addEventListener("DOMContentLoaded", () => {
  const nitInput = document.getElementById("nit");
  const textEl = document.getElementById("easterText");

  if (!nitInput) return;

  nitInput.addEventListener("input", () => {
    if (nitInput.value === "000000000" && !nitEasterUsed) {
      nitEasterUsed = true;
      runSequence(textEl);
    }
  });
});

function runSequence(el) {
  showMessage(el, "Este es mi juego", () => {
    showMessage(el, "Y tú estás en él", () => {
      setTimeout(() => {
        window.location.href = "https://hyoga1023.github.io/Lunar-Landing/";
      }, 800);
    });
  });
}

function showMessage(el, text, callback) {
  el.textContent = text;
  el.classList.remove("hidden");
  el.classList.remove("fade-out");
  el.classList.add("fade-in");

  setTimeout(() => {
    el.classList.remove("fade-in");
    el.classList.add("fade-out");

    setTimeout(() => {
      el.classList.add("hidden");
      if (callback) callback();
    }, 1600);
  }, 2500);
}

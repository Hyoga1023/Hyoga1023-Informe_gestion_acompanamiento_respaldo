let live2dVisible = false;

function showLive2D() {
  if (live2dVisible) return;
  live2dVisible = true;

  L2Dwidget.init({
    model: {
      jsonPath: "unitychan.model.json",
      scale: 1.2
    },
    display: {
      position: "right",
      width: 200,
      height: 300,
      hOffset: 0,
      vOffset: -20
    },
    mobile: {
      show: false
    },
    react: {
      opacityDefault: 1,
      opacityOnHover: 1
    }
  });
}

function hideLive2D() {
  const canvas = document.getElementById("live2d-widget");
  if (canvas) canvas.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const phrase = "no estamos solos";
  const textareas = document.querySelectorAll("textarea");

  textareas.forEach(area => {
    area.addEventListener("input", () => {
      const value = area.value.toLowerCase();
      if (value.includes(phrase)) {
        showLive2D();
      }
    });
  });
});

const hamburgerBtn = document.getElementById("hamburgerBtn");
const menuPanel = document.getElementById("menuPanel");

let hideTimeout;

hamburgerBtn.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
  menuPanel.classList.add("show");
});

hamburgerBtn.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    menuPanel.classList.remove("show");
  }, 300);
});

menuPanel.addEventListener("mouseenter", () => {
  clearTimeout(hideTimeout);
});

menuPanel.addEventListener("mouseleave", () => {
  hideTimeout = setTimeout(() => {
    menuPanel.classList.remove("show");
  }, 300);
});

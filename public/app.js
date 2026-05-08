const yearElement = document.querySelector("#year");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const serviceForm = document.querySelector("#serviceForm");
const formStatus = document.querySelector("#formStatus");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

if (navToggle && siteNav) {
  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function drawHeroCanvas() {
  const canvas = document.querySelector("#heroCanvas");
  if (!canvas) return;

  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.offsetWidth;
  const height = canvas.offsetHeight;

  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  const columns = Math.ceil(width / 92);
  const rows = Math.ceil(height / 72);

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = col * 92 + (row % 2) * 28;
      const y = row * 72;
      const shade = (row + col) % 3 === 0 ? "rgba(15, 118, 110, 0.38)" : "rgba(196, 81, 45, 0.22)";

      context.strokeStyle = shade;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, y + 22);
      context.lineTo(x + 44, y);
      context.lineTo(x + 88, y + 22);
      context.lineTo(x + 88, y + 58);
      context.lineTo(x + 44, y + 72);
      context.lineTo(x, y + 58);
      context.closePath();
      context.stroke();

      if ((row + col) % 4 === 0) {
        context.fillStyle = "rgba(15, 118, 110, 0.14)";
        context.fillRect(x + 28, y + 28, 32, 8);
      }
    }
  }
}

drawHeroCanvas();
window.addEventListener("resize", drawHeroCanvas);

if (serviceForm && formStatus) {
  serviceForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    formStatus.textContent = "Sending your request...";

    const formData = new FormData(serviceForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
      }

      formStatus.textContent = result.message;
      serviceForm.reset();
    } catch (error) {
      formStatus.textContent = error.message || "Unable to send the request right now.";
    }
  });
}

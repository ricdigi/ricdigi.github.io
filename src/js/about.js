function typeText(elementId, speed = 40, callback = null) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const fullText = el.getAttribute("data-text");
  if (!fullText) return;

  el.textContent = "";

  let i = 0;
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.textContent = "▍";
  cursor.setAttribute("aria-hidden", "true");
  el.after(cursor);

  const type = () => {
    if (i < fullText.length) {
      el.textContent += fullText.charAt(i++);
      let delay = speed;

      const char = fullText.charAt(i - 1);
      if ([",", "—", ";"].includes(char)) delay = 250;
      if ([".", "!", "?", ":"].includes(char)) delay = 400;

      setTimeout(type, delay);
    } else {
      cursor.remove();
      if (callback) callback();
    }
  };

  type();
}


window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    typeText("typed-title", 28, () => {
      typeText("typed-subtitle", 18);
    });
  }, 600);
});

document.addEventListener("mousemove", (e) => {
  const card = document.querySelector(".hero-card");
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = (e.clientX - centerX) / 60;
  const deltaY = (e.clientY - centerY) / 60;

  card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
});

document.addEventListener("mouseleave", () => {
  const card = document.querySelector(".hero-card");
  if (card) card.style.transform = "translate(0, 0)";
});

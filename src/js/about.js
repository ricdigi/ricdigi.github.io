function typeText(elementId, text, speed = 40, callback = null) {
  const el = document.getElementById(elementId);
  if (!el) return;

  let i = 0;
  const cursor = document.createElement("span");
  cursor.className = "typing-cursor";
  cursor.textContent = "▍";
  el.after(cursor);

  const type = () => {
    if (i < text.length) {
      el.textContent += text.charAt(i++);
      let delay = speed;

      const char = text.charAt(i - 1);
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
    typeText(
      "typed-title",
      "Hi, I’m Riccardo Di Girolamo, welcome to my website.",
      28,
      () => {
        typeText(
          "typed-subtitle",
          "On this website, you’ll find a selection of my projects, research explorations, and technical notes — spanning robotics, mechatronics, and intelligent systems.",
          18
        );
      }
    );
  }, 600); // delay in milliseconds
});


document.addEventListener("mousemove", (e) => {
  const card = document.querySelector(".hero-card");
  if (!card) return;

  const rect = card.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const deltaX = (e.clientX - centerX) / 40;
  const deltaY = (e.clientY - centerY) / 40;

  card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
});

document.addEventListener("mouseleave", () => {
  const card = document.querySelector(".hero-card");
  if (card) card.style.transform = "translate(0, 0)";
});



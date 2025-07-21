/* ========= Splash intro: run once, skip on internal nav ========= */
document.addEventListener('DOMContentLoaded', () => {
  const splash    = document.getElementById('splash-logo');
  const container = document.getElementById('container');   // has .hidden in HTML

  /* 1 ─ decide whether to play the intro */
  const navEntry  = performance.getEntriesByType('navigation')[0] || {};
  const cameFromMySite =
        document.referrer &&
        new URL(document.referrer).origin === location.origin;

  const playIntro =
        (navEntry.type === 'reload') ||          // hard refresh
        !cameFromMySite;                         // first/external visit

  /* 2 ─ skip intro on internal clicks */
  if (!playIntro) {
    splash.remove();                     // remove instantly
    container.classList.remove('hidden');  // show page grid
    container.classList.add('visible');
    return;
  }

  /* 3 ─ run intro sequence */
  container.classList.add('hidden');     // keep page transparent

  setTimeout(() => {
    splash.classList.add('fade-out');    // CSS handles fade to 0

    /* normal path: wait for opacity transition to finish */
    splash.addEventListener('transitionend', finish, { once: true });

    /* safety: force finish after 2 s in case event is missed */
    setTimeout(finish, 2000);
  }, 1600);                              // logo wiggle duration

  function finish() {
    if (!splash.parentNode) return;      // already removed
    splash.remove();
    container.classList.remove('hidden');
    container.classList.add('visible');  // fades page in
  }
});




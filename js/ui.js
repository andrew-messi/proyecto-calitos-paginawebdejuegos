document.addEventListener("DOMContentLoaded", () => {
  const soundToggle = document.getElementById("toggle-sound");
  const bgAudio = new Audio("./assets/audio/theme_loop.mp3");
  bgAudio.loop = true;
  bgAudio.volume = 0.3;

  soundToggle?.addEventListener("change", e => {
    e.target.checked ? bgAudio.play() : bgAudio.pause();
  });
});

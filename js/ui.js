// js/ui.js
// Lógica UI: toggles, botones y comunicación con la escena 3D

document.addEventListener('DOMContentLoaded', () => {
  const btnPlay = document.getElementById('btn-play');
  const ctaPlay = document.getElementById('cta-play');
  const toggleShadows = document.getElementById('toggle-shadows');
  const toggleEffects = document.getElementById('toggle-effects');
  const toggleSound = document.getElementById('toggle-sound');
  const selectQuality = document.getElementById('select-quality');
  const panel = document.getElementById('control-panel');

  // Cargar prefs guardadas
  try {
    const prefs = JSON.parse(localStorage.getItem('gtaAnimePrefs') || '{}');
    if(prefs.quality) selectQuality.value = prefs.quality;
    if(prefs.sound) toggleSound.checked = prefs.sound;
    if(prefs.effects !== undefined) toggleEffects.checked = prefs.effects;
    if(prefs.shadows !== undefined) toggleShadows.checked = prefs.shadows;
  } catch(e){ /* ignore */ }

  function savePrefs(){
    const prefs = {
      quality: selectQuality.value,
      sound: toggleSound.checked,
      effects: toggleEffects.checked,
      shadows: toggleShadows.checked
    };
    try { localStorage.setItem('gtaAnimePrefs', JSON.stringify(prefs)); } catch(e){}
  }

  // Play demo handlers
  const openPanel = () => {
    panel.classList.toggle('open');
    const pressed = panel.classList.contains('open');
    btnPlay?.setAttribute('aria-pressed', pressed ? 'true' : 'false');
  };

  btnPlay?.addEventListener('click', openPanel);
  ctaPlay?.addEventListener('click', () => {
    // Mover cámara (pide a app.js)
    if(window.gtaAnime && typeof window.gtaAnime.playCameraFocus === 'function'){
      window.gtaAnime.playCameraFocus();
    }
  });

  // Toggles
  toggleShadows?.addEventListener('change', (e) => {
    // Informa a la app: cambiar sombreados
    // Usamos CustomEvent para comunicar
    window.dispatchEvent(new CustomEvent('toggleShadows', {detail: e.target.checked}));
    savePrefs();
  });

  toggleEffects?.addEventListener('change', (e) => {
    // Simple: si se apagan efectos, reducimos el particle rotation
    window.dispatchEvent(new CustomEvent('toggleEffects', {detail: e.target.checked}));
    savePrefs();
  });

  // Audio control: pedir a app.js que active/desactive
  toggleSound?.addEventListener('change', (e) => {
    window.dispatchEvent(new CustomEvent('setSound', {detail: e.target.checked}));
    // app.js expone window.gtaAnime.toggleAudio
    if(window.gtaAnime && typeof window.gtaAnime.toggleAudio === 'function'){
      window.gtaAnime.toggleAudio(e.target.checked);
    }
    savePrefs();
  });

  selectQuality?.addEventListener('change', (e) => {
    const detail = e.target.value;
    // disparar un evento que app.js escucha para ajustar pixelRatio/shadows
    window.dispatchEvent(new CustomEvent('setQuality', {detail}));
    savePrefs();
  });

  // Responder a eventos desde app.js si se desean acciones adicionales
  window.addEventListener('setSound', (e) => {
    // si quieres manejar UI cuando audio cambie externamente
  });

  // Accessibility: close panel with Esc
  document.addEventListener('keydown', (ev) => {
    if(ev.key === 'Escape' && panel.classList.contains('open')){
      panel.classList.remove('open');
      btnPlay?.setAttribute('aria-pressed', 'false');
    }
  });

  // On load, ensure quality event fires once
  window.dispatchEvent(new CustomEvent('setQuality', {detail: selectQuality?.value || 'high'}));
});

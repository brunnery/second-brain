/* Small device helpers: beeps, vibration, keeping the screen awake. */
let ctx = null;
export function beep(freq = 880, ms = 140, volume = 0.18) {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = freq;
    g.gain.value = volume;
    o.connect(g).connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    o.stop(ctx.currentTime + ms / 1000 + 0.02);
  } catch { /* audio unavailable */ }
}
export const unlockAudio = () => beep(440, 10, 0.0001);
export const vibrate = (pattern = 200) => { try { navigator.vibrate?.(pattern); } catch { /* ignore */ } };

let lock = null;
export async function keepAwake(on) {
  try {
    if (on && "wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
    else if (!on && lock) { await lock.release(); lock = null; }
  } catch { /* not supported */ }
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

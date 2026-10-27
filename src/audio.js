let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setAudioEnabled(enabled) {
  soundEnabled = !!enabled;
}

export function isAudioEnabled() {
  return soundEnabled;
}

function playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15, startTime = 0) {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

    gain.gain.setValueAtTime(gainVal, ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + startTime);
    osc.stop(ctx.currentTime + startTime + duration);
  } catch (err) {
    // Graceful fallback on audio failure
  }
}

export function sfxSelect() {
  playTone(587.33, 'triangle', 0.08, 0.12); // D5
}

export function sfxBack() {
  playTone(329.63, 'sine', 0.09, 0.12); // E4
}

export function sfxCaptureThrow() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

export function sfxCaptureSuccess() {
  // 4-note victory jingle
  playTone(523.25, 'triangle', 0.12, 0.15, 0.0); // C5
  playTone(659.25, 'triangle', 0.12, 0.15, 0.13); // E5
  playTone(783.99, 'triangle', 0.15, 0.15, 0.26); // G5
  playTone(1046.50, 'triangle', 0.35, 0.18, 0.42); // C6
}

export function sfxCaptureFail() {
  playTone(392.00, 'sawtooth', 0.15, 0.12, 0.0);
  playTone(311.13, 'sawtooth', 0.25, 0.12, 0.16);
}

export function sfxHit() {
  playTone(130.81, 'square', 0.12, 0.18);
}

export function sfxSuperEffective() {
  playTone(440, 'square', 0.08, 0.15, 0.0);
  playTone(880, 'square', 0.18, 0.18, 0.08);
}

export function sfxLevelUp() {
  playTone(440, 'triangle', 0.1, 0.15, 0.0);
  playTone(554.37, 'triangle', 0.1, 0.15, 0.1);
  playTone(659.25, 'triangle', 0.1, 0.15, 0.2);
  playTone(880, 'triangle', 0.3, 0.18, 0.3);
}

export function sfxHeal() {
  playTone(659.25, 'sine', 0.12, 0.12, 0.0);
  playTone(783.99, 'sine', 0.12, 0.12, 0.12);
  playTone(987.77, 'sine', 0.25, 0.15, 0.24);
}

export function sfxAlarm() {
  playTone(880, 'sawtooth', 0.1, 0.15, 0.0);
  playTone(659.25, 'sawtooth', 0.1, 0.15, 0.12);
}

// Lightweight sound engine using the Web Audio API (no external assets required).
// Sounds are short synthesized tones so the app has no binary dependencies.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function beep(freq: number, durationMs: number, type: OscillatorType = 'sine', gain = 0.04) {
  const ac = getCtx();
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g);
  g.connect(ac.destination);
  const now = ac.currentTime;
  osc.start(now);
  g.gain.setValueAtTime(gain, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.stop(now + durationMs / 1000);
}

export type SoundEvent = 'notification' | 'invoice_generated' | 'invoice_deleted';

export function playSound(event: SoundEvent, enabled: boolean) {
  if (!enabled) return;
  switch (event) {
    case 'notification':
      beep(880, 140, 'sine');
      setTimeout(() => beep(1175, 140, 'sine'), 120);
      break;
    case 'invoice_generated':
      beep(660, 120, 'triangle');
      setTimeout(() => beep(990, 160, 'triangle'), 110);
      break;
    case 'invoice_deleted':
      beep(420, 180, 'sawtooth', 0.03);
      break;
  }
}

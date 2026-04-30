let ctx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  return ctx;
}

/**
 * Must be called from a user gesture (e.g. "Empezar Entrenamiento" tap)
 * to bypass autoplay restrictions.
 */
export async function unlockAudio(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore
    }
  }
  return ctx;
}

export function beep(durationMs = 150, frequency = 880, gap = 100) {
  const c = ctx;
  if (!c) return;

  const playTone = (when: number) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.frequency.value = frequency;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(0.25, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + durationMs / 1000);
    osc.connect(gain).connect(c.destination);
    osc.start(when);
    osc.stop(when + durationMs / 1000 + 0.02);
  };

  const start = c.currentTime;
  playTone(start);
  playTone(start + (durationMs + gap) / 1000);
}
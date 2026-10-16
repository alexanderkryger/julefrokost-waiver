// Små 8/16-bit-lyde via Web Audio. Ingen lydfiler.
let ctx: AudioContext | null = null;

function play(notes: number[], step = 0.07, type: OscillatorType = "square") {
  try {
    ctx ??= new AudioContext();
    const t0 = ctx.currentTime;
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      const t = t0 + i * step;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + step * 1.6);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + step * 1.7);
    });
  } catch {
    // Lyd er ikke kritisk.
  }
}

export const sfx = {
  move: () => play([1320], 0.035),
  start: () => play([392, 523, 659, 784, 1047, 1319], 0.06, "triangle"),
  // Lille fanfare når en helt vælges
  select: () => play([440, 466, 494, 523, 880, 932, 988, 1047], 0.075),
  text: () => play([1800], 0.012),
  gulp: () => play([180, 140], 0.05, "triangle"),
  burp: () => play([110, 98, 92, 87, 82], 0.09, "sawtooth"),
  door: () => play([330, 262, 196], 0.06),
  denied: () => play([220, 165], 0.12),
  gameOver: () => play([523, 494, 466, 440, 392, 349, 330, 262, 196, 131], 0.16, "triangle"),
  // Zelda-agtigt "gåde løst"
  solved: () => play([784, 740, 622, 440, 415, 659, 831, 1047], 0.11),
  click: () => play([960], 0.03),
  catch: () => play([660, 990], 0.05),
  yuck: () => play([196, 147], 0.1, "sawtooth"),
  victory: () => play([523, 523, 523, 523, 415, 466, 523, 466, 523], 0.13),
};

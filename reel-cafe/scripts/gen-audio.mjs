// Sintetiza un bed cálido de 10 s a 90 BPM + kit de SFX, como WAV 16-bit mono.
// 90 BPM a 30 fps => 1 beat = 20 frames; los cortes (frames 100 y 200) caen en beat.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(OUT, { recursive: true });

const wav = (samples) => {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
};

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed / 2147483647) * 2 - 1;
};

const buffer = (dur) => new Float32Array(Math.round(dur * SR));
const add = (out, start, dur, fn) => {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  for (let i = 0; i < n && s0 + i < out.length; i++)
    out[s0 + i] += fn(i / SR, i / n);
};
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// Tono tipo Rhodes: seno + armónicos suaves con decaimiento
const keys = (f, ts) =>
  (Math.sin(2 * Math.PI * f * ts) +
    0.35 * Math.sin(4 * Math.PI * f * ts) * Math.exp(-ts * 3) +
    0.12 * Math.sin(6 * Math.PI * f * ts) * Math.exp(-ts * 6)) *
  (1 + 0.04 * Math.sin(2 * Math.PI * 5 * ts));

// ---------- TRACK ----------
const DUR = 10;
const BEAT = 60 / 90;
const track = buffer(DUR);

// Progresión: Fmaj9 -> Dm9 -> Bbmaj7 -> C6/9 (cambia cada 2.5 s aprox.)
const chords = [
  [53, 57, 60, 64, 67],
  [50, 53, 57, 60, 64],
  [46, 50, 53, 57, 62],
  [48, 52, 55, 57, 62],
];
chords.forEach((ch, ci) => {
  const start = ci * BEAT * 4 - (ci === 0 ? 0 : 0.02);
  const dur = BEAT * 4 + 0.6;
  ch.forEach((m, k) =>
    add(track, start + k * 0.025, dur, (ts, p) => {
      const atk = Math.min(1, ts / 0.08);
      const rel = Math.min(1, (1 - p) * 6);
      return keys(hz(m), ts) * atk * rel * Math.exp(-ts * 0.35) * 0.06;
    }),
  );
});
// Bajo suave en la fundamental
chords.forEach((ch, ci) =>
  add(track, ci * BEAT * 4, BEAT * 4, (ts, p) =>
    Math.sin(2 * Math.PI * hz(ch[0] - 12) * ts) *
    Math.min(1, ts / 0.03) * Math.min(1, (1 - p) * 8) * 0.16,
  ),
);
// Kick suave + hats a partir del beat 1
for (let b = 1; b * BEAT < DUR - 0.5; b++) {
  const t = b * BEAT;
  add(track, t, 0.3, (ts, p) => {
    const f = 110 - 60 * Math.min(1, ts * 12);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 6) * 0.55;
  });
  let hp = 0;
  add(track, t + BEAT / 2, 0.06, (ts, p) => {
    const n = rnd();
    const v = n - hp;
    hp = n;
    return v * Math.exp(-p * 8) * 0.05;
  });
}
// Vinyl crackle muy sutil (textura de café)
add(track, 0, DUR, () => (rnd() > 0.9985 ? rnd() * 0.12 : rnd() * 0.004));
// Fade in/out global
for (let i = 0; i < track.length; i++) {
  const t = i / SR;
  track[i] *= Math.min(1, t / 0.15) * Math.min(1, (DUR - t) / 1.2);
}
writeFileSync(join(OUT, "track.wav"), wav(track));

// ---------- SFX ----------
{
  // whoosh — ruido filtrado con barrido
  const out = buffer(0.45);
  let lp = 0;
  add(out, 0, 0.45, (ts, p) => {
    const env = Math.sin(Math.PI * Math.pow(p, 0.7)) ** 2;
    lp += (0.04 + 0.22 * Math.sin(Math.PI * p)) * (rnd() - lp);
    return lp * env * 0.9;
  });
  writeFileSync(join(OUT, "whoosh.wav"), wav(out));
}
{
  // pop — seno con caída de tono
  const out = buffer(0.14);
  let ph = 0;
  add(out, 0, 0.14, (ts, p) => {
    ph += (2 * Math.PI * (720 - 380 * p)) / SR;
    return Math.sin(ph) * Math.exp(-p * 9) * 0.7;
  });
  writeFileSync(join(OUT, "pop.wav"), wav(out));
}
{
  // bass — golpe grave en los cortes
  const out = buffer(0.6);
  add(out, 0, 0.6, (ts, p) => {
    const f = 70 - 30 * Math.min(1, ts * 4);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 4) * 0.9;
  });
  writeFileSync(join(OUT, "bass.wav"), wav(out));
}
{
  // riser — ruido + seno ascendente hacia el corte
  const out = buffer(0.7);
  let ph = 0;
  let lp = 0;
  add(out, 0, 0.7, (ts, p) => {
    ph += (2 * Math.PI * (300 + 900 * p * p)) / SR;
    lp += (0.02 + 0.3 * p) * (rnd() - lp);
    return (Math.sin(ph) * 0.25 + lp * 0.8) * p * p * 0.7;
  });
  writeFileSync(join(OUT, "riser.wav"), wav(out));
}
{
  // shimmer — campanitas para el CTA
  const out = buffer(1.2);
  [76, 79, 83, 88].forEach((m, k) =>
    add(out, k * 0.06, 1.0, (ts, p) =>
      Math.sin(2 * Math.PI * hz(m) * ts) * Math.exp(-p * 5) * 0.16,
    ),
  );
  writeFileSync(join(OUT, "shimmer.wav"), wav(out));
}
console.log("audio ok ->", OUT);

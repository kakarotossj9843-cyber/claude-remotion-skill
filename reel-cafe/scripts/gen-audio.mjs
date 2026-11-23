// Sintetiza la banda sonora de 30 s (90 BPM) + kit de SFX como WAV 16-bit mono.
// 90 BPM a 30 fps => 1 beat = 20 frames. Escenas en beats: 5, 8, 9, 7, 7, 9 (= 45 beats = 30 s).
// Estructura: intro (keys) -> entra kick (cap. 01) -> + rim (cap. 02) -> respiración sin
// batería (cap. 04, "paciencia") -> vuelve todo + campanas en el cierre -> acorde final.
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
    if (s0 + i >= 0) out[s0 + i] += fn(i / SR, i / n);
};
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
// Tono tipo Rhodes: seno + armónicos que decaen + leve trémolo
const keys = (f, ts) =>
  (Math.sin(2 * Math.PI * f * ts) +
    0.35 * Math.sin(4 * Math.PI * f * ts) * Math.exp(-ts * 3) +
    0.12 * Math.sin(6 * Math.PI * f * ts) * Math.exp(-ts * 6)) *
  (1 + 0.04 * Math.sin(2 * Math.PI * 5 * ts));

// ---------- TRACK ----------
const BEAT = 60 / 90;
const TOTAL_BEATS = 45;
const DUR = TOTAL_BEATS * BEAT; // 30 s
const track = buffer(DUR + 0.01);

// Límites de escena en beats
const B = { s2: 5, s3: 13, s4: 22, s5: 29, s6: 36 };

// Progresión de 4 acordes (4 beats c/u): Fmaj9 -> Dm9 -> Bbmaj7 -> C6/9
const prog = [
  [53, 57, 60, 64, 67],
  [50, 53, 57, 60, 64],
  [46, 50, 53, 57, 62],
  [48, 52, 55, 57, 62],
];
for (let bar = 0; bar * 4 < TOTAL_BEATS; bar++) {
  const ch = prog[bar % 4];
  const start = bar * 4 * BEAT;
  const last = (bar + 1) * 4 >= TOTAL_BEATS;
  const dur = last ? DUR - start : BEAT * 4 + 0.5;
  ch.forEach((m, k) =>
    add(track, start + k * 0.025, dur, (ts, p) => {
      const atk = Math.min(1, ts / 0.08);
      const rel = last ? Math.pow(1 - p, 1.5) : Math.min(1, (1 - p) * 6);
      return keys(hz(m), ts) * atk * rel * Math.exp(-ts * (last ? 0.25 : 0.35)) * 0.055;
    }),
  );
  // Bajo en la fundamental (desde el cap. 01)
  if (start >= B.s2 * BEAT - 0.01)
    add(track, start, last ? DUR - start : BEAT * 4, (ts, p) =>
      Math.sin(2 * Math.PI * hz(ch[0] - 12) * ts) *
      Math.min(1, ts / 0.03) * Math.min(1, (1 - p) * 8) * 0.15,
    );
}
// Batería
for (let b = 0; b < TOTAL_BEATS - 1; b++) {
  const t = b * BEAT;
  const breath = b >= B.s5 && b < B.s6; // cap. 04: sin batería
  if (b >= B.s2 && !breath) {
    add(track, t, 0.3, (ts, p) => {
      const f = 110 - 60 * Math.min(1, ts * 12);
      return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 6) * 0.5;
    });
    let hp = 0;
    add(track, t + BEAT / 2, 0.06, (ts, p) => {
      const n = rnd();
      const v = n - hp;
      hp = n;
      return v * Math.exp(-p * 8) * 0.045;
    });
  }
  // Rim en 2 y 4 desde el cap. 02
  if (b >= B.s3 && !breath && b % 2 === 1)
    add(track, t, 0.08, (ts, p) =>
      (Math.sin(2 * Math.PI * 820 * ts) * 0.5 + rnd() * 0.5) * Math.exp(-p * 10) * 0.09,
    );
}
// Vinyl crackle sutil
add(track, 0, DUR, () => (rnd() > 0.9985 ? rnd() * 0.1 : rnd() * 0.003));
// Fade in/out global
for (let i = 0; i < track.length; i++) {
  const t = i / SR;
  track[i] *= Math.min(1, t / 0.2) * Math.min(1, (DUR - t) / 0.6);
}
writeFileSync(join(OUT, "track.wav"), wav(track));

// ---------- SFX ----------
{
  // pour — chorro de líquido: ruido filtrado + burbujas que suben de tono
  const D = 1.0;
  const out = buffer(D);
  let lp = 0;
  let bp = 0;
  add(out, 0, D, (ts, p) => {
    const env = Math.min(1, p / 0.08) * Math.pow(1 - p, 1.4);
    lp += 0.12 * (rnd() - lp);
    bp += 0.5 * (lp - bp);
    return (lp - bp * 0.6) * env * 1.4;
  });
  for (let k = 0; k < 16; k++) {
    const t0 = 0.05 + Math.abs(rnd()) * 0.75;
    const f0 = 300 + Math.abs(rnd()) * 500;
    let ph = 0;
    add(out, t0, 0.06, (ts, p) => {
      ph += (2 * Math.PI * f0 * (1 + p * 1.8)) / SR;
      return Math.sin(ph) * Math.sin(Math.PI * p) * 0.16;
    });
  }
  writeFileSync(join(OUT, "pour.wav"), wav(out));
}
{
  // bass — golpe grave al cubrir la pantalla
  const out = buffer(0.6);
  add(out, 0, 0.6, (ts, p) => {
    const f = 70 - 30 * Math.min(1, ts * 4);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 4) * 0.9;
  });
  writeFileSync(join(OUT, "bass.wav"), wav(out));
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
  // tick — para el contador
  const out = buffer(0.05);
  let ph = 0;
  add(out, 0, 0.05, (ts, p) => {
    ph += (2 * Math.PI * 1900) / SR;
    return Math.sin(ph) * Math.exp(-p * 14) * 0.45;
  });
  writeFileSync(join(OUT, "tick.wav"), wav(out));
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
console.log("audio ok ->", OUT, "track", DUR.toFixed(2), "s");

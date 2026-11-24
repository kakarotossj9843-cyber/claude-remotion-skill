// Original score for "HIERRO" (43s), fully synthesized — no samples.
// drone → star rumble + riser → supernova impact → nebula pad + sparkles →
// three plucks (rock/ocean/leaf) → heartbeat at 72 BPM → final bloom.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SR = 44100, DUR = 43, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "sfx");
mkdirSync(OUT, { recursive: true });
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647), seed / 2147483647 - 0.5);
const TAU = Math.PI * 2;
const add = (start, dur, fn, pan = 0) => {
  const s0 = Math.floor(start * SR), n = Math.floor(dur * SR);
  const gl = Math.cos((pan + 1) * Math.PI / 4), gr = Math.sin((pan + 1) * Math.PI / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR, i / n);
    L[s0 + i] += v * gl; R[s0 + i] += v * gr;
  }
};
const env = (ts, a, d, total, p) => Math.min(1, ts / a) * Math.min(1, (total - ts) / d);

// 1. sub drone in D, whole piece, breathing
add(0, 41.5, (ts) => {
  const lfo = 0.7 + 0.3 * Math.sin(TAU * 0.07 * ts);
  const duck = ts > 27 && ts < 36 ? 0.45 : 1;
  return (Math.sin(TAU * 36.7 * ts) * 0.6 + Math.sin(TAU * 73.4 * ts) * 0.35 + Math.sin(TAU * 110 * ts + Math.sin(ts)) * 0.12)
    * 0.12 * lfo * duck * env(ts, 3, 3, 41.5);
});
// 2. atom shimmer at 0.1s
for (const [f, d, p] of [[1760, 0, -0.4], [2637, 0.07, 0.4], [3520, 0.14, 0]])
  add(0.1 + d, 3, (ts, q) => Math.sin(TAU * f * ts) * Math.exp(-q * 5) * 0.05, p);
// 3. star rumble 4.5–10.35 (one-pole low-passed noise, rising)
{ let y = 0; add(4.5, 5.85, (ts, p) => { y += 0.02 * (rnd() * 2 - y); return y * 3.2 * Math.min(1, ts / 1.5) * (0.4 + p * 0.9); }); }
// riser into the collapse
add(8.4, 1.95, (ts, p) => (Math.sin(TAU * (200 + 900 * p * p) * ts) * 0.05 + rnd() * 0.25 * p) * p * p);
// 4. SUPERNOVA at 10.5
add(10.5, 3.2, (ts, p) => Math.sin(TAU * (70 - 42 * Math.min(1, ts * 1.3)) * ts) * Math.exp(-p * 3.2) * 0.95);
{ let y = 0; add(10.5, 4.2, (ts, p) => { y += 0.12 * (rnd() * 2 - y); return y * 1.4 * Math.exp(-p * 3.5); }, -0.2); }
{ let y = 0; add(10.5, 4.2, (ts, p) => { y += 0.12 * (rnd() * 2 - y); return y * 1.4 * Math.exp(-p * 3.5); }, 0.2); }
add(10.5, 0.25, (ts, p) => rnd() * 1.4 * Math.exp(-p * 8));
// 5. nebula pad 14.5–21.5: D F A E, detuned
for (const [f, pan] of [[146.83, -0.5], [174.61, 0.5], [220, -0.2], [329.63, 0.3]])
  add(14.5, 7.4, (ts) => (Math.sin(TAU * f * ts) + Math.sin(TAU * f * 1.004 * ts)) * 0.028 * env(ts, 2.2, 1.6, 7.4), pan);
for (let i = 0; i < 14; i++) {
  const t = 15.3 + i * 0.42 + (rnd() + 0.5) * 0.2, f = [1174.7, 1318.5, 1760, 2349.3][i % 4];
  add(t, 1.2, (ts, p) => Math.sin(TAU * f * ts) * Math.exp(-p * 6) * 0.03, rnd() * 1.6);
}
// planet forms (21-ish) low swell
add(19, 2, (ts, p) => Math.sin(TAU * 55 * ts) * Math.sin(Math.PI * p) * 0.15);
// 6. three plucks: rock / ocean / leaf
for (const [t, f] of [[21.13, 220], [23.13, 261.63], [25.13, 329.63]]) {
  add(t, 2, (ts, p) => (Math.sin(TAU * f * ts) + 0.5 * Math.sin(TAU * f * 2 * ts) + 0.2 * Math.sin(TAU * f * 3 * ts)) * Math.exp(-p * 5) * 0.12);
  add(t - 0.12, 0.3, (ts, p) => rnd() * Math.sin(Math.PI * p) * 0.12);
}
// 7. heartbeat 72 BPM from 27s
const beat = 60 / 72;
for (let k = 0; 27 + k * beat < 42.2; k++) {
  const t = 27 + k * beat, g = t > 40.5 ? Math.max(0, (42.2 - t) / 1.7) : 1;
  add(t, 0.22, (ts, p) => Math.sin(TAU * (62 - 20 * p) * ts) * Math.exp(-p * 6) * 0.85 * g);
  add(t + 0.2, 0.18, (ts, p) => Math.sin(TAU * (74 - 22 * p) * ts) * Math.exp(-p * 7) * 0.55 * g);
}
// 8. end: swell at 36, bloom on title at 40
for (const [f, pan] of [[146.83, -0.4], [220, 0.4], [293.66, 0]])
  add(35.6, 7, (ts) => Math.sin(TAU * f * ts) * 0.035 * env(ts, 3, 2.5, 7), pan);
add(39.95, 3, (ts, p) => Math.sin(TAU * 36.7 * ts) * Math.exp(-p * 2.5) * 0.6);
for (const [f, d, pan] of [[1174.7, 0, -0.5], [1760, 0.08, 0.5], [2349.3, 0.16, 0], [2637, 0.24, 0.2]])
  add(40 + d, 3, (ts, p) => Math.sin(TAU * f * ts) * Math.exp(-p * 3.5) * 0.04, pan);

// cheap stereo reverb: parallel combs
const verb = (x, delays) => {
  const y = new Float32Array(N);
  for (const d of delays) { const n = Math.floor(d * SR); const b = new Float32Array(N);
    for (let i = 0; i < N; i++) { b[i] = x[i] + (i >= n ? b[i - n] * 0.72 : 0); y[i] += b[i] / delays.length; } }
  return y;
};
const vl = verb(L, [0.0297, 0.0371, 0.0411, 0.0437]), vr = verb(R, [0.0311, 0.0359, 0.0423, 0.0449]);
let peak = 0;
for (let i = 0; i < N; i++) { L[i] += vl[i] * 0.35; R[i] += vr[i] * 0.35; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
const g = 0.92 / peak;
const sat = (v) => Math.tanh(v * g * 1.2) / Math.tanh(1.2);
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write("WAVE", 8); buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sat(L[i]))) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, sat(R[i]))) * 32767), 46 + i * 4);
}
writeFileSync(join(OUT, "hierro.wav"), buf);
console.log("hierro.wav written, peak", peak.toFixed(2));

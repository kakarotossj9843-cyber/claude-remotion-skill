#!/usr/bin/env python3
"""Monta video_final.mp4 (720x1280, 24 fps, 60 s exactos) sólo con Python + FFmpeg.

1. Corta la locución en 6 bloques (por las pausas entre párrafos) y coloca cada
   bloque al inicio de su ventana de 10 s.
2. Anima cada imagen con zoompan (acercamiento suave con easing) y las une con
   fundidos cortos centrados en cada corte de 10 s.
3. Genera subtítulos .ass tipo karaoke (la palabra hablada se ilumina en ámbar),
   sincronizados con la voz, y los quema en el video.

Uso: python3 make_video.py
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
A = ROOT / "assets"
BUILD = ROOT / "build"
BUILD.mkdir(exist_ok=True)

W, H, FPS = 720, 1280, 24
BLOCK = 10.0
N = 6
TOTAL = BLOCK * N
XF = 0.4  # duración del fundido entre imágenes
LEAD = 0.30  # la voz arranca 0.3 s después del inicio de cada bloque

BLOCKS = json.loads((ROOT / "guion.json").read_text(encoding="utf-8"))


def run(cmd):
    subprocess.run(cmd, check=True)


def silences(path, noise="-38dB", d=0.18):
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(path), "-af", f"silencedetect=noise={noise}:d={d}", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return list(zip(starts, ends))


def duration(path):
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    ).stdout)


# ---------------------------------------------------------------- 1. Voz
voice = A / "voz.mp3"
vdur = duration(voice)
sil = silences(voice)

# Las 5 fronteras entre bloques = las 5 pausas que mejor reparten el texto.
# Se elige, para cada frontera, la pausa larga más cercana a la posición esperada
# según la proporción de caracteres acumulados.
chars = [len(b) for b in BLOCKS]
cum = [sum(chars[: i + 1]) / sum(chars) for i in range(N - 1)]
cands = [s for s in sil if s[1] - s[0] >= 0.3 and s[1] < vdur - 0.1]
bounds = []
for frac in cum:
    target = frac * vdur
    best = min((s for s in cands if s not in bounds), key=lambda s: abs((s[0] + s[1]) / 2 - target))
    bounds.append(best)
bounds.sort()
seg_start = [0.0] + [b[1] for b in bounds]
seg_end = [b[0] for b in bounds] + [next((s[0] for s in sil if s[1] >= vdur - 0.05), vdur)]
segments = list(zip(seg_start, seg_end))

placements = []
for i, (s, e) in enumerate(segments):
    d = e - s
    assert d <= BLOCK - 0.2, f"El bloque {i + 1} dura {d:.2f}s (>9.8s)"
    lead = min(LEAD, BLOCK - 0.2 - d)
    placements.append(i * BLOCK + lead)
    print(f"bloque {i + 1}: voz {s:6.2f}-{e:6.2f} ({d:4.2f}s) -> en video {placements[-1]:6.2f}s")

# Audio alineado: cada bloque recortado y retrasado a su ventana, mezcla, 60 s exactos.
parts, labels = [], []
for i, (s, e) in enumerate(segments):
    ms = int(round(placements[i] * 1000))
    parts.append(
        f"[0:a]atrim={s:.3f}:{e + 0.12:.3f},asetpts=PTS-STARTPTS,"
        f"afade=t=out:st={e - s:.3f}:d=0.1,adelay={ms}|{ms}[v{i}]"
    )
    labels.append(f"[v{i}]")
afilter = ";".join(parts) + ";" + "".join(labels) + (
    f"amix=inputs={N}:normalize=0,highpass=f=60,"
    "acompressor=threshold=-20dB:ratio=3:attack=5:release=120,"
    f"loudnorm=I=-15:TP=-1.5:LRA=9,apad,atrim=0:{TOTAL},aresample=48000[aout]"
)
audio = BUILD / "voz_alineada.wav"
run(["ffmpeg", "-v", "error", "-y", "-i", str(voice), "-filter_complex", afilter,
     "-map", "[aout]", "-ac", "2", str(audio)])

# ---------------------------------------------------------------- 2. Subtítulos
def syllables(word):
    return max(1, len(re.findall(r"[aeiouáéíóúü]+", word.lower())))


def chunks(text, max_words=3, max_chars=16):
    """Agrupa palabras en tarjetas cortas; corta también en signos de puntuación."""
    words, out, cur = text.split(), [], []
    for w in words:
        if cur and (len(cur) >= max_words or len(" ".join(cur + [w])) > max_chars):
            out.append(cur)
            cur = []
        cur.append(w)
        if re.search(r"[.,:;?!]$", w):
            out.append(cur)
            cur = []
    if cur:
        out.append(cur)
    return out


def ts(t):
    t = max(0.0, t)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


events = []
for i, text in enumerate(BLOCKS):
    s, e = segments[i]
    offset = placements[i] - s
    # Tramos hablados del bloque (se descuentan las pausas internas)
    inner = [x for x in sil if x[0] > s + 0.05 and x[1] < e - 0.05]
    speech, cur = [], s
    for a, b in inner:
        speech.append((cur, a))
        cur = b
    speech.append((cur, e))
    # Frases separadas por puntuación. Cada pausa interna detectada se ancla al signo
    # de puntuación cuya posición esperada (por sílabas) le queda más cerca; así la
    # voz y el texto se re-sincronizan en cada pausa real.
    phrases = [p.strip() for p in re.findall(r"[^.,:;?!]+[.,:;?!]?", text) if p.strip()]
    psyl = [sum(syllables(w) + 0.6 for w in p.split()) for p in phrases]
    tot = sum(psyl)
    talk = sum(b - a for a, b in speech)
    # tiempo "hablado" acumulado hasta cada frontera entre frases
    bfrac = [sum(psyl[: k + 1]) / tot for k in range(len(phrases) - 1)]
    elapsed, chosen, spans = 0.0, [], []
    span_start = speech[0][0]
    for a, b in speech[:-1]:
        elapsed += b - a
        free = [k for k in range(len(bfrac)) if not chosen or k > chosen[-1]]
        if free:
            chosen.append(min(free, key=lambda k: abs(bfrac[k] - elapsed / talk)))
            spans.append((span_start, b))  # la pausa queda fuera del tramo
            span_start = None
        # si no quedan signos libres, la pausa se ignora (tramo continuo)
        if span_start is None:
            span_start = speech[speech.index((a, b)) + 1][0]
    spans.append((span_start, speech[-1][1]))
    cuts = [-1] + chosen + [len(phrases) - 1]
    mapping = [
        (" ".join(phrases[cuts[j] + 1 : cuts[j + 1] + 1]), spans[j]) for j in range(len(spans))
    ]
    for phrase, (ps, pe) in mapping:
        words = phrase.split()
        syl = [syllables(w) + 0.6 for w in words]  # +0.6: peso fijo por palabra
        total = sum(syl)
        t = ps
        times = []
        for w, sy in zip(words, syl):
            d = (pe - ps) * sy / total
            times.append((w, t, t + d))
            t += d
        k = 0
        for card in chunks(phrase):
            ws = times[k : k + len(card)]
            k += len(card)
            start, end = ws[0][1], ws[-1][2]
            karaoke = "".join(
                f"{{\\k{max(1, round((we - wst) * 100))}}}{w.upper()} " for w, wst, we in ws
            ).rstrip()
            events.append((start + offset, end + offset, karaoke))

# Cada tarjeta se mantiene hasta que entra la siguiente (máx. 0.6 s de cola)
lines = []
for j, (st, en, txt) in enumerate(events):
    nxt = events[j + 1][0] if j + 1 < len(events) else en + 0.6
    en2 = min(max(en + 0.15, en), nxt - 0.02, en + 0.6)
    pop = r"{\fad(60,80)\t(0,120,\fscx104\fscy104)\t(120,220,\fscx100\fscy100)}"
    lines.append(f"Dialogue: 0,{ts(st - 0.05)},{ts(en2)},Sub,,0,0,0,,{pop}{txt}")

ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter ExtraBold,74,&H003DA3E8,&H00F4F4F4,&H00140C06,&H96000000,0,0,0,0,100,100,1,0,1,6,3,2,40,40,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + "\n".join(lines) + "\n"
subs = BUILD / "subtitulos.ass"
subs.write_text(ass, encoding="utf-8")

# ---------------------------------------------------------------- 3. Video
# Duración de cada clip para que, con fundidos de XF s, el total sea 60 s exactos y
# cada corte quede centrado en un múltiplo de 10 s.
lens = [BLOCK + XF / 2] + [BLOCK + XF] * (N - 2) + [BLOCK + XF / 2]
moves = [  # (zoom inicial, zoom final, desplazamiento x, desplazamiento y) en fracción
    (1.00, 1.14, 0.00, -0.04),
    (1.14, 1.02, 0.03, 0.00),
    (1.02, 1.16, -0.03, 0.02),
    (1.12, 1.00, 0.00, 0.03),
    (1.00, 1.15, 0.04, -0.02),
    (1.03, 1.18, 0.00, -0.05),
]
UP = 2  # trabajar a 2x para que el zoompan no tiemble
vparts = []
for i, L in enumerate(lens):
    fr = round(L * FPS)
    z0, z1, dx, dy = moves[i]
    p = f"(1-cos(PI*on/{fr}))/2"  # easing seno de entrada/salida
    z = f"{z0}+({z1}-{z0})*{p}"
    x = f"(iw-iw/zoom)/2+iw*{dx}*{p}"
    y = f"(ih-ih/zoom)/2+ih*{dy}*{p}"
    vparts.append(
        f"[{i}:v]scale={W * UP}:{H * UP}:force_original_aspect_ratio=increase,"
        f"crop={W * UP}:{H * UP},setsar=1,"
        f"zoompan=z='{z}':x='{x}':y='{y}':d={fr}:s={W}x{H}:fps={FPS},"
        f"trim=end_frame={fr},setpts=PTS-STARTPTS,format=yuv420p[c{i}]"
    )
chain, prev, acc = [], "c0", lens[0]
for i in range(1, N):
    off = acc - XF
    out = f"x{i}"
    chain.append(f"[{prev}][c{i}]xfade=transition=fade:duration={XF}:offset={off:.3f}[{out}]")
    prev, acc = out, acc + lens[i] - XF
fonts = ROOT / "fonts"
# Banda de degradado oscuro detrás de los subtítulos (se genera una vez, es un PNG)
band = BUILD / "banda.png"
run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=black:s={W}x{H}:d=1",
     "-vf", "format=rgba,geq=r=0:g=0:b=0:a='160*exp(-pow((Y-905)/150,2))'",
     "-frames:v", "1", str(band)])
grade = (
    "eq=contrast=1.05:saturation=1.08,"
    "vignette=angle=PI/5,"
    f"fade=t=in:st=0:d=0.5,fade=t=out:st={TOTAL - 0.6}:d=0.6"
    "[g];[g][band]overlay=0:0:format=auto,"
    f"ass={subs}:fontsdir={fonts},"
    f"trim=duration={TOTAL},setpts=PTS-STARTPTS[vout]"
)
vfilter = ";".join(vparts + chain) + f";[{prev}]" + grade

cmd = ["ffmpeg", "-v", "error", "-stats", "-y"]
for i in range(N):
    cmd += ["-loop", "1", "-framerate", str(FPS), "-t", f"{lens[i]:.3f}", "-i", str(A / f"img{i + 1}.png")]
cmd += ["-i", str(audio), "-loop", "1", "-framerate", str(FPS), "-i", str(band)]
vfilter = vfilter.replace("[band]", f"[{N + 1}:v]")
cmd += ["-filter_complex", vfilter, "-map", "[vout]", "-map", f"{N}:a",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
        "-r", str(FPS), "-c:a", "aac", "-b:a", "192k", "-t", f"{TOTAL}",
        "-movflags", "+faststart", str(ROOT / "video_final.mp4")]
run(cmd)
print("listo ->", ROOT / "video_final.mp4")

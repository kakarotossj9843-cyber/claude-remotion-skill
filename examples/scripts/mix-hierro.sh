#!/usr/bin/env bash
# Places each voice-over line on its scene and mixes it over the synthesized score,
# ducking the music under the voice. Output: public/sfx/hierro.wav (used by the composition).
set -euo pipefail
cd "$(dirname "$0")/.."
VO=public/vo/hierro_vo.mp3
MUSIC=public/sfx/hierro_music.wav
# start-in-VO  end-in-VO  place-at (seconds)
LINES=(
  "0.00 3.30 0.6"    # Este átomo de hierro tiene siete mil millones de años.
  "3.55 5.95 5.0"    # Nació en el corazón de una estrella moribunda.
  "6.45 8.95 11.6"   # Y cuando la estrella murió, salió disparado.
  "9.25 12.10 15.6"  # Vagó a oscuras, hasta que el polvo se convirtió en un mundo.
  "12.16 12.90 21.2" # Fue roca.
  "13.04 13.90 23.2" # Fue océano.
  "14.08 14.80 25.2" # Fue hoja.
  "15.20 16.75 27.6" # Hoy viaja por tus venas.
  "17.04 19.75 31.8" # Hay cuarenta mil trillones como él dentro de ti.
  "20.06 23.50 36.3" # Cada latido es una estrella que todavía no ha terminado de caer.
)
F=""; M=""
for i in "${!LINES[@]}"; do
  read -r a b at <<<"${LINES[$i]}"
  d=$(awk "BEGIN{print int($at*1000)}")
  F+="[1:a]atrim=$a:$b,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=$(awk "BEGIN{print $b-$a-0.08}"):d=0.08,adelay=$d|$d[l$i];"
  M+="[l$i]"
done
F+="${M}amix=inputs=${#LINES[@]}:normalize=0,apad=whole_dur=43,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=2.2,asplit[vo][sc];"
F+="[0:a]volume=0.75[mus];[mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck];"
F+="[duck][vo]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.0:LRA=11,atrim=0:43[out]"
ffmpeg -v error -y -i "$MUSIC" -i "$VO" -filter_complex "$F" -map "[out]" -ar 48000 -ac 2 public/sfx/hierro.wav
echo "mixed -> public/sfx/hierro.wav"

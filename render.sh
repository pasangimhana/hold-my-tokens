#!/bin/zsh
# Full render (1080p60): video (muted, encoded once at the final CRF) -> SFX from cues -> mix -> mux (video stream-copied).
# Concurrency 4: the render is GPU-bound; more workers measured slower.
set -e
cd "$(dirname "$0")"
NAME=${NAME:-$(basename "$PWD")}
PY=${PY:-python3} # needs numpy (requirements.txt)
mkdir -p out
npx remotion render Film out/video.mp4 --muted --concurrency=${CONC:-4} --crf=${CRF:-19} --x264-preset=slow --pixel-format=yuv420p
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/video.mp4)
# the music is not in the repo: drop your track at public/audio.wav, else the mix is SFX only
if [[ -f public/audio.wav ]]; then MUSIC=(-i public/audio.wav); else MUSIC=(-f lavfi -t $DUR -i anullsrc=r=48000:cl=stereo); fi
npm run -s cues >/dev/null && $PY -I scripts/sfx.py cues-f.json out/sfx.wav --seconds $DUR
ffmpeg -v error -y -i out/video.mp4 $MUSIC -i out/sfx.wav -filter_complex \
  "[1:a]atrim=0:$DUR,afade=t=in:d=0.04,afade=t=out:st=$(python3 -c "print($DUR-1.4)"):d=1.4,volume=0.9[m];[2:a]volume=${SFX_GAIN:-0.55}[s];[m][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=11,aresample=48000[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -movflags +faststart out/$NAME.mp4
ffprobe -v error -show_entries format=duration,size -of compact out/$NAME.mp4

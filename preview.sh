#!/bin/zsh
# Fast iteration render: 640x360, 30 fps, with the SFX mix. Iterate with this; render.sh for the final.
# FRAMES=a-b renders a slice (30 fps frame numbers), e.g. FRAMES=1200-1500 ./preview.sh
set -e
cd "$(dirname "$0")"
NAME=${NAME:-preview}
PY=${PY:-python3} # needs numpy (requirements.txt)
mkdir -p out
npx remotion render FilmPreview out/pv-video.mp4 --muted --scale=0.3333333333333333 --concurrency=${CONC:-4} --crf=26 ${FRAMES:+--frames=$FRAMES}
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 out/pv-video.mp4)
# the music is not in the repo: drop your track at public/audio.wav, else the mix is SFX only
if [[ -f public/audio.wav ]]; then MUSIC=(-i public/audio.wav); else MUSIC=(-f lavfi -t $DUR -i anullsrc=r=48000:cl=stereo); fi
if [[ -n "$FRAMES" ]]; then
  # a slice: no music sync worth mixing, ship the silent clip
  cp out/pv-video.mp4 out/$NAME.mp4
else
  npm run -s cues >/dev/null && $PY -I scripts/sfx.py cues-f.json out/pv-sfx.wav --seconds $DUR >/dev/null
  ffmpeg -v error -y -i out/pv-video.mp4 $MUSIC -i out/pv-sfx.wav -filter_complex \
    "[1:a]atrim=0:$DUR,afade=t=in:d=0.04,afade=t=out:st=$(python3 -c "print($DUR-1.4)"):d=1.4,volume=0.9[m];[2:a]volume=${SFX_GAIN:-0.55}[s];[m][s]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.2:LRA=11,aresample=48000[a]" \
    -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -movflags +faststart out/$NAME.mp4
fi
ffprobe -v error -show_entries stream=width,height,r_frame_rate:format=duration,size -of compact out/$NAME.mp4

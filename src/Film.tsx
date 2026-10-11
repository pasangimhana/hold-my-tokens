// The whole film is one continuous take: one paper world, one camera, one
// canvas. Stations (src/stations) contribute 3D content, text printed into
// the world, and their stretch of the camera path.
import React from 'react';
import {AbsoluteFill, Audio, getStaticFiles, interpolate, staticFile} from 'remotion';
import {Stage} from './core/Stage';
import {FPS, TOTAL_FRAMES} from './core/timing';
import {useBeat} from './core/anim';
import {toB} from './core/warp';
import {loadFonts} from './core/fonts';
import {PAPER, Grain} from './style';
import {STATIONS} from './stations';
import {worldCam, worldBg, worldFog, isMounted, hitFx} from './world/station';
import {TextLayer} from './world/Plane';

loadFonts();

// the music isn't in the repo (bring your own public/audio.wav); without it the film plays silent
const HAS_MUSIC = getStaticFiles().some((f) => f.name === 'audio.wav');

export const Film: React.FC = () => {
  const B = toB(useBeat()); // story beat (stations are authored in B)
  const cam = worldCam(STATIONS, B);
  const bg = worldBg(STATIONS, B, PAPER);
  const fog = worldFog(STATIONS, B);
  const end = TOTAL_FRAMES / FPS;
  const fx = hitFx(STATIONS, B);
  return (
    <AbsoluteFill style={{background: bg, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `translate(${fx.dx}px, ${fx.dy}px) rotate(${fx.rot}deg) scale(${fx.scale})`}}>
      <Stage cam={cam} bg={bg} fog={fog}>
        {STATIONS.map((s) => (s.World && isMounted(s, B) ? <s.World key={s.id} B={B} /> : null))}
      </Stage>
      <TextLayer cam={cam}>
        {STATIONS.map((s) => (s.Text && isMounted(s, B) ? <s.Text key={s.id} B={B} cam={cam} /> : null))}
      </TextLayer>
      {STATIONS.map((s) => (s.Screen && isMounted(s, B) ? <s.Screen key={s.id} B={B} cam={cam} /> : null))}
      </AbsoluteFill>
      <Grain opacity={0.38} />
      {/* preview only: final renders are --muted and mixed with SFX by render.sh */}
      {HAS_MUSIC ? (
        <Audio
          src={staticFile('audio.wav')}
          volume={(f) => interpolate(f / FPS, [0, 0.04, end - 1.4, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
        />
      ) : null}
    </AbsoluteFill>
  );
};

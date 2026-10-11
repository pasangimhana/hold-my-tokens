import React from 'react';
import {Composition} from 'remotion';
import {Film} from './Film';
import {FPS, W, H, TOTAL_FRAMES, beatFrame} from './core/timing';
import {loadFonts} from './core/fonts';

loadFonts();

// Film = the one take. Shot = a window of it for quick previews (same timeline).
export const Root: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    {/* iteration preview: same film at 30 fps (render with --scale=0.6667 for 720p) */}
    <Composition id="FilmPreview" component={Film} durationInFrames={Math.round(TOTAL_FRAMES / 2)} fps={30} width={W} height={H} />
  </>
);

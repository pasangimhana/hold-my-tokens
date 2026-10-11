// Beat grid of the slowed Macarena (YouTube bV2n6B3sxEk, 83.58 BPM, played from
// 0:00; public/audio.wav drops the first 60 ms so that video t=0 sits on the
// kick grid). The bass DROP lands on film beat 17 (story beat 8).
export const FPS = 60;
export const W = 1920;
export const H = 1080;
export const B = 0.7179; // seconds per beat; kicks on every integer beat
export const TOTAL_BEATS = 153; // film beats: VI holds to F 141, then the end card (Credits, B 74.667–82.667) to F 153, 109.8 s (warp.ts runs on to F 173)
export const beatFrame = (b: number) => Math.round(b * B * FPS);
export const TOTAL_FRAMES = beatFrame(TOTAL_BEATS);

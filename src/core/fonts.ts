// Computer Modern (CM Unicode) + Latin Modern caps, loaded from public/fonts.
// Families: 'CMU Serif' (400/700, italic), 'CMU Sans' (400/700, italic),
// 'CMU Mono' (400/700), 'CMU Concrete' (400/700, italic), 'LM Caps' (true small caps).
import {continueRender, delayRender, staticFile} from 'remotion';

const FACES: [string, string, string, string][] = [
  ['CMU Serif', 'cmunrm.otf', '400', 'normal'],
  ['CMU Serif', 'cmunti.otf', '400', 'italic'],
  ['CMU Serif', 'cmunbx.otf', '700', 'normal'],
  ['CMU Serif', 'cmunbi.otf', '700', 'italic'],
  ['CMU Sans', 'cmunss.otf', '400', 'normal'],
  ['CMU Sans', 'cmunsx.otf', '700', 'normal'],
  ['CMU Sans', 'cmunsi.otf', '400', 'italic'],
  ['CMU Mono', 'cmuntt.otf', '400', 'normal'],
  ['CMU Mono', 'cmuntb.otf', '700', 'normal'],
  ['CMU Concrete', 'cmunorm.otf', '400', 'normal'],
  ['CMU Concrete', 'cmunoti.otf', '400', 'italic'],
  ['CMU Concrete', 'cmunobx.otf', '700', 'normal'],
  ['LM Caps', 'lmromancaps10-regular.otf', '400', 'normal'],
];

export const SERIF = "'CMU Serif', serif";
export const SANS = "'CMU Sans', sans-serif";
export const MONO = "'CMU Mono', monospace";
export const CONCRETE = "'CMU Concrete', serif";
export const CAPS = "'LM Caps', 'CMU Serif', serif";

let started = false;
export const loadFonts = () => {
  if (started || typeof document === 'undefined') return;
  started = true;
  const h = delayRender('Loading CM fonts');
  Promise.all(
    FACES.map(([family, file, weight, style]) => {
      const face = new FontFace(family, `url(${staticFile('fonts/' + file)})`, {weight, style});
      document.fonts.add(face);
      return face.load();
    }),
  )
    .then(() => continueRender(h))
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};

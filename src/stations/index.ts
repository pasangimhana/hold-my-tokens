// All stations in time order. Each file exports one Station (see world/station.ts).
// After VI's chart holds, the end card (Credits.tsx, "Made with Claude") closes the film.
import type {Station} from '../world/station';
import {prologue} from './Prologue';
import {release} from './Release';
import {zeta} from './Zeta';
import {results} from './Results';
import {fluid} from './Fluid';
import {timeline} from './Timeline';
import {credits} from './Credits';

export const STATIONS: Station[] = [prologue, release, zeta, results, fluid, timeline, credits].sort((a, b) => a.from - b.from);

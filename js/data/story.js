// The whole story in order, and a few helpers for finding where you are in it.
import { CAST, CHAPTERS, EVENTS1, F } from './story1.js';
import { EVENTS2 } from './story2.js';
import { EVENTS3, ENDING } from './story3.js';
import { NAMES } from './names.js';

export { CAST, CHAPTERS, ENDING, F };
export const EVENTS = [...EVENTS1, ...EVENTS2, ...EVENTS3];
export const EVENT = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
// the next story event (each one needs the one before it)
export const nextEvent = (done) => EVENTS.find((e) => !done[e.id]) || null;
// the Longmen treasure sabre comes when the last banner is home
EVENT.c5_3.give = { items: ['ex_longmendao', 'ex_fengqiu'] };
// recruits: names for the people you hire at taverns
export const RECRUIT_NAMES = NAMES;

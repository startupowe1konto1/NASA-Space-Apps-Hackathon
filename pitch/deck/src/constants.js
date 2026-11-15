// Text that is not a number from the analysis. Numbers come only from data/field.json.
// Shared file: only the lead session edits it (pitch/PLAN.md, "How to run this plan").

// D13 is still open. Change the name here and nowhere else.
export const PROJECT_NAME = 'Field Shift tool';

export const TEAM = 'Vibecodersi';

// As the pitch owner sent them (P0, Sun 15 Nov 2026).
export const MEMBERS = [
  'Mikołaj Konieczny',
  'Mateusz Wojciechowski',
  'Oskar Pelzer',
  'Wojciech Rudnicki',
];

export const EVENT = 'NASA Space Apps Challenge 2026';
export const CHALLENGE = 'Field Shift: Adapting Farms with NASA Data';
export const LOCAL_EVENT = 'Poznań';

// The engine slide (src/slides/04-engine.js, "replay on the field") is parked: the pitch owner took it out on
// Sun 15 Nov 2026. true puts it back between the data slide and the regions slide; nothing else needs to change.
export const SHOW_ENGINE_SLIDE = false;

// The app's public URL. null until it is hosted; slide 7 then prints no link and no QR code.
export const APP_URL = null;

// The PDF lives in the repo (pitch/out/deck.pdf) and becomes public with the repo.
export const PDF_PATH = 'pitch/out/deck.pdf';

import { c } from "../theme";
import { n } from "./kit";

// Icons are drawn on a 24-unit grid and scaled to `size`.
const icon = (x: number, y: number, size: number, body: string, grid = 24) =>
  `<g transform="translate(${n(x)} ${n(y)}) scale(${+(size / grid).toFixed(3)})">${body}</g>`;

const line = `stroke="${c.ink}" stroke-width="2" stroke-linejoin="round"`;

export const heart = (x: number, y: number, size: number) =>
  icon(x, y, size, `<path d="M12 20S3 14 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14 12 20 12 20Z" fill="${c.pink}" ${line}/>`);

export const eye = (x: number, y: number, size: number) =>
  icon(x, y, size, `<path d="M2 12Q12 3 22 12Q12 21 2 12Z" fill="${c.white}" ${line}/><circle cx="12" cy="12" r="4" fill="${c.violet}" ${line}/><circle cx="12" cy="12" r="1.4" fill="${c.ink}"/>`);

export const check = (x: number, y: number, size: number) =>
  icon(x, y, size, `<path d="M4 12l5 5L20 6" fill="none" stroke="${c.ink}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><path d="M4 12l5 5L20 6" fill="none" stroke="${c.white}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`);

export const globe = (x: number, y: number, size: number) =>
  icon(x, y, size, `<g fill="none" stroke="${c.ink}" stroke-width="2"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></g>`);

export const cursor = (x: number, y: number, size: number) =>
  icon(x, y, size, `<path d="M3 3l18 7-8 3-3 8z" fill="${c.violet}" ${line}/>`);

export const noEntry = (x: number, y: number, size: number) =>
  icon(x, y, size, `<circle cx="12" cy="12" r="9" fill="${c.white}" stroke="${c.ink}" stroke-width="5.5"/><circle cx="12" cy="12" r="9" fill="none" stroke="${c.pink}" stroke-width="2.5"/><path d="M5.6 5.6l12.8 12.8" stroke="${c.ink}" stroke-width="5.5"/><path d="M5.6 5.6l12.8 12.8" stroke="${c.pink}" stroke-width="2.5"/>`);

// Four-point sparkle centred on (cx, cy).
export const sparkle = (cx: number, cy: number, size: number, fill: string) =>
  icon(cx - size / 2, cy - size / 2, size, `<path d="M60 4Q66 54 116 60Q66 66 60 116Q54 66 4 60Q54 54 60 4Z" fill="${fill}" stroke="${c.ink}" stroke-width="${n(360 / size)}" stroke-linejoin="round"/>`, 120);

export function star(cx: number, cy: number, r: number, fill: string) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    return `${n(cx + rad * Math.cos(a))},${n(cy + rad * Math.sin(a))}`;
  });
  return `<polygon points="${pts.join(" ")}" fill="${fill}"/>`;
}

// Fourteen-point comic burst centred on (cx, cy).
export function burst(cx: number, cy: number, r: number, fill: string) {
  const pts = Array.from({ length: 28 }, (_, i) => {
    const rad = i % 2 ? r * 0.76 : r;
    const a = (i * Math.PI) / 14;
    return `${n(cx + rad * Math.cos(a))},${n(cy + rad * Math.sin(a))}`;
  });
  return `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="${c.ink}" stroke-width="3" stroke-linejoin="round"/>`;
}

// Placeholder character built from basic shapes; swap for real artwork by replacing this function.
export const mascot = (x: number, y: number, size: number) =>
  icon(
    x,
    y,
    size,
    `<g stroke="${c.ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M100 36V16M40 104L18 86M160 104l24-22M84 146v30M116 146v30" fill="none"/><circle cx="100" cy="12" r="8" fill="${c.yellow}"/><circle cx="16" cy="84" r="8" fill="${c.yellow}"/><circle cx="186" cy="80" r="8" fill="${c.yellow}"/><ellipse cx="78" cy="180" rx="16" ry="8" fill="${c.white}"/><ellipse cx="122" cy="180" rx="16" ry="8" fill="${c.white}"/><rect x="40" y="36" width="120" height="112" rx="18" fill="${c.mint}"/><rect x="56" y="52" width="88" height="66" rx="8" fill="${c.ink}"/></g><circle cx="82" cy="78" r="8" fill="${c.yellow}"/><circle cx="118" cy="78" r="8" fill="${c.yellow}"/><path d="M84 98Q100 110 116 98" fill="none" stroke="${c.yellow}" stroke-width="5" stroke-linecap="round"/><path d="M62 132h22M94 132h8" stroke="${c.ink}" stroke-width="5" stroke-linecap="round"/>`,
    200,
  );

// Issue covers (daily, weekly, monthly): a print halftone of the issue's motif photo, revealed by soft
// concentric rings in the manner of Wojciech Fangor's paintings. Everything follows from the issue (its
// kind, key and first section), so a cover renders the same on every request and is cached by content.
// Two outputs: the raster alone as SVG for the website (the page sets the type over it), and the share
// card (1200×630 PNG) for the issue's links.
import { createHash } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
import { CATEGORIES } from "@aihot/industry/taxonomy";
import { COVER_DEFAULTS, COVER_MOTIFS, type CoverMotif } from "@aihot/site/covers";
import type { ReportKind } from "@aihot/contracts/site";
import { REPO_ROOT } from "../config.ts";
import { clamp, h, renderPng, SITE_HOST, type Node } from "./og.ts";

export const COVER_TEMPLATE_VERSION = "cover-2026-10-29.1";

/** Raster drawing box (3:4) and the screen's cell: about 55 dots across. */
const BOX_W = 300;
const BOX_H = 400;
const CELL = 5.5;
/** Halftone screens are turned 15° so the dots do not line up with the page edges. */
const ANGLE = (15 * Math.PI) / 180;
export const COVER_INK = "#0e0e0f";
const PAPER = "#f7f7f5";

export interface CoverMotifChoice extends CoverMotif {
  key: string;
}

/** The motif of an issue: a daily takes its first section's category, other issues their kind's default. */
export function coverMotif(kind: ReportKind, sectionLabels: readonly string[]): CoverMotifChoice {
  const first = sectionLabels[0];
  const category = kind === "daily" && first ? CATEGORIES.find((c) => c.label === first || c.section === first || c.feedLabel === first) : undefined;
  const key = category && COVER_MOTIFS[category.key] ? category.key : COVER_DEFAULTS[kind];
  return { key, ...COVER_MOTIFS[key]! };
}

interface Grey {
  w: number;
  h: number;
  px: Uint8Array;
}

const greys = new Map<string, Promise<Grey>>();

function motifPixels(file: string): Promise<Grey> {
  let found = greys.get(file);
  if (!found) {
    found = sharp(path.join(REPO_ROOT, "site/covers", file))
      .greyscale()
      .resize(BOX_W, BOX_H, { fit: "cover" })
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => ({ w: info.width, h: info.height, px: new Uint8Array(data.buffer, data.byteOffset, info.width * info.height) }));
    found.catch(() => greys.delete(file));
    greys.set(file, found);
  }
  return found;
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Darkness of the rings at distance d (1 = the rings' radius): a soft core, a glowing ring, a halo. */
function rings(d: number): number {
  const core = 1 - smooth(0.18, 0.46, d);
  const ring = Math.exp(-(((d - 0.66) / 0.075) ** 2));
  const halo = 0.18 * (1 - smooth(0.66, 1.05, d));
  return Math.min(1, 0.92 * core + 0.62 * ring + halo);
}

/** Where the rings sit on this issue's cover: a fixed choice per issue, different from issue to issue. */
export function coverComposition(kind: ReportKind, key: string) {
  const hash = createHash("sha256").update(`${kind}:${key}`).digest();
  const unit = (i: number) => hash[i]! / 255;
  return { cx: 0.36 + 0.28 * unit(0), cy: 0.4 + 0.22 * unit(1), r: 0.58 + 0.12 * unit(2) };
}

/** The halftone as one SVG path of dots on a transparent ground, in a 300×400 box. */
export async function coverRasterPath(kind: ReportKind, key: string, motif: CoverMotifChoice): Promise<string> {
  const g = await motifPixels(motif.file);
  const { cx, cy, r } = coverComposition(kind, key);
  const ox = BOX_W * cx;
  const oy = BOX_H * cy;
  const radius = Math.max(BOX_W, BOX_H) * r;
  const ca = Math.cos(ANGLE);
  const sa = Math.sin(ANGLE);
  const span = Math.hypot(BOX_W, BOX_H);
  const n = (v: number) => Math.round(v * 10) / 10;
  const parts: string[] = [];
  for (let v = -span; v < span; v += CELL) {
    for (let u = -span; u < span; u += CELL) {
      const x = BOX_W / 2 + u * ca - v * sa;
      const y = BOX_H / 2 + u * sa + v * ca;
      if (x < -CELL || y < -CELL || x > BOX_W + CELL || y > BOX_H + CELL) continue;
      const ix = Math.min(g.w - 1, Math.max(0, Math.floor(x)));
      const iy = Math.min(g.h - 1, Math.max(0, Math.floor(y)));
      const dark = (1 - g.px[iy * g.w + ix]! / 255) ** 0.9;
      const k = dark * (0.34 + 0.66 * Math.min(1, rings(Math.hypot(x - ox, y - oy) / radius) * 1.4));
      // Dot area follows the darkness, as in an amplitude-modulated screen.
      const rad = n(CELL * 0.56 * Math.sqrt(k));
      if (rad < 0.3) continue;
      parts.push(`M${n(x - rad)} ${n(y)}a${rad} ${rad} 0 1 0 ${n(rad * 2)} 0a${rad} ${rad} 0 1 0 ${n(-rad * 2)} 0`);
    }
  }
  return parts.join("");
}

/** The website's cover picture: the raster alone; the page sets the issue's name and headlines over it. */
export async function coverRasterSvg(kind: ReportKind, key: string, motif: CoverMotifChoice): Promise<string> {
  const d = await coverRasterPath(kind, key, motif);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${BOX_W} ${BOX_H}" width="${BOX_W * 2}" height="${BOX_H * 2}" role="img"><title>${escapeXml(motif.alt)}</title><path fill="${COVER_INK}" d="${d}"/></svg>`;
}

function escapeXml(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

export interface CoverCard {
  kind: ReportKind;
  key: string;
  /** "Dziennik", "Tygodnik", "Miesięcznik". */
  name: string;
  issueNumber: number;
  /** The issue's date or period as readers say it. */
  dateLabel: string;
  headline: string;
  meta: string;
  motif: CoverMotifChoice;
}

export function coverEtag(c: CoverCard): string {
  return createHash("sha256").update(COVER_TEMPLATE_VERSION).update(JSON.stringify(c)).digest("hex").slice(0, 24);
}

/** The share card: the cover on the left, the issue's name, number and headline on newsprint. */
async function cardTree(c: CoverCard): Promise<Node> {
  const svg = await coverRasterSvg(c.kind, c.key, c.motif);
  const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  const headline = clamp(c.headline, 90);
  const len = [...headline].length;
  const size = len > 60 ? 54 : len > 36 ? 64 : 76;
  const rule = `3px solid ${COVER_INK}`;
  return h(
    "div",
    { width: 1200, height: 630, display: "flex", backgroundColor: "#e4e4e2", color: COVER_INK, fontFamily: "Noto Sans", padding: 28 },
    [
      h("div", { width: 432, height: 574, display: "flex", position: "relative", backgroundColor: PAPER, boxShadow: "0 18px 40px rgba(0,0,0,0.25)" }, [
        h("img", { position: "absolute", left: 0, top: 0, width: 432, height: 574 }, undefined, { src, width: 432, height: 574 }),
        h("div", { position: "absolute", left: 24, top: 24, right: 24, display: "flex", flexDirection: "column" }, [
          h("div", { display: "flex", justifyContent: "space-between", fontSize: 18, borderBottom: rule, padding: "4px 6px 6px", backgroundColor: PAPER }, [
            h("div", { display: "flex" }, `Nr ${c.issueNumber}`),
            h("div", { display: "flex" }, c.dateLabel),
          ]),
          h("div", { display: "flex", alignSelf: "flex-start", marginTop: 10, padding: "4px 10px 0 0", backgroundColor: PAPER, fontFamily: "Archivo Narrow", fontWeight: 700, fontSize: 92, lineHeight: 0.86, letterSpacing: -2, textTransform: "uppercase" }, c.name),
        ]),
      ]),
      h("div", { flex: 1, display: "flex", flexDirection: "column", marginLeft: 44, paddingTop: 4 }, [
        h("div", { display: "flex", justifyContent: "space-between", fontSize: 20, borderTop: `6px solid ${COVER_INK}`, borderBottom: `1px solid ${COVER_INK}`, padding: "8px 0" }, [
          h("div", { display: "flex", fontFamily: "Archivo Narrow", fontWeight: 700, fontSize: 30, textTransform: "uppercase", letterSpacing: -0.5 }, "Excellence News"),
          h("div", { display: "flex", alignItems: "center" }, SITE_HOST),
        ]),
        h("div", { display: "flex", marginTop: 34, fontFamily: "Archivo Narrow", fontWeight: 700, fontSize: size, lineHeight: 0.98, textTransform: "uppercase", letterSpacing: -1 }, headline),
        h("div", { flex: 1, display: "flex" }),
        h("div", { display: "flex", fontSize: 22, color: "#4a4a4d", borderTop: `1px solid ${COVER_INK}`, paddingTop: 12 }, clamp(c.meta, 64)),
      ]),
    ],
  );
}

/** PNG bytes of an issue's share card, from the disk cache when this exact card was rendered before. */
export async function renderCoverCard(c: CoverCard): Promise<{ png: Buffer; etag: string }> {
  const etag = coverEtag(c);
  return { png: await renderPng(`cover-${etag}`, { width: 1200, height: 630 }, () => cardTree(c)), etag };
}

// The front page as an old magazine: the masthead fills the first screen and folds into the corner as
// the reader scrolls, while the latest daily, weekly and monthly come in as covers; a cover opens like a
// booklet into its issue. At the foot of the page the masthead grows back to full width. Scroll drives
// every movement through one eased value, so the motion follows the wheel smoothly instead of in steps.
import { useEffect, useLayoutEffect, useRef, type MouseEvent, type RefObject } from "react";
import { useNavigate } from "react-router";
import type { IssueCover } from "@aihot/contracts/site";
import { COVER_MOTIFS } from "@aihot/site/covers";
import { count, SITE } from "@aihot/site";

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
/** How strongly the background rings print (app.css starts them at the same value). */
const RING_OPACITY = 0.14;
const ENTRY_FORMS: [string, string, string] = ["wiadomość", "wiadomości", "wiadomości"];

/**
 * Calls `frame` with the section's scroll progress (0 → 1), eased: the value follows the scroll position
 * exponentially, by the time elapsed rather than per frame, and the loop stops once it has caught up.
 */
function useScrollProgress(ref: RefObject<HTMLElement | null>, progress: (el: HTMLElement) => number, frame: (p: number) => void) {
  const frameRef = useRef(frame);
  frameRef.current = frame;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Without motion the section shows its end state and nothing follows the scroll.
    if (reducedMotion()) {
      const still = () => frameRef.current(1);
      still();
      window.addEventListener("resize", still);
      return () => window.removeEventListener("resize", still);
    }
    let value = progress(el);
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
      last = t;
      const target = progress(el);
      value += (target - value) * (1 - Math.exp(-dt * 9));
      frameRef.current(value);
      if (Math.abs(target - value) > 0.0002) raf = requestAnimationFrame(tick);
      else last = 0;
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    frameRef.current(value);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      cancelAnimationFrame(raf);
    };
    // The progress function is fixed per section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

/** Soft concentric rings in the manner of Fangor, as a halftone of dots in the ink colour; drawn once. */
function drawRings(canvas: HTMLCanvasElement, at: { cx: number; cy: number; r: number }) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const g = canvas.getContext("2d");
  if (!g) return;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  g.clearRect(0, 0, w, h);
  g.fillStyle = getComputedStyle(canvas).color;
  const cx = w * at.cx;
  const cy = h * at.cy;
  const R = Math.max(w, h) * at.r;
  const step = 11;
  const ca = Math.cos(0.26);
  const sa = Math.sin(0.26);
  const span = Math.hypot(w, h);
  for (let v = -span; v < span; v += step) {
    for (let u = -span; u < span; u += step) {
      const x = w / 2 + u * ca - v * sa;
      const y = h / 2 + u * sa + v * ca;
      if (x < -step || y < -step || x > w + step || y > h + step) continue;
      const d = Math.hypot(x - cx, y - cy) / R;
      const k = clamp(0.92 * (1 - smooth(0.18, 0.46, d)) + 0.62 * Math.exp(-(((d - 0.66) / 0.075) ** 2)) + 0.18 * (1 - smooth(0.66, 1.05, d)));
      const rad = step * 0.56 * Math.sqrt(k);
      if (rad < 0.35) continue;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
  }
}

function useRings(ref: RefObject<HTMLCanvasElement | null>, at: { cx: number; cy: number; r: number }) {
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const draw = () => drawRings(c, at);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(c);
    // The ink colour follows the theme switch.
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      ro.disconnect();
      mo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}

/** Size of the two-line masthead at full width, measured once the face has loaded. */
function fitMasthead(mast: HTMLElement, width: number, height: number) {
  mast.style.transform = "none";
  mast.style.fontSize = "100px";
  const natural = mast.getBoundingClientRect().width || 1;
  const size = Math.min((100 * width) / natural, (height * 0.6) / 1.6);
  mast.style.fontSize = `${size}px`;
  return mast.getBoundingClientRect();
}

function useFonts(run: () => void) {
  useLayoutEffect(() => {
    run();
    let alive = true;
    document.fonts?.ready.then(() => alive && run());
    window.addEventListener("resize", run);
    return () => {
      alive = false;
      window.removeEventListener("resize", run);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/** The first screens of the front page: the masthead, then the covers of the latest issues. */
export function MagazineIntro({ covers }: { covers: IssueCover[] }) {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mast = useRef<HTMLHeadingElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLAnchorElement>(null);
  const rings = useRef<HTMLCanvasElement>(null);
  const shelf = useRef<HTMLElement>(null);
  const box = useRef<{ w: number; h: number; x0: number; y0: number; end: number; height: number } | null>(null);
  const navigate = useNavigate();

  useRings(rings, { cx: 0.7, cy: 0.45, r: 0.55 });
  useFonts(() => {
    const s = stage.current;
    const m = mast.current;
    if (!s || !m) return;
    const r = fitMasthead(m, s.clientWidth, s.clientHeight);
    const phone = s.clientWidth < 640;
    box.current = {
      w: s.clientWidth,
      h: s.clientHeight,
      x0: (s.clientWidth - r.width) / 2,
      y0: Math.max(12, (s.clientHeight - r.height) / 2 - 24),
      end: clamp((phone ? 132 : 188) / r.width, 0.04, 1),
      height: r.height,
    };
    window.dispatchEvent(new Event("scroll"));
  });

  useScrollProgress(
    section,
    (el) => {
      const range = el.offsetHeight - (stage.current?.clientHeight ?? window.innerHeight);
      return clamp(-el.getBoundingClientRect().top / Math.max(1, range));
    },
    (p) => {
      const b = box.current;
      const m = mast.current;
      if (!b || !m) return;
      const t = easeOut(smooth(0, 0.42, p));
      const s = 1 + (b.end - 1) * t;
      const y = b.y0 + (10 - b.y0) * t;
      m.style.transform = `translate3d(${b.x0 * (1 - t)}px, ${y}px, 0) scale(${s})`;
      if (strip.current) {
        strip.current.style.transform = `translate3d(0, ${y + b.height * s + 10}px, 0)`;
        strip.current.style.opacity = String(1 - smooth(0.08, 0.28, p));
      }
      if (hint.current) hint.current.style.opacity = String(1 - smooth(0, 0.08, p));
      // The shortcut leaves with the hint; hidden, not just transparent, so the keyboard skips it too.
      if (skip.current) {
        skip.current.style.opacity = String(1 - smooth(0, 0.1, p));
        skip.current.style.visibility = p > 0.12 ? "hidden" : "";
      }
      if (rings.current) {
        rings.current.style.transform = `translate3d(${-6 * p}%, ${5 * p}%, 0) scale(${1 + 0.22 * p})`;
        rings.current.style.opacity = String(RING_OPACITY * (1 - 0.55 * p));
      }
      shelf.current?.querySelectorAll<HTMLElement>("[data-cover]").forEach((c, i) => {
        const q = easeOut(smooth(0.28 + i * 0.06, 0.8 + i * 0.06, p));
        c.style.transform = `translate3d(0, ${(1 - q) * 85}vh, 0) rotate(${(1 - q) * (i - 1) * 9}deg)`;
        c.style.opacity = String(smooth(0, 0.25, q));
        c.style.visibility = q < 0.01 ? "hidden" : "";
      });
    },
  );

  const daily = covers.find((c) => c.kind === "daily");
  const open = (e: MouseEvent<HTMLAnchorElement>, cover: IssueCover) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void openIssue(e.currentTarget, cover, (to) => navigate(to));
  };

  return (
    <section ref={section} className="mag-intro" aria-label="Najnowsze wydania">
      <div ref={stage} className="mag-stage">
        <canvas ref={rings} className="mag-rings" aria-hidden="true" />
        <h1 ref={mast} className="mag-mast">
          <span>Excellence</span>
          <span>News</span>
        </h1>
        <div ref={strip} className="mag-strip mono">
          <span>{daily ? `Rocznik I · Nr ${daily.issueNumber}` : "Rocznik I"}</span>
          <span className="max-sm:hidden">Lean · OPEX · Agile · Koszty · Łańcuch dostaw</span>
          <span>{daily?.dateLabel ?? ""}</span>
        </div>
        <div ref={hint} className="mag-hint mono" aria-hidden="true">
          Przewiń
          <i />
        </div>
        <a ref={skip} href="#wiadomosci" className="mag-skip mono">
          Prosto do wiadomości ↓
        </a>
        {covers.length > 0 && (
          <nav ref={shelf} className="mag-shelf" aria-label="Wydania" tabIndex={0}>
            {covers.map((c) => (
              <a key={c.kind} data-cover href={c.href} className="mag-cover" onClick={(e) => open(e, c)} aria-label={`${c.name} nr ${c.issueNumber}, ${c.dateLabel}: ${c.headline}`}>
                <CoverFace cover={c} />
              </a>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}

function CoverFace({ cover }: { cover: IssueCover }) {
  return (
    <div className="mag-cface">
      <img src={cover.raster} alt="" width={600} height={800} decoding="async" />
      <div className="mag-ctop mono">
        <span>Nr {cover.issueNumber}</span>
        <span>{cover.dateLabel}</span>
      </div>
      <div className="mag-cname">{cover.name}</div>
      <div className="mag-clines">
        <b>{cover.headline}</b>
        {cover.lines.map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      <div className="mag-cfoot mono">
        <span>{count(cover.count, ENTRY_FORMS)}</span>
        <span>{cover.readingMinutes} min</span>
      </div>
    </div>
  );
}

/**
 * Opens a cover like a booklet: it lifts to the middle of the screen, the cover turns on its spine and
 * shows the contents, then the page zooms in as the issue loads. Without motion it simply opens the issue.
 */
async function openIssue(anchor: HTMLElement, cover: IssueCover, go: (to: string) => Promise<void> | void) {
  if (reducedMotion() || !Element.prototype.animate) {
    await go(cover.href);
    return;
  }
  const r = anchor.getBoundingClientRect();
  let th = Math.min(window.innerHeight * 0.78, 620);
  let tw = th * 0.75;
  if (tw * 2 > window.innerWidth - 32) {
    tw = (window.innerWidth - 32) / 2;
    th = tw / 0.75;
  }
  const left = window.innerWidth / 2;
  const top = (window.innerHeight - th) / 2;

  const book = document.createElement("div");
  book.className = "mag-book";
  Object.assign(book.style, { left: `${left}px`, top: `${top}px`, width: `${tw}px`, height: `${th}px` });
  const leaf = document.createElement("div");
  leaf.className = "mag-leaf";
  const head = document.createElement("div");
  head.className = "mag-leaf-name";
  head.textContent = cover.name;
  const meta = document.createElement("div");
  meta.className = "mono";
  meta.textContent = `Nr ${cover.issueNumber} · ${cover.dateLabel}`;
  const list = document.createElement("ol");
  for (const t of [cover.headline, ...cover.lines]) {
    const li = document.createElement("li");
    li.textContent = t;
    list.append(li);
  }
  leaf.append(head, meta, list);
  const shade = document.createElement("div");
  shade.className = "mag-shade";
  const lid = document.createElement("div");
  lid.className = "mag-lid";
  const front = document.createElement("div");
  front.className = "mag-lid-front";
  const face = anchor.querySelector(".mag-cface");
  if (face) front.append(face.cloneNode(true));
  const back = document.createElement("div");
  back.className = "mag-lid-back";
  back.textContent = `${SITE.name} · ${cover.name}`;
  lid.append(front, back);
  book.append(leaf, shade, lid);
  document.body.append(book);
  anchor.style.visibility = "hidden";

  const sx = r.width / tw;
  const sy = r.height / th;
  const placed = `translate(${-tw / 2}px, 0) scale(1)`;
  book.animate([{ transform: `translate(${r.left - left}px, ${r.top - top}px) scale(${sx}, ${sy})` }, { transform: placed }], {
    duration: 640,
    easing: "cubic-bezier(.22,1,.36,1)",
    fill: "forwards",
  });
  await wait(420); // the cover starts to turn before the booklet has landed
  lid.animate([{ transform: "rotateY(0deg)" }, { transform: "rotateY(-178deg)" }], { duration: 1100, easing: "cubic-bezier(.65,0,.35,1)", fill: "forwards" });
  shade.animate([{ opacity: 0 }, { opacity: 1, offset: 0.5 }, { opacity: 0 }], { duration: 1100, easing: "ease-in-out", fill: "forwards" });
  await wait(820);
  const zoom = book.animate([{ transform: placed, opacity: 1 }, { transform: `translate(${-tw / 2}px, 0) scale(1.9)`, opacity: 0 }], {
    duration: 560,
    easing: "cubic-bezier(.7,0,.84,0)",
    fill: "forwards",
  });
  try {
    await Promise.all([go(cover.href), zoom.finished]);
  } finally {
    book.remove();
    anchor.style.visibility = "";
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The foot of the front page: the masthead grows from a small mark to the full width. */
export function MagazineOutro() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const mast = useRef<HTMLParagraphElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const rings = useRef<HTMLCanvasElement>(null);
  const box = useRef<{ w: number; h: number; width: number; height: number; start: number; bottom: number } | null>(null);

  useRings(rings, { cx: 0.5, cy: 0.5, r: 0.62 });
  useFonts(() => {
    const s = stage.current;
    const m = mast.current;
    if (!s || !m) return;
    const r = fitMasthead(m, s.clientWidth, s.clientHeight);
    box.current = {
      w: s.clientWidth,
      h: s.clientHeight,
      width: r.width,
      height: r.height,
      start: clamp((s.clientWidth < 640 ? 132 : 188) / r.width, 0.04, 1),
      bottom: (strip.current?.offsetHeight ?? 30) + 28,
    };
    window.dispatchEvent(new Event("scroll"));
  });

  useScrollProgress(
    section,
    (el) => {
      const lead = window.innerHeight * 0.35;
      const range = el.offsetHeight - (stage.current?.clientHeight ?? window.innerHeight);
      return clamp((lead - el.getBoundingClientRect().top) / (range + lead));
    },
    (q) => {
      const b = box.current;
      const m = mast.current;
      if (!b || !m) return;
      const t = easeOut(smooth(0.05, 0.85, q));
      const s = b.start + (1 - b.start) * t;
      const end = b.h - b.height - b.bottom;
      m.style.transform = `translate3d(${((b.w - b.width * s) / 2) * (1 - t)}px, ${(b.h / 2 - (b.height * s) / 2) * (1 - t) + end * t}px, 0) scale(${s})`;
      if (strip.current) strip.current.style.opacity = String(smooth(0.7, 1, q));
      if (rings.current) {
        rings.current.style.transform = `scale(${0.45 + 0.55 * t})`;
        rings.current.style.opacity = String(RING_OPACITY * (0.35 + 0.65 * t));
      }
    },
  );

  const authors = [...new Set(Object.values(COVER_MOTIFS).map((m) => m.author))];
  return (
    <section ref={section} className="mag-outro" aria-label="Stopka">
      <div ref={stage} className="mag-stage">
        <canvas ref={rings} className="mag-rings mag-rings-center" aria-hidden="true" />
        <p ref={mast} className="mag-mast" aria-hidden="true">
          <span>Excellence</span>
          <span>News</span>
        </p>
        <div ref={strip} className="mag-ostrip mono">
          <span>Wydawca: {SITE.name}</span>
          <span>RSS · API · MCP</span>
          <span>Rocznik I · {SITE.since ?? ""}</span>
          <span className="mag-credit">Zdjęcia okładek: {authors.join(", ")} (Unsplash)</span>
        </div>
      </div>
    </section>
  );
}

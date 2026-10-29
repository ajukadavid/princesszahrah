"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { chapters, person, type ChapterId } from "@/lib/content";
import type { Active } from "./DeskScene";
import { Contact, Mandate, Mobilisation, Prologue, Record, Rooms, Words } from "./Chapters";

const DeskScene = dynamic(() => import("./DeskScene"), { ssr: false });

const CONTENT: Record<ChapterId, () => React.ReactElement> = {
  prologue: Prologue,
  mandate: Mandate,
  record: Record,
  rooms: Rooms,
  mobilisation: Mobilisation,
  words: Words,
  contact: Contact,
};

function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () =>
      setT(
        new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos", hour12: false }).format(new Date()),
      );
    f();
    const id = setInterval(f, 10000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">Abuja {t}</span>;
}

export default function DeskPage() {
  const [started, setStarted] = useState(false);
  const [active, setActive] = useState<Active>(null);
  const [panelItem, setPanelItem] = useState<ChapterId | null>(null);
  const [menu, setMenu] = useState(false);
  const [evening, setEvening] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isNarrow = () => window.matchMedia("(max-width: 767px)").matches;

  /** Single entry point for choosing a chapter (scene clicks, menu, keyboard). */
  const select = useCallback((id: Active) => {
    setActive(id);
    if (id) setPanelItem(id);
  }, []);

  // closing: slide the panel out, then drop its content
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    gsap.killTweensOf(el);
    if (active) return;
    const off = isNarrow() ? { yPercent: 100 } : { xPercent: 100 };
    gsap.to(el, { ...off, opacity: 0, duration: 0.5, ease: "power3.in", onComplete: () => setPanelItem(null) });
  }, [active]);

  useEffect(() => {
    const el = panel.current;
    if (!el || !panelItem) return;
    el.scrollTop = 0;
    const from = isNarrow() ? { yPercent: 100, xPercent: 0 } : { xPercent: 100, yPercent: 0 };
    gsap.fromTo(el, { ...from, opacity: 0 }, { xPercent: 0, yPercent: 0, opacity: 1, duration: 0.9, ease: "power4.out", delay: 0.3 });
    gsap.fromTo(el.querySelectorAll("[data-p]"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: "power3.out", delay: 0.6 });
  }, [panelItem]);

  // chapter index overlay
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    if (menu) {
      gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "power2.out" });
      gsap.fromTo(el.querySelectorAll("[data-m]"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power3.out", delay: 0.1 });
    }
  }, [menu]);

  const enter = () => {
    if (!intro.current) return;
    gsap.to(intro.current, { opacity: 0, y: -20, duration: 0.8, ease: "power3.inOut", onComplete: () => setStarted(true) });
  };

  const go = useCallback(
    (dir: 1 | -1) => {
      const idx = active ? chapters.findIndex((c) => c.id === active) : dir === 1 ? -1 : chapters.length;
      const next = chapters[(idx + dir + chapters.length) % chapters.length];
      select(next.id);
    },
    [active, select],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setActive(null);
      }
      if (!started) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, started]);

  const speak = useCallback(() => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance("Zahrah Mustapha Audu");
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, []);

  const Content = panelItem ? CONTENT[panelItem] : null;
  const panelMeta = panelItem ? chapters.find((c) => c.id === panelItem)! : null;

  return (
    <main className="grain relative h-[100svh] overflow-hidden bg-linen text-ink">
      <DeskScene active={active} onSelect={select} started={started} evening={evening} onToggleEvening={() => setEvening((v) => !v)} onSpeak={speak} />

      {/* top bar */}
      <header className="eyebrow absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 text-ink/75 md:px-8 md:py-5">
        <button onClick={() => setActive(null)} className="pointer-events-auto text-left hover:text-ink">
          <span className="block">{person.short}</span>
          <span className="hidden text-ink/35 md:block">{person.titleShort}</span>
        </button>
        <div className="hidden items-center gap-6 md:flex">
          <Clock />
          <button onClick={() => setEvening((v) => !v)} className="hover:text-gold">
            {evening ? "Evening session" : "Day session"} · {evening ? "◐" : "○"}
          </button>
        </div>
        {started && (
          <button onClick={() => setMenu(true)} className="pointer-events-auto rounded-full border border-ink/15 bg-ivory/70 px-4 py-2 text-ink/80 backdrop-blur hover:border-rose hover:text-rose">
            Chapters
          </button>
        )}
      </header>

      {/* intro */}
      {!started && (
        <div ref={intro} className="absolute inset-0 z-20 flex flex-col items-start justify-end bg-gradient-to-t from-linen via-linen/55 via-45% to-transparent px-5 pb-16 md:px-8 md:pb-20">
          <p className="eyebrow text-rose">Office of the Director General · PEBEC</p>
          <h1 className="serif mt-4 max-w-3xl text-4xl leading-[1.05] md:text-6xl">{person.name}</h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-ink/60">
            Everything on this desk opens a chapter. The dossier is her story. The kiosk is the mandate. The map keeps score. The envelope reaches her.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button onClick={enter} className="eyebrow inline-flex items-center gap-3 rounded-full border border-rose/50 bg-ivory/70 px-6 py-3 text-rose transition hover:bg-rose hover:text-ivory">
              Enter the office <span>→</span>
            </button>
            <button
              onClick={() => {
                enter();
                setTimeout(() => setMenu(true), 900);
              }}
              className="eyebrow text-ink/50 hover:text-ink"
            >
              Or read the chapters
            </button>
          </div>
        </div>
      )}

      {/* overview hint */}
      {started && !active && !menu && (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center px-4">
          <p className="eyebrow rounded-full border border-ink/10 bg-ivory/70 px-4 py-2 text-center text-ink/60 backdrop-blur">
            <span className="hidden md:inline">Hover an object · click to open · ← → to move between chapters · the lamp changes the hour</span>
            <span className="md:hidden">Tap an object · or open Chapters</span>
          </p>
        </div>
      )}

      {/* chapter panel: right drawer on desktop, bottom sheet on mobile */}
      <aside
        ref={panel}
        className={`absolute inset-x-0 bottom-0 z-30 max-h-[62svh] overflow-y-auto rounded-t-2xl border-t border-ink/10 bg-ivory/92 px-5 pb-10 pt-5 opacity-0 backdrop-blur-xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[540px] md:rounded-none md:border-l md:border-t-0 md:px-10 md:py-8 ${
          panelItem ? "" : "pointer-events-none"
        }`}
      >
        {panelMeta && Content && (
          <div>
            <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between bg-ivory/90 px-5 py-4 backdrop-blur md:-mx-10 md:-mt-8 md:px-10 md:py-5">
              <p data-p className="eyebrow min-w-0 truncate pr-3 text-rose">
                {panelMeta.n} · {panelMeta.name}
                <span className="ml-3 hidden text-ink/35 lg:inline">{panelMeta.object}</span>
              </p>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => go(-1)} aria-label="Previous chapter" className="eyebrow rounded-full border border-ink/15 px-3 py-1.5 text-ink/70 hover:border-gold hover:text-gold">
                  ←
                </button>
                <button onClick={() => go(1)} aria-label="Next chapter" className="eyebrow rounded-full border border-ink/15 px-3 py-1.5 text-ink/70 hover:border-gold hover:text-gold">
                  →
                </button>
                <button onClick={() => setActive(null)} className="eyebrow ml-1 rounded-full border border-ink/15 px-3 py-1.5 text-ink/70 hover:border-gold hover:text-gold">
                  Close
                </button>
              </div>
            </div>
            <Content />
            <div className="mt-12 flex items-center justify-between border-t border-ink/10 pt-5">
              <button onClick={() => go(1)} className="group text-left">
                <span className="eyebrow block text-ink/40">Next</span>
                <span className="serif text-xl text-ink group-hover:text-gold">
                  {chapters[(chapters.findIndex((c) => c.id === panelMeta.id) + 1) % chapters.length].name} →
                </span>
              </button>
              <button onClick={() => setMenu(true)} className="eyebrow text-ink/40 hover:text-ink">
                All chapters
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* chapter index */}
      {menu && (
        <div ref={menuRef} className="absolute inset-0 z-40 flex flex-col bg-linen/92 px-5 py-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-ink/50">Chapters · {person.short}</p>
            <button onClick={() => setMenu(false)} className="eyebrow rounded-full border border-ink/15 px-4 py-2 text-ink/80 hover:border-gold hover:text-gold">
              Close
            </button>
          </div>
          <ol className="mt-10 flex-1 overflow-y-auto md:mt-16">
            {chapters.map((c) => (
              <li key={c.id} data-m>
                <button
                  onClick={() => {
                    setMenu(false);
                    select(c.id);
                  }}
                  className="group flex w-full items-baseline gap-5 border-t border-ink/10 py-4 text-left md:gap-10 md:py-5"
                >
                  <span className="eyebrow w-8 shrink-0 text-rose">{c.n}</span>
                  <span className="serif text-2xl text-ink transition group-hover:text-gold md:text-4xl">{c.name}</span>
                  <span className="ml-auto hidden text-right text-sm text-ink/45 md:block">
                    {c.object}
                    <br />
                    <span className="text-ink/30">{c.line}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="eyebrow flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4 text-ink/40">
            <span>{person.titleShort}</span>
            <button onClick={speak} className="hover:text-gold">
              {person.pronunciation} · ♪
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

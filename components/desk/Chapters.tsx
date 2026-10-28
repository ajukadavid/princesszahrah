"use client";

import { useState } from "react";
import Counter from "@/components/Counter";
import {
  contact,
  images,
  mandate,
  mobilisation,
  person,
  press,
  prologue,
  quotes,
  record,
  rooms,
  states,
  timeline,
  type PressKind,
} from "@/lib/content";

const gold = "text-gold"; // figures and quotes in brass; small labels in rose

function Row({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div data-p className={`border-t border-ink/10 pt-4 ${className}`}>
      {children}
    </div>
  );
}

/** A photograph, or a quiet placeholder until one is supplied in lib/content.ts → images. */
function Photo({ src, alt, ratio, note, className = "" }: { src: string | null; alt: string; ratio: string; note: string; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static asset, sized by CSS, no optimisation pipeline needed
      <img src={src} alt={alt} loading="lazy" className={`w-full rounded-sm object-cover ${ratio} ${className}`} />
    );
  }
  return (
    <div className={`w-full rounded-sm bg-gradient-to-br from-blush to-[#d9bfb1] ${ratio} ${className}`}>
      <span className="eyebrow block p-3 text-ink/40">{note}</span>
    </div>
  );
}

/* ---------------- I ---------------- */
export function Prologue() {
  return (
    <div className="mt-8 space-y-6">
      <p data-p className="eyebrow text-rose">
        {prologue.traits.join(" · ")}
      </p>
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        {person.name}
      </h2>
      <div data-p>
        <Photo src={images.portrait} alt={person.name} ratio="aspect-[4/5]" note="Portrait · to be added" className="max-h-[52svh] md:max-h-none" />
      </div>
      {prologue.paragraphs.map((p) => (
        <p data-p key={p.slice(0, 16)} className="serif text-lg leading-relaxed text-ink/80">
          {p}
        </p>
      ))}
      <ol className="mt-6 space-y-3">
        {timeline.map((t) => (
          <li data-p key={t.label} className="flex gap-4 border-t border-ink/10 pt-3 text-sm">
            <span className={`eyebrow w-20 shrink-0 pt-0.5 ${gold}`}>{t.year}</span>
            <span className="text-ink/75">{t.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ---------------- II ---------------- */
export function Mandate() {
  return (
    <div className="mt-8">
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        {mandate.headline}
      </h2>
      <p data-p className="mt-5 text-[15px] leading-relaxed text-ink/70">
        {mandate.body}
      </p>
      <dl className="mt-8 grid grid-cols-2 gap-6">
        {mandate.facts.map((f) => (
          <Row key={f.label}>
            <dt className={`serif text-4xl ${gold}`}>
              <Counter value={f.value} to={f.to} suffix={f.suffix} />
            </dt>
            <dd className="mt-2 text-[12px] leading-relaxed text-ink/55">{f.label}</dd>
          </Row>
        ))}
      </dl>
      <ul className="mt-8 space-y-3">
        {mandate.pillars.map((p, i) => (
          <li data-p key={p.name} className="flex gap-4 border-t border-ink/10 pt-3">
            <span className="eyebrow pt-1 text-ink/35">0{i + 1}</span>
            <div>
              <h3 className="text-[15px] text-ink">{p.name}</h3>
              <p className="mt-1 text-[13px] leading-relaxed text-ink/55">{p.desc}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- III ---------------- */
export function Record() {
  const visited = states.filter((s) => s.note);
  return (
    <div className="mt-8">
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        {record.headline}
      </h2>
      <p data-p className="mt-5 text-[15px] leading-relaxed text-ink/70">
        {record.body}
      </p>
      <p data-p className="eyebrow mt-6 text-ink/40">
        On the wall, every state capital lights in turn · 36 states + FCT
      </p>
      <ul className="mt-6 space-y-3">
        {visited.map((s) => (
          <li data-p key={s.state} className="border-t border-ink/10 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="serif text-lg">{s.state}</span>
              <span className="eyebrow text-ink/45">
                {s.capital}
                {s.when ? ` · ${s.when}` : ""}
              </span>
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-ink/60">{s.note}</p>
          </li>
        ))}
      </ul>
      <h3 data-p className={`eyebrow mt-10 ${gold}`}>{record.beepa.headline}</h3>
      <table data-p className="mt-4 w-full text-sm">
        <tbody>
          {record.beepa.rows.map((r) => (
            <tr key={r.label} className="border-t border-ink/10">
              <td className="py-2.5 pr-3 text-ink/65">{r.label}</td>
              <td className="py-2.5 text-right font-mono text-ink/40">{r.from}</td>
              <td className="py-2.5 pl-2 text-right font-mono text-ink/40">→</td>
              <td className={`py-2.5 pl-2 text-right font-mono ${gold}`}>{r.to}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- IV ---------------- */
export function Rooms() {
  return (
    <div className="mt-8">
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        Where the work has gone.
      </h2>
      <p data-p className="mt-5 text-[15px] leading-relaxed text-ink/70">
        Each stamp in the passport is an argument made in a room full of people deciding where to put their money. The argument is always the same: Nigeria is becoming predictable.
      </p>
      <ul className="mt-8 space-y-5">
        {rooms.map((r, i) => (
          <li data-p key={r.title} className="border-t border-ink/10 pt-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="serif text-xl">{r.title}</span>
              <span className="eyebrow shrink-0 text-ink/50">
                {r.place} · {r.date}
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink/60">{r.line}</p>
            <Photo src={images.rooms[i] ?? null} alt={`${r.title}, ${r.place}`} ratio="aspect-[16/7]" note="Photograph · to be added" className="mt-3" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------- V ---------------- */
export function Mobilisation() {
  return (
    <div className="mt-8">
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        {mobilisation.headline}
      </h2>
      <p data-p className="mt-5 text-[15px] leading-relaxed text-ink/70">
        {mobilisation.body}
      </p>
      <dl className="mt-8 grid grid-cols-2 gap-6">
        {mobilisation.numbers.map((n) => (
          <Row key={n.label}>
            <dt className={`serif text-4xl ${gold}`}>
              <Counter value={n.value} suffix={n.suffix ?? ""} />
            </dt>
            <dd className="mt-2 text-[12px] leading-relaxed text-ink/55">{n.label}</dd>
          </Row>
        ))}
      </dl>
      <h3 data-p className={`eyebrow mt-10 ${gold}`}>How she leads</h3>
      <ol className="mt-4 space-y-3">
        {mobilisation.principles.map((p, i) => (
          <li data-p key={p} className="flex gap-4 border-t border-ink/10 pt-3 text-[15px] text-ink/80">
            <span className="eyebrow pt-1 text-ink/35">0{i + 1}</span>
            <span>{p}</span>
          </li>
        ))}
      </ol>
      {images.gallery.length > 0 ? (
        <ul data-p className="mt-8 grid grid-cols-2 gap-2">
          {images.gallery.map((src, i) => (
            <li key={src} className={i % 3 === 0 ? "col-span-2" : ""}>
              <Photo src={src} alt={`Archive photograph ${i + 1}`} ratio={i % 3 === 0 ? "aspect-[16/9]" : "aspect-square"} note="" />
            </li>
          ))}
        </ul>
      ) : (
        <p data-p className="eyebrow mt-8 text-ink/35">Archive photography from rallies and food drives to be added</p>
      )}
    </div>
  );
}

/* ---------------- VI ---------------- */
const kinds: ("All" | PressKind)[] = ["All", "Speech", "Interview", "Feature", "Op-ed"];

export function Words() {
  const [kind, setKind] = useState<(typeof kinds)[number]>("All");
  const list = press.filter((p) => kind === "All" || p.kind === kind);
  return (
    <div className="mt-8">
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        In her words. And theirs.
      </h2>
      <div className="mt-6 space-y-6">
        {quotes.map((q) => (
          <figure data-p key={q.text.slice(0, 20)} className="border-t border-ink/10 pt-4">
            <blockquote className={`serif text-lg italic leading-snug ${gold}`}>“{q.text}”</blockquote>
            <figcaption className="eyebrow mt-3 text-ink/45">
              {q.where} · {q.when}
            </figcaption>
          </figure>
        ))}
      </div>
      <div data-p className="mt-10 flex flex-wrap gap-1.5">
        {kinds.map((k) => {
          const n = k === "All" ? press.length : press.filter((p) => p.kind === k).length;
          return (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={`eyebrow rounded-full border px-3 py-1.5 transition ${
                kind === k ? "border-rose bg-rose text-ivory" : "border-ink/15 text-ink/60 hover:border-ink/40"
              }`}
            >
              {k} [{n}]
            </button>
          );
        })}
      </div>
      <ul className="mt-4">
        {list.map((p) => (
          <li key={p.title} className="border-t border-ink/10 py-3">
            {p.href ? (
              <a href={p.href} target="_blank" rel="noreferrer" className="group block">
                <PressLine p={p} />
              </a>
            ) : (
              <PressLine p={p} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PressLine({ p }: { p: (typeof press)[number] }) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[15px] text-ink group-hover:text-gold">{p.title}</span>
        <span className="eyebrow shrink-0 text-ink/40">{p.date}</span>
      </div>
      <div className="eyebrow mt-1 text-ink/45">
        {p.kind} · {p.outlet}
        {p.href ? " · ↗" : ""}
      </div>
    </>
  );
}

/* ---------------- VII ---------------- */
export function Contact() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mt-8">
      <h2 data-p className="serif text-3xl leading-tight md:text-4xl">
        {contact.headline}
      </h2>
      <p data-p className="mt-5 text-[15px] leading-relaxed text-ink/70">
        {contact.body}
      </p>
      <div data-p className="mt-5 flex flex-wrap gap-2">
        <a href={contact.reportgov} target="_blank" rel="noreferrer" className="eyebrow rounded-full border border-sage px-4 py-2 text-sage hover:bg-sage hover:text-ivory">
          ReportGov ↗
        </a>
        <a href={`mailto:${person.email}`} className="eyebrow rounded-full border border-ink/15 px-4 py-2 text-ink/70 hover:border-ink/40">
          {person.email}
        </a>
      </div>
      {sent ? (
        <p data-p className={`serif mt-10 text-xl ${gold}`}>
          Thank you. Your note is on the desk.
        </p>
      ) : (
        <form
          data-p
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input required className="w-full border-b border-ink/15 bg-transparent py-3 text-sm outline-none placeholder:text-ink/35 focus:border-gold" placeholder="Your name" />
          <input className="w-full border-b border-ink/15 bg-transparent py-3 text-sm outline-none placeholder:text-ink/35 focus:border-gold" placeholder="Organisation (optional)" />
          <textarea required rows={4} className="w-full border-b border-ink/15 bg-transparent py-3 text-sm outline-none placeholder:text-ink/35 focus:border-gold" placeholder="Your note" />
          <button className="eyebrow rounded-full border border-rose/50 px-5 py-2.5 text-rose hover:bg-rose hover:text-ivory">Leave the note</button>
        </form>
      )}
      <ul data-p className="mt-10 flex flex-wrap gap-x-5 gap-y-2">
        {person.socials.map((s) => (
          <li key={s.label}>
            <a href={s.href} target="_blank" rel="noreferrer" className="eyebrow text-ink/50 hover:text-gold">
              {s.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

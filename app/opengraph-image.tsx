import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { images, person } from "@/lib/content";

export const alt = `${person.name} — ${person.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const mime = (p: string) => (/\.png$/i.test(p) ? "image/png" : /\.webp$/i.test(p) ? "image/webp" : "image/jpeg");

async function publicFile(p: string) {
  return readFile(path.join(process.cwd(), "public", p));
}

/** Fraunces from Google Fonts so the card matches the site. Falls back silently if offline at build time. */
async function serifFont(): Promise<ArrayBuffer | null> {
  try {
    // an old UA makes Google serve a single WOFF/TTF file (satori cannot read woff2)
    const css = await fetch("https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400&display=swap", {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0" },
    }).then((r) => r.text());
    const url = css.match(/src: url\(([^)]+)\) format\('(?:truetype|opentype|woff)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Social card. Priority: a hand-made `images.og` (1200×630) → a card composed
 * around `images.portrait` → a typographic card. All driven from lib/content.ts.
 */
export default async function Image() {
  if (images.og) {
    const buf = await publicFile(images.og);
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": mime(images.og) } });
  }

  const [portraitBuf, font] = await Promise.all([images.portrait ? publicFile(images.portrait) : null, serifFont()]);
  const portrait = portraitBuf && images.portrait ? `data:${mime(images.portrait)};base64,${portraitBuf.toString("base64")}` : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(160deg, #e9dccb 0%, #dcc1a6 55%, #b58d84 100%)",
          color: "#2a221f",
          fontFamily: font ? "Fraunces" : "serif",
        }}
      >
        <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "flex-end", padding: 72 }}>
          <div style={{ position: "absolute", left: 72, right: portrait ? 540 : 72, top: 72, height: 3, background: "#c9a24a" }} />
          <div style={{ display: "flex", fontSize: portrait ? 18 : 22, letterSpacing: portrait ? 4 : 6, textTransform: "uppercase", color: "#a85c66", fontFamily: "monospace" }}>
            Office of the Director General · PEBEC
          </div>
          <div style={{ display: "flex", fontSize: portrait ? 68 : 84, lineHeight: 1.02, marginTop: 24, letterSpacing: -1 }}>{person.name}</div>
          <div style={{ display: "flex", fontSize: 28, marginTop: 24, color: "#5a4740", fontFamily: "sans-serif" }}>{person.title}</div>
        </div>
        {portrait && (
          <img src={portrait} alt="" width={470} height={630} style={{ width: 470, height: 630, objectFit: "cover" }} />
        )}
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Fraunces", data: font, style: "normal", weight: 400 }] : undefined },
  );
}

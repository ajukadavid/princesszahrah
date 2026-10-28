import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { chapters, images, person, siteUrl } from "@/lib/content";
import "./globals.css";

const serif = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

const title = `${person.name} — Director General, PEBEC`;
const description =
  "Official site of Princess Zahrah Mustapha Audu, Director General of Nigeria's Presidential Enabling Business Environment Council (PEBEC). Her story, the PEBEC mandate, the reform record across 36 states, speeches and press, and how to reach her office.";

// The social image comes from app/opengraph-image.tsx (file-based metadata wins over config),
// which itself reads `images.og` / `images.portrait` from lib/content.ts.

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: `%s · ${person.short}`,
  },
  description,
  applicationName: person.short,
  keywords: [
    ...person.aka,
    "PEBEC",
    "Presidential Enabling Business Environment Council",
    "Director General PEBEC",
    "ease of doing business Nigeria",
    "ReportGov",
    "Business Facilitation Act",
    "Nigeria business reform",
    "Nasarawa",
    "APC North Central Woman Leader",
  ],
  authors: [{ name: person.name, url: siteUrl }],
  creator: person.name,
  publisher: "Office of the Director General, PEBEC",
  category: "government",
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    url: siteUrl,
    siteName: person.short,
    title,
    description,
    locale: "en_NG",
    firstName: "Zahrah",
    lastName: "Mustapha Audu",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e9dccb",
  colorScheme: "light",
};

/** Structured data so Google can show a knowledge panel / rich result for her name. */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: person.name,
      alternateName: person.aka,
      givenName: "Zahrah",
      familyName: "Mustapha Audu",
      honorificPrefix: "Princess",
      jobTitle: "Director General",
      description,
      url: siteUrl,
      ...(images.portrait ? { image: `${siteUrl}${images.portrait}` } : {}),
      email: `mailto:${person.email}`,
      nationality: { "@type": "Country", name: "Nigeria" },
      birthPlace: { "@type": "Place", name: "Nasarawa State, Nigeria" },
      worksFor: {
        "@type": "GovernmentOrganization",
        name: "Presidential Enabling Business Environment Council",
        alternateName: "PEBEC",
        url: "https://www.pebec.gov.ng",
        parentOrganization: { "@type": "GovernmentOrganization", name: "Presidency of the Federal Republic of Nigeria" },
      },
      knowsAbout: ["Ease of doing business", "Regulatory reform", "Foreign direct investment", "Women's political mobilisation", "Trade facilitation"],
      sameAs: person.socials.filter((s) => s.label !== "PEBEC" && !/https?:\/\/[^/]+\/?$/.test(s.href)).map((s) => s.href),
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: person.short,
      about: { "@id": `${siteUrl}/#person` },
      inLanguage: "en-NG",
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteUrl}/#page`,
      url: siteUrl,
      name: title,
      mainEntity: { "@id": `${siteUrl}/#person` },
      isPartOf: { "@id": `${siteUrl}/#website` },
      hasPart: chapters.map((c) => ({ "@type": "WebPageElement", name: `${c.n} · ${c.name}`, description: c.line })),
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-NG" className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}

/** Set NEXT_PUBLIC_SITE_URL in your host's env (e.g. https://zahrahaudu.ng). Used for canonical URLs, OG images and the sitemap. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://zahrahaudu.ng").replace(/\/$/, "");

export const person = {
  name: "Princess Zahrah Mustapha Audu",
  short: "Zahrah Mustapha Audu",
  first: "Zahrah",
  title: "Director General, Presidential Enabling Business Environment Council",
  titleShort: "Director General · PEBEC",
  location: "Abuja, Nigeria",
  since: "January 2025",
  email: "office@zahrahaudu.ng",
  pronunciation: "ZAH-rah · moos-TAH-fah · AH-doo",
  /** Other names people search for; feeds <meta keywords> and the JSON-LD alternateName. */
  aka: ["Zahrah Audu", "Zahrah Mustapha Audu", "Princess Zahrah Audu", "Zahrah Mustapha-Audu", "DG PEBEC"],
  socials: [
    { label: "Instagram", href: "https://instagram.com/princesszahrahma" },
    { label: "X", href: "https://x.com/" },
    { label: "LinkedIn", href: "https://linkedin.com/" },
    { label: "PEBEC", href: "https://www.pebec.gov.ng" },
  ],
};

/* ---------------- images ----------------
 * Drop files into /public/images and set the paths here. Anything left as
 * null falls back to a designed placeholder, so the site works with none.
 *
 *  portrait   — the hero image. Head-and-shoulders or three-quarter, looking
 *               toward camera, soft/neutral background. Portrait 4:5, ≥1600px tall.
 *               Used in the Prologue and as the OpenGraph/social preview.
 *  og         — optional dedicated social card, 1200×630 (landscape). If null,
 *               the portrait is used instead.
 *  frame      — the photograph standing on the desk (Chapter V). A rally or
 *               women's-mobilisation photo with people in it. Landscape 4:3.
 *               ≥1200px wide. It is displayed small, so pick a bold composition.
 *  wall       — the framed portrait hanging on the wall, left of the map.
 *               Portrait 4:5, ≥1200px tall. Formal or official portrait works best.
 *  rooms[]    — one per entry in `rooms` below (same order). Her in the room:
 *               panel, handshake, podium, delegation. Landscape 16:7-ish crop
 *               works best; ≥1600px wide.
 *  gallery[]  — 3–6 archive photos for Chapter V: rallies, food drives, ward
 *               meetings. Mixed orientation is fine; ≥1200px on the long edge.
 *
 * Export as JPG (quality ~80) or WebP. Keep each under ~400 KB.
 */
export const images: {
  portrait: string | null;
  og: string | null;
  frame: string | null;
  wall: string | null;
  rooms: (string | null)[];
  gallery: string[];
} = {
  portrait: "/images/portrait.jpg", // seated address, orange & indigo gele
  og: null, // generated card uses the portrait; drop a 1200×630 here to override
  frame: "/images/pebec-works.jpg", // at the lectern, "PEBEC Works!" backdrop
  wall: "/images/portrait.jpg", // swap for a dedicated official portrait when you have one
  rooms: ["/images/podium-flag.jpg", null, null, null], // London · UNGA · Rabat · Stockholm
  gallery: ["/images/pebec-works.jpg", "/images/statewide-tour.jpg", "/images/portrait.jpg"],
};

/* ---------------- chapters ---------------- */

export type ChapterId = "prologue" | "mandate" | "record" | "rooms" | "mobilisation" | "words" | "contact";

export const chapters: { id: ChapterId; n: string; name: string; object: string; line: string }[] = [
  { id: "prologue", n: "I", name: "Prologue", object: "The dossier", line: "Who she is, in her own words." },
  { id: "mandate", n: "II", name: "The Mandate", object: "The ReportGov kiosk", line: "What PEBEC is for, and how it is measured." },
  { id: "record", n: "III", name: "The Record", object: "The map on the wall", line: "Thirty-six states, one standard." },
  { id: "rooms", n: "IV", name: "The Rooms", object: "The passport", line: "Where the work has taken her." },
  { id: "mobilisation", n: "V", name: "Mobilisation", object: "The photograph", line: "A decade organising women across the North Central." },
  { id: "words", n: "VI", name: "In Her Words", object: "The newspapers", line: "Speeches, interviews and what the press has said." },
  { id: "contact", n: "VII", name: "Write to the DG", object: "The telephone", line: "Notes are read. Complaints go to ReportGov." },
];

/* ---------------- I · prologue ---------------- */

export const prologue = {
  paragraphs: [
    "I am a princess of Nasarawa, a daughter of the North Central, and since January 2025 the Director General of the Presidential Enabling Business Environment Council. Before public office I built businesses, worked in technology, and spent a decade organising women across six states who had been told politics was not for them.",
    "The work has always been the same work: find the rule that is stopping someone, and remove it. A woman who cannot register a company. A trader whose container sits at Apapa for three weeks. A ministry that does not answer its own telephone. Reform is not a document. It is what happens when a citizen notices that something that used to be hard is now easy.",
  ],
  traits: ["Strong", "Detailed", "Elegant", "Intelligent"],
};

export const timeline = [
  { year: "Nasarawa", label: "Born into the royal house of Nasarawa" },
  { year: "2010s", label: "Entrepreneur · technology and trade" },
  { year: "2019", label: "Kogi gubernatorial campaign · mobilisation lead" },
  { year: "2022", label: "APC North Central Woman Leader" },
  { year: "2024", label: "Technical Adviser to the President on FDI · 'Invest in Nigeria'" },
  { year: "2025", label: "Director General, PEBEC" },
];

/* ---------------- II · mandate ---------------- */

export const mandate = {
  headline: "Make Nigeria easier to do business in. Prove it.",
  body: "PEBEC sits in the Presidency, chaired by the Vice President, and coordinates reform across every ministry, department and agency a business has to touch. Since January 2025 the Council has moved from writing policy to measuring whether the policy is felt.",
  facts: [
    { value: 69, suffix: "", label: "business-facing MDAs held to service standards under the Business Facilitation Act" },
    { value: 72, suffix: "h", label: "guaranteed response window for complaints escalated through ReportGov" },
    { value: 21, to: 7, suffix: " days", label: "cargo dwell time at Lagos ports: the target set, and corridor checkpoints removed" },
    { value: 36, suffix: "", label: "states on the subnational reform tour, with governors and the private sector" },
  ],
  pillars: [
    { name: "Business Facilitation Act", desc: "Published timelines and default approvals across 69 agencies." },
    { name: "Regulatory Impact Analysis", desc: "No new regulation without evidence and stakeholder consultation." },
    { name: "ReportGov", desc: "Real-time complaints, airport and seaport kiosks, 72-hour resolution." },
    { name: "Ports & Trade", desc: "Joint inspections, scanners, illegal checkpoints dismantled on the Apapa–Tin Can corridor." },
    { name: "Subnational Reform", desc: "State ease-of-doing-business councils and a 36-state engagement tour." },
    { name: "BEEPA", desc: "90-day accelerator ranking MDAs on implementation; four 'Super MDAs' recognised." },
  ],
};

/* ---------------- III · record (36 states + FCT) ---------------- */

export type StateStop = { state: string; capital: string; lat: number; lon: number; note?: string; when?: string };

export const states: StateStop[] = [
  { state: "Abia", capital: "Umuahia", lat: 5.53, lon: 7.49 },
  { state: "Adamawa", capital: "Yola", lat: 9.21, lon: 12.48 },
  { state: "Akwa Ibom", capital: "Uyo", lat: 5.04, lon: 7.92 },
  { state: "Anambra", capital: "Awka", lat: 6.21, lon: 7.07 },
  { state: "Bauchi", capital: "Bauchi", lat: 10.31, lon: 9.84 },
  { state: "Bayelsa", capital: "Yenagoa", lat: 4.93, lon: 6.26, when: "Jun 2026", note: "Town hall with BEBEC; digital investment infrastructure commended." },
  { state: "Benue", capital: "Makurdi", lat: 7.73, lon: 8.52 },
  { state: "Borno", capital: "Maiduguri", lat: 11.85, lon: 13.16 },
  { state: "Cross River", capital: "Calabar", lat: 4.96, lon: 8.33 },
  { state: "Delta", capital: "Asaba", lat: 6.2, lon: 6.73 },
  { state: "Ebonyi", capital: "Abakaliki", lat: 6.32, lon: 8.11 },
  { state: "Edo", capital: "Benin City", lat: 6.34, lon: 5.63 },
  { state: "Ekiti", capital: "Ado-Ekiti", lat: 7.62, lon: 5.22 },
  { state: "Enugu", capital: "Enugu", lat: 6.44, lon: 7.5, when: "2025", note: "ReportGov kiosk reactivated at Akanu Ibiam International Airport." },
  { state: "Gombe", capital: "Gombe", lat: 10.29, lon: 11.17 },
  { state: "Imo", capital: "Owerri", lat: 5.48, lon: 7.03 },
  { state: "Jigawa", capital: "Dutse", lat: 11.76, lon: 9.34 },
  { state: "Kaduna", capital: "Kaduna", lat: 10.52, lon: 7.44 },
  { state: "Kano", capital: "Kano", lat: 12.0, lon: 8.52, when: "2025", note: "ReportGov kiosk reactivated at Mallam Aminu Kano International Airport." },
  { state: "Katsina", capital: "Katsina", lat: 12.99, lon: 7.6 },
  { state: "Kebbi", capital: "Birnin Kebbi", lat: 12.45, lon: 4.2 },
  { state: "Kogi", capital: "Lokoja", lat: 7.8, lon: 6.74, note: "Home of the Audu political house." },
  { state: "Kwara", capital: "Ilorin", lat: 8.5, lon: 4.55 },
  { state: "Lagos", capital: "Ikeja", lat: 6.6, lon: 3.35, when: "2025–26", note: "Apapa–Tin Can corridor: illegal checkpoints dismantled; ReportGov kiosk at MMIA Terminal 2." },
  { state: "Nasarawa", capital: "Lafia", lat: 8.49, lon: 8.52, note: "Home. The royal house of Nasarawa." },
  { state: "Niger", capital: "Minna", lat: 9.61, lon: 6.56 },
  { state: "Ogun", capital: "Abeokuta", lat: 7.15, lon: 3.35 },
  { state: "Ondo", capital: "Akure", lat: 7.25, lon: 5.19 },
  { state: "Osun", capital: "Osogbo", lat: 7.77, lon: 4.56 },
  { state: "Oyo", capital: "Ibadan", lat: 7.38, lon: 3.95, when: "Jun 2026", note: "Nationwide tour technical workshop and town hall, Parliament Building, Ibadan." },
  { state: "Plateau", capital: "Jos", lat: 9.9, lon: 8.86 },
  { state: "Rivers", capital: "Port Harcourt", lat: 4.82, lon: 7.03, when: "2025", note: "ReportGov kiosk reactivated at Port Harcourt International Airport." },
  { state: "Sokoto", capital: "Sokoto", lat: 13.06, lon: 5.24 },
  { state: "Taraba", capital: "Jalingo", lat: 8.89, lon: 11.37 },
  { state: "Yobe", capital: "Damaturu", lat: 11.75, lon: 11.96 },
  { state: "Zamfara", capital: "Gusau", lat: 12.17, lon: 6.66 },
  { state: "FCT", capital: "Abuja", lat: 9.06, lon: 7.49, when: "Since Jan 2025", note: "PEBEC Secretariat. State House press briefings. BEEPA 90-day accelerator." },
];

export const record = {
  headline: "Thirty-six states. One standard.",
  body: "The subnational tour is not a photo opportunity. Each stop is a technical workshop with the state's own ease-of-doing-business council, a town hall with the private sector, and a list of commitments that PEBEC follows up on. The map keeps score.",
  beepa: {
    headline: "BEEPA · the 90-day accelerator",
    rows: [
      { label: "MDAs failing phone responsiveness", from: "55", to: "12" },
      { label: "MDAs failing email responsiveness", from: "54", to: "21" },
      { label: "MDAs integrated with ReportGov", from: "26", to: "35" },
      { label: "'Super MDAs' recognised", from: "—", to: "4" },
    ],
  },
};

/* ---------------- IV · rooms ---------------- */

export const rooms = [
  { title: "UK State Visit", place: "London", date: "2025", line: "Investor roundtables with the UK–Nigeria Enhanced Trade and Investment Partnership." },
  { title: "UN General Assembly", place: "New York", date: "Sep 2025", line: "Nigeria's business-environment reforms presented on the margins of UNGA 80." },
  { title: "Africa Investment Forum", place: "Rabat", date: "2025", line: "Subnational electricity markets pitched as Nigeria's next investment frontier." },
  { title: "Sweden Trade Mission", place: "Stockholm", date: "2026", line: "Nordic investors, Nigerian regulatory reform: the conversation on predictability." },
];

/* ---------------- V · mobilisation ---------------- */

export const mobilisation = {
  headline: "Before the office, the organising.",
  body: "As APC North Central Woman Leader she built a mobilisation structure across six states that analysts said had no match among her peers. Food drives for low-income women. Ward-level networks. A carnival in Abuja that turned into a movement. The philosophy was simple: women cannot succeed when half of them are held back.",
  principles: [
    "Build an environment where every input is valid and heard.",
    "Mentor people to recognise and embrace their own leadership.",
    "Zero tolerance for harassment or abuse of any kind.",
    "Equal opportunity is an economic policy, not a courtesy.",
  ],
  numbers: [
    { value: 6, label: "states organised across the North Central" },
    { value: 10, suffix: "+", label: "years of women's political mobilisation" },
  ],
};

/* ---------------- VI · words ---------------- */

export const quotes = [
  { text: "Reforms are only meaningful when businesses and citizens experience them in their everyday interactions with government.", where: "State House press briefing, Abuja", when: "Jul 2026" },
  { text: "Women should never lead from a position of limitation.", where: "Energy News Network, Women's Voices", when: "Oct 2026" },
  { text: "We no longer have a situation where heads of agencies wake up one morning and come up with a policy without ample stakeholder engagement.", where: "On the Regulatory Impact Analysis framework", when: "2026" },
];

export type PressKind = "Speech" | "Interview" | "Feature" | "Op-ed";
export const press: { kind: PressKind; title: string; outlet: string; date: string; href?: string }[] = [
  { kind: "Speech", title: "Meet the Press: PEBEC's record since January 2025", outlet: "State House, Abuja", date: "Jul 2026" },
  { kind: "Interview", title: "'Investors need more than promising policies'", outlet: "Energy News Network", date: "Oct 2026", href: "https://energy-news-network.com/industry-news/exclusive-investors-need-more-than-promising-policies/" },
  { kind: "Feature", title: "PEBEC targets 7-day cargo clearance, 72-hour complaint resolution", outlet: "The Business Lens Africa", date: "Jul 2026", href: "https://businesslensafrica.com/pebec-targets-7-day-cargo-clearance-72-hour-complaint-resolution/" },
  { kind: "Feature", title: "PEBEC seeks stronger digital governance, accountability across MDAs", outlet: "The Nation", date: "2026", href: "https://thenationonlineng.net/pebec-seeks-stronger-digital-governance-accountability-across-mdas/" },
  { kind: "Feature", title: "Upgraded ReportGov kiosks unveiled at five international airports", outlet: "The Nation", date: "2025", href: "https://thenationonlineng.net/upgraded-reportgov-kiosk-unveiled-at-lagos-abuja-port-harcourt-enugu-kano-airports/" },
  { kind: "Speech", title: "Town hall stakeholders' engagement, Yenagoa", outlet: "PEBEC × BEBEC", date: "Jun 2026" },
  { kind: "Feature", title: "Tinubu appoints APC woman leader Zahrah as DG PEBEC", outlet: "The Guardian Nigeria", date: "Jan 2025", href: "https://guardian.ng/news/tinubu-appoints-apc-woman-leader-zahrah-as-dg-pebec/" },
  { kind: "Op-ed", title: "The Amazon, mobilizer and her political philosophies", outlet: "Kogi Reports", date: "Dec 2022" },
];

/* ---------------- VII · contact ---------------- */

export const contact = {
  headline: "Write to the Director General.",
  body: "Notes left here are read. Complaints about a government service belong on ReportGov, where they are tracked to resolution within 72 hours.",
  reportgov: "https://www.reportgov.ng",
};

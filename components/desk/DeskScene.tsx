"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Html, Line } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { images, states, type ChapterId } from "@/lib/content";

export type Active = ChapterId | null;

/** Mutable per-frame state shared between scene components (never read during render). */
const live = {
  evening: 0, // 0 = day, 1 = evening (eased)
  mapLit: -1, // seconds since the Record chapter opened, or -1
  recordOpenedAt: null as number | null,
};

// scratch vectors for the camera rig
const _p = new THREE.Vector3();
const _l = new THREE.Vector3();
const _f = new THREE.Vector3();
const _r = new THREE.Vector3();
const _u = new THREE.Vector3(0, 1, 0);
const _s = new THREE.Vector3();

function seeded(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

type View = { pos: [number, number, number]; look: [number, number, number] };

const BASE_FOV = 38;

export const VIEWS: Record<ChapterId | "overview" | "intro", View> = {
  intro: { pos: [0, 4.2, 11.5], look: [0, 1.2, 0] },
  overview: { pos: [0, 3.8, 7.8], look: [0, 1.1, -0.4] },
  prologue: { pos: [-1.9, 2.3, 2.7], look: [-1.6, 0.4, 0.5] },
  mandate: { pos: [1.4, 2.0, 2.2], look: [1.6, 1.0, -0.9] },
  record: { pos: [2.4, 2.3, -1.4], look: [2.5, 2.0, -6.9] },
  rooms: { pos: [0.1, 1.8, 1.4], look: [0, 0.4, -0.6] },
  mobilisation: { pos: [-0.9, 1.5, 0.9], look: [-0.9, 0.7, -1.3] },
  words: { pos: [-3.1, 2.1, 3.0], look: [-3.2, 0.3, 0.9] },
  contact: { pos: [3.0, 1.9, 2.6], look: [2.9, 0.4, 0.5] },
};

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

function makeLabelTexture(
  lines: string[],
  opts: { bg: string; fg: string; font?: string; w?: number; h?: number; weight?: string; align?: "center" | "left" },
) {
  const w = opts.w ?? 512, h = opts.h ?? 256;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = opts.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = opts.fg;
  ctx.textAlign = opts.align ?? "center";
  ctx.textBaseline = "middle";
  let size = Math.floor(h / (lines.length + 1.6));
  const family = opts.font ?? "Geist Mono, ui-monospace, monospace";
  const weight = opts.weight ?? "600";
  const setFont = () => (ctx.font = `${weight} ${size}px ${family}`);
  setFont();
  const maxW = w * 0.84;
  while (size > 8 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > maxW) {
    size -= 1;
    setFont();
  }
  const x = opts.align === "left" ? w * 0.08 : w / 2;
  lines.forEach((l, i) => ctx.fillText(l, x, h / 2 + (i - (lines.length - 1) / 2) * size * 1.35));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function useLabel(lines: string[], opts: Parameters<typeof makeLabelTexture>[1]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => makeLabelTexture(lines, opts), []);
}

function usePhotoTexture(tone: string, caption: string) {
  return useMemo(() => {
    const w = 512, h = 384;
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, tone);
    g.addColorStop(1, "#5a3c3a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    for (let i = -h; i < w; i += 14) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    }
    ctx.fillStyle = "rgba(243,239,230,0.75)";
    ctx.font = "500 18px Geist Mono, ui-monospace, monospace";
    ctx.textAlign = "left";
    ctx.fillText(caption.toUpperCase(), 20, h - 22);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [tone, caption]);
}

/* ------------------------------------------------------------------ */
/* camera                                                              */
/* ------------------------------------------------------------------ */

function CameraRig({ view, drift, active }: { view: View; drift: boolean; active: boolean }) {
  const { camera, pointer, size } = useThree();
  const look = useRef(new THREE.Vector3(...VIEWS.intro.look));
  const pos = useRef(new THREE.Vector3(...VIEWS.intro.pos));

  useEffect(() => {
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  }, [camera]);

  useFrame((state, dt) => {
    const k = 1 - Math.pow(0.002, dt);
    const cam = state.camera as THREE.PerspectiveCamera;
    // portrait phones: widen the vertical FOV so the desk keeps roughly the
    // same horizontal field as a landscape screen instead of being cropped.
    const widen = THREE.MathUtils.clamp(1 / cam.aspect, 1, 1.7);
    const fov = 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * widen));
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    _p.set(...view.pos);
    _l.set(...view.look);
    if (widen > 1) {
      // portrait: also dolly back — the whole desk for overview/intro, and a
      // little for focused objects so they fit the narrow strip above the sheet.
      _p.sub(_l).multiplyScalar(1 + (widen - 1) * (active ? 0.45 : 0.7)).add(_l);
    }
    if (active) {
      // keep the focused object clear of the chapter panel:
      // desktop → centre it in the space left of the 540px drawer;
      // mobile → lift it into the strip above the 62svh bottom sheet.
      _f.subVectors(_l, _p).normalize();
      _r.crossVectors(_f, _u).normalize();
      const dist = _p.distanceTo(_l);
      const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * dist;
      if (size.width >= 768) {
        const halfW = halfH * cam.aspect;
        _s.copy(_r).multiplyScalar(Math.min(0.5, 540 / size.width) * halfW);
        _p.add(_s);
        _l.add(_s);
      } else {
        // centre of the strip between the header and the 62svh sheet ≈ NDC y 0.55.
        // Pitch the camera (move only the look target) rather than translating
        // it, so it never drops behind desk objects.
        _s.crossVectors(_r, _f).normalize().multiplyScalar(-0.55 * halfH);
        _l.add(_s);
      }
    }
    if (drift) {
      _p.x += pointer.x * 0.35;
      _p.y += pointer.y * 0.15;
    }
    pos.current.lerp(_p, k * 0.85);
    look.current.lerp(_l, k * 0.85);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}

/* ------------------------------------------------------------------ */
/* interactive item wrapper                                            */
/* ------------------------------------------------------------------ */

type ItemProps = {
  id: ChapterId;
  label: string;
  sub: string;
  active: Active;
  hovered: string | null;
  setHovered: (i: string | null) => void;
  onSelect: (i: Active) => void;
  position: [number, number, number];
  rotation?: [number, number, number];
  children: React.ReactNode;
  labelOffset?: [number, number, number];
  ring?: number;
  lift?: boolean;
};

function Item({ id, label, sub, active, hovered, setHovered, onSelect, position, rotation = [0, 0, 0], children, labelOffset = [0, 0.7, 0], ring = 0.9, lift = true }: ItemProps) {
  const g = useRef<THREE.Group>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const isHover = hovered === id;
  const isActive = active === id;
  useFrame((_, dt) => {
    if (g.current && lift) {
      const ty = isHover && !isActive ? 0.1 : 0;
      g.current.position.y += (position[1] + ty - g.current.position.y) * Math.min(1, dt * 8);
    }
    if (ringMat.current) {
      const target = isHover || isActive ? 0.55 : 0;
      ringMat.current.opacity += (target - ringMat.current.opacity) * Math.min(1, dt * 8);
    }
  });
  const enter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = "pointer";
  };
  const leave = () => {
    setHovered(null);
    document.body.style.cursor = "";
  };
  return (
    <group position={position} rotation={rotation}>
      {ring > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
          <ringGeometry args={[ring * 0.92, ring, 64]} />
          <meshBasicMaterial ref={ringMat} color="#faf5ee" transparent opacity={0} />
        </mesh>
      )}
      <group
        ref={g}
        onPointerOver={enter}
        onPointerOut={leave}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(isActive ? null : id);
        }}
      >
        {children}
        {isHover && active === null && (
          <Html position={labelOffset} center distanceFactor={6} zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-full border border-[#b9636e]/35 bg-[#faf5ee]/92 px-3 py-1.5 text-center shadow-sm backdrop-blur">
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#b9636e]">{label}</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#2a221f]/55">{sub}</div>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* objects                                                             */
/* ------------------------------------------------------------------ */

function Dossier() {
  const tex = useLabel(["FILE · 2025/01", "AUDU, ZAHRAH M.", "FOR THE RECORD"], { bg: "#e6d3c6", fg: "#4a332e", w: 512, h: 320 });
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
        <boxGeometry args={[1.5, 0.06, 1.05]} />
        <meshStandardMaterial color="#c9b98f" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.07, 0]}>
        <boxGeometry args={[1.42, 0.02, 0.98]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.56]} />
        <meshStandardMaterial map={tex} roughness={0.9} />
      </mesh>
      <mesh position={[0.55, 0.09, 0]}>
        <torusGeometry args={[0.07, 0.008, 8, 32]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Kiosk() {
  const screen = useLabel(["REPORTGOV", "", "69 MDAs · 72H", "LIVE"], { bg: "#3f7a5c", fg: "#f3f8f3", w: 384, h: 512 });
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (mat.current) mat.current.emissiveIntensity = 0.35 + live.evening * 0.5 + Math.sin(clock.elapsedTime * 2) * 0.04;
  });
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.1, 32]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.8, 16]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
      </mesh>
      <group position={[0, 1.15, 0]} rotation={[-0.22, 0, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.78, 1.0, 0.06]} />
          <meshStandardMaterial color="#f4ece2" metalness={0.1} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[0.68, 0.9]} />
          <meshStandardMaterial ref={mat} map={screen} emissive="#5f9f7c" emissiveIntensity={0.35} emissiveMap={screen} />
        </mesh>
      </group>
    </group>
  );
}

function Passport() {
  const tex = useLabel(["FEDERAL REPUBLIC", "OF NIGERIA", "", "PASSPORT"], { bg: "#2f6b4c", fg: "#e6c77a", w: 320, h: 448 });
  return (
    <group rotation={[0, 0.35, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.035, 0]}>
        <boxGeometry args={[0.5, 0.07, 0.7]} />
        <meshStandardMaterial color="#2f6b4c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.072, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.42, 0.6]} />
        <meshStandardMaterial map={tex} roughness={0.6} metalness={0.2} />
      </mesh>
    </group>
  );
}

function Telephone() {
  return (
    <group rotation={[0, -0.5, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.8, 0.2, 0.55]} />
        <meshStandardMaterial color="#f3eadf" roughness={0.35} metalness={0.05} />
      </mesh>
      <mesh castShadow position={[0, 0.3, -0.05]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.07, 0.62, 6, 12]} />
        <meshStandardMaterial color="#ebdfd2" roughness={0.3} metalness={0.05} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-0.18 + (i % 3) * 0.12, 0.205, Math.floor(i / 3) * 0.07 - 0.02]}>
          <cylinderGeometry args={[0.03, 0.03, 0.01, 12]} />
          <meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function PhotoFrame() {
  const placeholder = usePhotoTexture("#a87c72", "Photograph · North Central women's rally");
  const [photo, setPhoto] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!images.frame) return;
    let alive = true;
    new THREE.TextureLoader().load(images.frame, (t) => {
      if (!alive) return;
      t.colorSpace = THREE.SRGBColorSpace;
      // cover-crop to the 4:3 frame instead of stretching
      const img = t.image as { width: number; height: number };
      const ratio = img.width / img.height / (0.88 / 0.66);
      if (ratio > 1) {
        t.repeat.set(1 / ratio, 1);
        t.offset.set((1 - 1 / ratio) / 2, 0);
      } else {
        t.repeat.set(1, ratio);
        t.offset.set(0, (1 - ratio) / 2);
      }
      setPhoto(t);
    });
    return () => {
      alive = false;
    };
  }, []);
  const tex = photo ?? placeholder;
  return (
    <group rotation={[0, 0.5, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]} rotation={[-0.18, 0, 0]}>
        <boxGeometry args={[1.0, 0.8, 0.05]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.42, 0.028]} rotation={[-0.18, 0, 0]}>
        <planeGeometry args={[0.88, 0.66]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
      {/* stand */}
      <mesh position={[0, 0.3, -0.22]} rotation={[0.6, 0, 0]}>
        <boxGeometry args={[0.3, 0.6, 0.02]} />
        <meshStandardMaterial color="#8d6d2a" metalness={0.8} roughness={0.4} />
      </mesh>
    </group>
  );
}

function Newspapers() {
  const top = useLabel(["THE RECORD", "PEBEC targets 7-day cargo clearance,", "72-hour complaint resolution", "", "State House · Abuja"], {
    bg: "#e6dfcf",
    fg: "#1a1612",
    w: 640,
    h: 512,
    font: "Fraunces, Georgia, serif",
    weight: "500",
  });
  return (
    <group rotation={[0, -0.18, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} castShadow receiveShadow position={[i * 0.03, 0.03 + i * 0.05, -i * 0.02]} rotation={[0, i * 0.08, 0]}>
          <boxGeometry args={[1.1, 0.05, 1.4]} />
          <meshStandardMaterial color={i === 2 ? "#ece5d4" : "#d8d0bd"} roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0.06, 0.161, -0.04]} rotation={[-Math.PI / 2, 0, 0.16]}>
        <planeGeometry args={[0.98, 1.26]} />
        <meshStandardMaterial map={top} roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Framed map of Nigeria on the wall, built from the real outline. State capitals light up in sequence. */
function WallMap() {
  const [outline, setOutline] = useState<THREE.Vector3[] | null>(null);
  const [shape, setShape] = useState<THREE.Shape | null>(null);
  const dots = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const W = 3.0;
  const proj = useMemo(() => {
    const minLon = 2.67, maxLon = 14.68, minLat = 4.27, maxLat = 13.89;
    const s = W / (maxLon - minLon);
    const cx = (minLon + maxLon) / 2, cy = (minLat + maxLat) / 2;
    return (lon: number, lat: number) => [(lon - cx) * s, (lat - cy) * s] as [number, number];
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/data/nigeria.geo.json")
      .then((r) => r.json())
      .then((geo) => {
        if (!alive) return;
        const poly: number[][] = geo.features[0].geometry.coordinates[0];
        const pts = poly.map(([lon, lat]) => proj(lon, lat));
        const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
        setShape(sh);
        setOutline(pts.map(([x, y]) => new THREE.Vector3(x, y, 0.012)));
      });
    return () => {
      alive = false;
    };
  }, [proj]);

  useFrame(({ clock }) => {
    const t = live.recordOpenedAt === null ? -1 : (performance.now() - live.recordOpenedAt) / 1000;
    dots.current.forEach((m, i) => {
      if (!m) return;
      const on = t >= 0 && t > i * 0.07;
      const target = on ? 0.9 + Math.sin(clock.elapsedTime * 3 + i) * 0.2 : 0.15;
      m.emissiveIntensity += (target - m.emissiveIntensity) * 0.12;
    });
  });

  return (
    <group position={[2.5, 2.0, -6.85]}>
      {/* frame */}
      <mesh castShadow receiveShadow position={[0, 0, -0.05]}>
        <boxGeometry args={[W + 0.6, W * 0.8 + 0.6, 0.08]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <planeGeometry args={[W + 0.4, W * 0.8 + 0.4]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.95} />
      </mesh>
      {shape && (
        <mesh position={[0, 0, 0.006]}>
          <shapeGeometry args={[shape]} />
          <meshStandardMaterial color="#6f9f84" roughness={0.8} />
        </mesh>
      )}
      {outline && <Line points={outline} color="#a9822f" lineWidth={1.2} />}
      {states.map((s, i) => {
        const [x, y] = proj(s.lon, s.lat);
        return (
          <mesh key={s.state} position={[x, y, 0.03]}>
            <sphereGeometry args={[s.state === "FCT" ? 0.035 : 0.024, 12, 12]} />
            <meshStandardMaterial
              ref={(m) => {
                dots.current[i] = m;
              }}
              color="#e3c475"
              emissive="#e3c475"
              emissiveIntensity={0.15}
            />
          </mesh>
        );
      })}
      {/* brass plaque */}
      <mesh position={[0, -(W * 0.8) / 2 - 0.42, 0.02]}>
        <boxGeometry args={[1.3, 0.14, 0.02]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1.4, 1.6]} intensity={3} distance={5} color="#ffe9c4" />
    </group>
  );
}

/** Framed portrait hanging on the wall between the flag stripes and the map. */
function WallPortrait() {
  const W = 1.5, H = 1.875;
  const placeholder = usePhotoTexture("#8a6a5c", "Portrait · the Director General");
  const [photo, setPhoto] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!images.wall) return;
    let alive = true;
    new THREE.TextureLoader().load(images.wall, (t) => {
      if (!alive) return;
      t.colorSpace = THREE.SRGBColorSpace;
      const img = t.image as { width: number; height: number };
      const ratio = img.width / img.height / (W / H);
      if (ratio > 1) {
        t.repeat.set(1 / ratio, 1);
        t.offset.set((1 - 1 / ratio) / 2, 0);
      } else {
        // keep the top of the image (her face) when cropping a tall photo
        t.repeat.set(1, ratio);
        t.offset.set(0, 1 - ratio);
      }
      setPhoto(t);
    });
    return () => {
      alive = false;
    };
  }, []);
  const tex = photo ?? placeholder;
  return (
    <group position={[-1.6, 2.4, -6.88]}>
      <mesh castShadow receiveShadow position={[0, 0, -0.04]}>
        <boxGeometry args={[W + 0.36, H + 0.36, 0.08]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* cream mount */}
      <mesh position={[0, 0, 0.001]}>
        <planeGeometry args={[W + 0.2, H + 0.2]} />
        <meshStandardMaterial color="#efe6d2" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={tex} roughness={0.6} />
      </mesh>
      {/* brass plaque */}
      <mesh position={[0, -H / 2 - 0.3, 0.02]}>
        <boxGeometry args={[0.7, 0.1, 0.02]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1.2, 1.4]} intensity={2} distance={4} color="#ffe9c4" />
    </group>
  );
}

function Lamp({ onToggle, hovered, setHovered }: { onToggle: () => void; hovered: string | null; setHovered: (i: string | null) => void }) {
  const light = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    // the lamp is always on; evening just turns it up
    if (light.current) light.current.intensity = 24 + live.evening * 12;
    if (bulb.current) bulb.current.emissiveIntensity = 2.2 + live.evening * 1.4;
  });
  const isHover = hovered === "lamp";
  return (
    <group
      position={[-3.0, 0, -1.3]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered("lamp");
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.32, 0.36, 0.06, 32]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh castShadow position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 12]} />
        <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <coneGeometry args={[0.45, 0.45, 32, 1, true]} />
        <meshStandardMaterial color="#e8d3c3" side={THREE.DoubleSide} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial ref={bulb} color="#fff3d6" emissive="#ffd9a0" emissiveIntensity={0.6} />
      </mesh>
      {/* no castShadow here: a point-light cube shadow map tanks the frame rate (0.3 fps measured) */}
      <pointLight ref={light} position={[0, 1.35, 0]} intensity={5} distance={7} color="#ffd9a0" />
      {isHover && (
        <Html position={[0, 2.1, 0]} center distanceFactor={6} zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#b9636e]/35 bg-[#faf5ee]/92 px-3 py-1.5 text-center shadow-sm backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#b9636e]">The lamp</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#2a221f]/55">evening session · toggle</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Nameplate({ onSpeak, hovered, setHovered }: { onSpeak: () => void; hovered: string | null; setHovered: (i: string | null) => void }) {
  const tex = useLabel(["PRINCESS ZAHRAH MUSTAPHA AUDU", "DIRECTOR GENERAL · PEBEC"], { bg: "#cfae5e", fg: "#3a2a14", w: 1024, h: 160 });
  const isHover = hovered === "nameplate";
  return (
    <group
      position={[0.4, 0, 1.55]}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered("nameplate");
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSpeak();
      }}
    >
      <mesh castShadow receiveShadow position={[0, 0.16, 0]} rotation={[-0.35, 0, 0]}>
        <boxGeometry args={[2.1, 0.32, 0.05]} />
        <meshStandardMaterial color="#b8923f" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.17, 0.027]} rotation={[-0.35, 0, 0]}>
        <planeGeometry args={[2.0, 0.26]} />
        <meshStandardMaterial map={tex} metalness={0.6} roughness={0.35} />
      </mesh>
      {isHover && (
        <Html position={[0, 0.6, 0]} center distanceFactor={6} zIndexRange={[50, 0]} style={{ pointerEvents: "none" }}>
          <div className="whitespace-nowrap rounded-full border border-[#b9636e]/35 bg-[#faf5ee]/92 px-3 py-1.5 text-center shadow-sm backdrop-blur">
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#b9636e]">ZAH-rah · moos-TAH-fah · AH-doo</div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#2a221f]/55">click to hear</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function Extras() {
  return (
    <group>
      <mesh castShadow position={[0.6, 0.03, 0.75]} rotation={[0, 0.9, Math.PI / 2]}>
        <cylinderGeometry args={[0.018, 0.018, 0.7, 12]} />
        <meshStandardMaterial color="#d79a8c" metalness={0.85} roughness={0.25} />
      </mesh>
      <group position={[3.5, 0, -1.3]}>
        <mesh castShadow receiveShadow position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.28, 0.28, 0.02, 32]} />
          <meshStandardMaterial color="#efe6d2" roughness={0.5} />
        </mesh>
        <mesh castShadow position={[0, 0.16, 0]}>
          <cylinderGeometry args={[0.17, 0.12, 0.28, 32]} />
          <meshStandardMaterial color="#efe6d2" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.29, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.01, 32]} />
          <meshStandardMaterial color="#5a3a1a" roughness={0.3} />
        </mesh>
      </group>
      {/* a small vase of flowers · the personal note on a working desk */}
      <group position={[2.6, 0, -1.55]}>
        <mesh castShadow receiveShadow position={[0, 0.22, 0]}>
          <cylinderGeometry args={[0.09, 0.13, 0.44, 24]} />
          <meshStandardMaterial color="#f4ece2" roughness={0.3} />
        </mesh>
        {([
          [0.0, 0.66, 0.0, 0.085, "#e08a93"],
          [0.12, 0.6, 0.06, 0.07, "#f2b7bd"],
          [-0.11, 0.62, 0.05, 0.075, "#d9707d"],
          [0.03, 0.58, -0.12, 0.065, "#f6cdd1"],
          [-0.05, 0.7, 0.1, 0.055, "#fff0ea"],
        ] as const).map(([x, y, z, r, c], i) => (
          <group key={i}>
            <mesh position={[x * 0.5, 0.46, z * 0.5]} rotation={[z * 1.2, 0, -x * 1.2]}>
              <cylinderGeometry args={[0.006, 0.006, 0.3, 6]} />
              <meshStandardMaterial color="#6f9f84" roughness={0.8} />
            </mesh>
            <mesh castShadow position={[x, y, z]}>
              <sphereGeometry args={[r, 16, 16]} />
              <meshStandardMaterial color={c} roughness={0.75} />
            </mesh>
          </group>
        ))}
      </group>
      {/* small flag on a stand */}
      <group position={[3.9, 0, 0.9]}>
        <mesh castShadow position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.12, 0.14, 0.04, 24]} />
          <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.0, 8]} />
          <meshStandardMaterial color="#b8923f" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.17, 0.78, 0]}>
          <planeGeometry args={[0.34, 0.24]} />
          <meshStandardMaterial color="#3f8a60" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
        <mesh position={[0.17, 0.78, 0.001]}>
          <planeGeometry args={[0.113, 0.24]} />
          <meshStandardMaterial color="#efe6d2" side={THREE.DoubleSide} roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const n = 220;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      a[i * 3] = -3.0 + (seeded(i) - 0.5) * 2.4;
      a[i * 3 + 1] = seeded(i + 1000) * 1.6;
      a[i * 3 + 2] = -1.3 + (seeded(i + 2000) - 0.5) * 2.4;
    }
    return a;
  }, []);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const arr = ref.current.geometry.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < arr.length / 3; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.3 + i) * 0.0006 + 0.0004;
      if (arr[i * 3 + 1] > 1.7) arr[i * 3 + 1] = 0.05;
      arr[i * 3] += Math.cos(t * 0.2 + i * 0.3) * 0.0004;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.014} color="#c9a24a" transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function Desk() {
  return (
    <group>
      {/* pale oak desk with a dusty-rose leather inlay */}
      <mesh receiveShadow castShadow position={[0, -0.12, 0]}>
        <boxGeometry args={[9, 0.24, 4.2]} />
        <meshStandardMaterial color="#cfae82" roughness={0.5} metalness={0.02} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[8.6, 3.8]} />
        <meshStandardMaterial color="#b58d84" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.02, 2.1]}>
        <boxGeometry args={[9.02, 0.03, 0.03]} />
        <meshStandardMaterial color="#c9a24a" metalness={1} roughness={0.25} />
      </mesh>
      {[[-4.2, -1.8], [4.2, -1.8], [-4.2, 1.8], [4.2, 1.8]].map(([x, z]) => (
        <mesh key={`${x}${z}`} position={[x, -1.6, z]} castShadow>
          <boxGeometry args={[0.3, 2.8, 0.3]} />
          <meshStandardMaterial color="#bf9c70" roughness={0.5} />
        </mesh>
      ))}
      {/* drawer fronts */}
      {[-2.2, 2.2].map((x) => (
        <group key={x}>
          <mesh position={[x, -0.9, 2.0]}>
            <boxGeometry args={[2.6, 1.3, 0.1]} />
            <meshStandardMaterial color="#c6a378" roughness={0.5} />
          </mesh>
          <mesh position={[x, -0.9, 2.07]}>
            <boxGeometry args={[0.5, 0.04, 0.04]} />
            <meshStandardMaterial color="#c9a24a" metalness={1} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Room() {
  return (
    <group>
      {/* pale oak floor */}
      <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#d9c3a6" roughness={0.9} />
      </mesh>
      {/* warm plaster wall */}
      <mesh position={[0, 4, -7]}>
        <planeGeometry args={[60, 20]} />
        <meshStandardMaterial color="#e2cdb8" roughness={1} />
      </mesh>
      {/* blush wainscot below the brass rail */}
      <mesh position={[0, -1.1, -6.98]}>
        <planeGeometry args={[60, 4]} />
        <meshStandardMaterial color="#dccbbd" roughness={1} />
      </mesh>
      <mesh position={[0, 0.9, -6.95]}>
        <boxGeometry args={[60, 0.06, 0.04]} />
        <meshStandardMaterial color="#c9a24a" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* national colours, softened: sage · cream · sage */}
      {[-6.0, -5.0, -4.0].map((x, i) => (
        <mesh key={x} position={[x, 3.2, -6.9]}>
          <planeGeometry args={[0.9, 7]} />
          <meshStandardMaterial color={i === 1 ? "#f1e5d4" : "#6f9a80"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// day: late-afternoon warmth, lamp already on. evening: deeper golden hour.
const DAY = new THREE.Color("#dcc1a6");
const EVE = new THREE.Color("#c39a78");
const _amber = new THREE.Color("#ffc98a");

function Mood({ target }: { target: boolean }) {
  const amb = useRef<THREE.AmbientLight>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const dir = useRef<THREE.DirectionalLight>(null);
  const bg = useRef<THREE.Color>(null);
  const fog = useRef<THREE.Fog>(null);
  useFrame(({ scene }, dt) => {
    live.evening += ((target ? 1 : 0) - live.evening) * Math.min(1, dt * 2.5);
    const e = live.evening;
    if (amb.current) amb.current.intensity = 0.22 - e * 0.1;
    if (spot.current) {
      spot.current.intensity = 28 - e * 14;
      spot.current.color.setHex(0xfff4e4).lerp(_amber, 0.55 + e * 0.45);
    }
    if (dir.current) dir.current.intensity = 0.45 - e * 0.22;
    // the HDR fill is what keeps the room "daylit"; keep it low so the lamp carries the mood
    scene.environmentIntensity = 0.2 - e * 0.1;
    if (bg.current) bg.current.copy(DAY).lerp(EVE, e);
    if (fog.current) fog.current.color.copy(DAY).lerp(EVE, e);
  });
  return (
    <>
      <color ref={bg} attach="background" args={["#dcc1a6"]} />
      <fog ref={fog} attach="fog" args={["#dcc1a6", 16, 40]} />
      <ambientLight ref={amb} intensity={0.22} color="#ffe9d6" />
      <spotLight ref={spot} position={[4, 7, 5]} angle={0.5} penumbra={0.8} intensity={28} color="#ffdfbf" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
      {/* soft warm fill from the window side */}
      <directionalLight ref={dir} position={[-6, 4, -3]} intensity={0.45} color="#f3d2c2" />
    </>
  );
}

/** Where a chapter's object sits, so the focus light can find it. */
const FOCUS: Record<ChapterId, [number, number, number]> = {
  prologue: [-1.6, 0.9, 1.0],
  mandate: [1.6, 1.6, -0.2],
  record: [2.5, 2.6, -5.6],
  rooms: [0, 0.9, 0],
  mobilisation: [-0.9, 1.2, -0.6],
  words: [-3.2, 0.9, 1.4],
  contact: [2.9, 0.9, 1.0],
};

/** A soft warm light that drifts to whichever object is open, so it stays readable even in the evening. */
function FocusLight({ active }: { active: Active }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((_, dt) => {
    const l = light.current;
    if (!l) return;
    const k = 1 - Math.pow(0.01, dt);
    const target = active ? 2.0 + live.evening * 2.0 : 0;
    l.intensity += (target - l.intensity) * k;
    if (active) {
      _s.set(...FOCUS[active]);
      l.position.lerp(_s, k);
    }
  });
  return <pointLight ref={light} intensity={0} distance={4} decay={2} color="#ffe6bf" />;
}

/* ------------------------------------------------------------------ */
/* scene                                                               */
/* ------------------------------------------------------------------ */

export default function DeskScene({
  active,
  onSelect,
  started,
  evening,
  onToggleEvening,
  onSpeak,
}: {
  active: Active;
  onSelect: (i: Active) => void;
  started: boolean;
  evening: boolean;
  onToggleEvening: () => void;
  onSpeak: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    live.recordOpenedAt = active === "record" ? performance.now() : null;
  }, [active]);

  const view = !started ? VIEWS.intro : active ? VIEWS[active] : VIEWS.overview;
  const common = { active, hovered, setHovered, onSelect };

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: BASE_FOV, near: 0.1, far: 100, position: VIEWS.intro.pos }}
      gl={{ antialias: true }}
      onPointerMissed={() => onSelect(null)}
      className="!absolute inset-0"
    >
      <CameraRig view={view} drift={started && active === null} active={active !== null} />
      <Mood target={evening} />
      <FocusLight active={active} />
      <Suspense fallback={null}>
        <Environment preset="apartment" environmentIntensity={0.2} />
      </Suspense>

      <Room />
      <WallPortrait />
      <Desk />
      <Lamp onToggle={onToggleEvening} hovered={hovered} setHovered={setHovered} />
      <Dust />
      <Nameplate onSpeak={onSpeak} hovered={hovered} setHovered={setHovered} />
      <Extras />

      <Item id="prologue" label="I · Prologue" sub="the dossier · open" position={[-1.6, 0, 0.5]} rotation={[0, 0.18, 0]} labelOffset={[0, 0.6, 0]} ring={1.0} {...common}>
        <Dossier />
      </Item>
      <Item id="mandate" label="II · The Mandate" sub="ReportGov kiosk · open" position={[1.6, 0, -0.9]} labelOffset={[0, 2.0, 0]} ring={0.5} {...common}>
        <Kiosk />
      </Item>
      <Item id="record" label="III · The Record" sub="the map · open" position={[0, 0, 0]} ring={0} lift={false} labelOffset={[2.5, 3.8, -6.8]} {...common}>
        <WallMap />
      </Item>
      <Item id="rooms" label="IV · The Rooms" sub="passport · open" position={[0.0, 0, -0.6]} labelOffset={[0, 0.55, 0]} ring={0.55} {...common}>
        <Float speed={1.2} rotationIntensity={0} floatIntensity={0.15}>
          <Passport />
        </Float>
      </Item>
      <Item id="mobilisation" label="V · Mobilisation" sub="the photograph · open" position={[-0.9, 0, -1.3]} labelOffset={[0, 1.1, 0]} ring={0.6} {...common}>
        <PhotoFrame />
      </Item>
      <Item id="words" label="VI · In Her Words" sub="the newspapers · open" position={[-3.2, 0, 0.9]} labelOffset={[0, 0.7, 0]} ring={0.95} {...common}>
        <Newspapers />
      </Item>
      <Item id="contact" label="VII · Write to the DG" sub="telephone · open" position={[2.9, 0, 0.5]} labelOffset={[0, 0.8, 0]} ring={0.65} {...common}>
        <Telephone />
      </Item>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={12} blur={2.4} far={2} color="#4a2e2a" />
    </Canvas>
  );
}

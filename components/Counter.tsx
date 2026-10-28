"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Counter({
  value,
  to,
  suffix = "",
  className = "",
}: {
  value: number;
  to?: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const toRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const toEl = toRef.current;
    if (!el) return;
    const obj = { n: 0 };
    // paused until the figure scrolls into view — IntersectionObserver works
    // inside the panel's own scroll container, where window ScrollTrigger doesn't.
    const tl = gsap.timeline({ paused: true });
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          tl.play();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    tl.to(obj, {
      n: value,
      duration: 1.6,
      ease: "power3.out",
      onUpdate: () => {
        if (el.isConnected) el.textContent = Math.round(obj.n).toString();
      },
    });
    if (to !== undefined && toEl) {
      const o2 = { n: value };
      tl.to(
        o2,
        {
          n: to,
          duration: 1.4,
          ease: "power2.inOut",
          onUpdate: () => {
            if (toEl.isConnected) toEl.textContent = Math.round(o2.n).toString();
          },
        },
        "-=0.4",
      );
    }
    return () => {
      io.disconnect();
      tl.kill();
    };
  }, [value, to]);

  return (
    <span className={className}>
      <span ref={ref}>0</span>
      {to !== undefined && (
        <>
          <span className="mx-[0.15em] opacity-50">→</span>
          <span ref={toRef}>{value}</span>
        </>
      )}
      <span className="text-[0.5em] align-baseline opacity-70">{suffix}</span>
    </span>
  );
}

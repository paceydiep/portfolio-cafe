"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Pendant {
  x: string;
  cordHeight: number;
  size: number;
  delay: number;
  glowSize: number;
}

const pendants: Pendant[] = [
  { x: "18%", cordHeight: 120, size: 22, delay: 0, glowSize: 160 },
  { x: "33%", cordHeight: 180, size: 28, delay: 0.3, glowSize: 220 },
  { x: "50%", cordHeight: 100, size: 18, delay: 0.6, glowSize: 140 },
  { x: "67%", cordHeight: 160, size: 26, delay: 0.15, glowSize: 200 },
  { x: "82%", cordHeight: 130, size: 20, delay: 0.45, glowSize: 160 },
];

export default function PendantLights() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const shades = containerRef.current.querySelectorAll(".pendant-shade");
    const glows = containerRef.current.querySelectorAll(".pendant-glow");

    shades.forEach((shade, i) => {
      const delay = pendants[i].delay;
      // Gentle sway
      gsap.to(shade, {
        rotateZ: gsap.utils.random(-3, 3),
        duration: gsap.utils.random(4, 6),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay,
      });
      // Subtle pulse glow
      gsap.to(glows[i], {
        opacity: gsap.utils.random(0.6, 1),
        scale: gsap.utils.random(0.95, 1.05),
        duration: gsap.utils.random(2, 4),
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay,
      });
    });
  }, []);

  return (
    <div ref={containerRef} className="pendant-container" style={{ height: "100%" }}>
      {pendants.map((p, i) => (
        <div
          key={i}
          className="pendant"
          style={{ left: p.x, transform: "translateX(-50%)" }}
        >
          <div
            className="pendant-cord"
            style={{ height: p.cordHeight }}
          />
          <div
            className="pendant-shade"
            style={{ width: p.size, height: p.size }}
          />
          {/* Glow pool on wall/floor below */}
          <div
            className="pendant-glow"
            style={{
              width: p.glowSize,
              height: p.glowSize,
              top: p.cordHeight + p.size / 2,
              left: "50%",
              marginLeft: -p.glowSize / 2,
            }}
          />
        </div>
      ))}

      {/* Floor light pools */}
      {pendants.map((p, i) => (
        <div
          key={`pool-${i}`}
          className="light-pool"
          style={{
            width: p.glowSize * 1.5,
            height: p.glowSize * 0.5,
            bottom: "20%",
            left: p.x,
            transform: "translateX(-50%)",
          }}
        />
      ))}
    </div>
  );
}

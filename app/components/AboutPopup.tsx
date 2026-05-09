"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface AboutPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AboutPopup({ isOpen, onClose }: AboutPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const overlay = overlayRef.current;
    const popup = popupRef.current;
    const content = contentRef.current;
    if (!overlay || !popup || !content) return;

    if (isOpen) {
      overlay.classList.add("active");
      popup.classList.add("visible");
      gsap.to(overlay, { backgroundColor: "rgba(26, 15, 8, 0.58)", duration: 0.4, ease: "power2.out" });
      gsap.to(popup, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.3)" });

      const els = content.querySelectorAll(".about-anim");
      gsap.fromTo(els,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, stagger: 0.08, duration: 0.45, ease: "power3.out", delay: 0.25 }
      );
    } else {
      overlay.classList.remove("active");
      popup.classList.remove("visible");
      gsap.to(overlay, { backgroundColor: "rgba(26, 15, 8, 0)", duration: 0.35, ease: "power2.in" });
      gsap.to(popup, { opacity: 0, scale: 0.94, duration: 0.32, ease: "power3.in" });
    }
  }, [isOpen]);

  return (
    <div
      ref={overlayRef}
      className="popup-overlay"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div ref={popupRef} className="about-popup">
        <div ref={contentRef} className="about-inner">
          <div className="about-anim about-photo" />

          <div className="about-anim about-label">About</div>
          <div className="about-anim about-name">
            Pacey Diep<br />Designer & Creative
          </div>
          <p className="about-anim about-body">
            I design experiences that live at the intersection of craft and culture —
            brands, products, and spaces that feel considered and alive. My work spans
            visual identity, digital product, and editorial, with a common thread of
            restraint and warmth.
          </p>
          <p className="about-anim about-body">
            Previously at Studio X and Agency Y. Currently based in Orange County, open
            to select projects and work.
          </p>

          <div className="about-anim" style={{ display: "flex", gap: "32px", marginTop: "8px", marginBottom: "24px" }}>
            {["Instagram", "LinkedIn", "Read.cv"].map((link) => (
              <span key={link} style={{ fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--wood)", cursor: "pointer" }}>
                {link}
              </span>
            ))}
          </div>

          <button className="about-anim about-close" onClick={onClose}>← Close</button>
        </div>
      </div>
    </div>
  );
}

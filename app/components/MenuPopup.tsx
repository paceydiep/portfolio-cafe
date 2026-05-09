"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { projects } from "../data/projects";

interface MenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectClick: (slug: string) => void;
}

export default function MenuPopup({ isOpen, onClose, onProjectClick }: MenuPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const popup = popupRef.current;
    if (!overlay || !popup) return;

    if (isOpen) {
      // Make overlay interactive
      overlay.classList.add("active");

      // Slide menu up from bottom (like pulling a menu from the bar)
      gsap.to(popup, {
        y: 0,
        duration: 0.7,
        ease: "expo.out",
      });
      // Fade overlay dim
      gsap.to(overlay, {
        backgroundColor: "rgba(26, 15, 8, 0.55)",
        duration: 0.5,
        ease: "power2.out",
      });
      // Stagger in list items
      gsap.fromTo(
        itemsRef.current,
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.07,
          ease: "power3.out",
          delay: 0.35,
        }
      );
    } else {
      overlay.classList.remove("active");
      gsap.to(popup, {
        y: "100%",
        duration: 0.55,
        ease: "expo.in",
      });
      gsap.to(overlay, {
        backgroundColor: "rgba(26, 15, 8, 0)",
        duration: 0.45,
        ease: "power2.in",
      });
      gsap.set(itemsRef.current, { opacity: 0, y: 18 });
    }
  }, [isOpen]);

  return (
    <div ref={overlayRef} className="popup-overlay" onClick={(e) => {
      if (e.target === overlayRef.current) onClose();
    }}>
      <div ref={popupRef} className="menu-popup">
        <div className="menu-popup-inner">
          <div className="menu-header">
            <div>
              <div className="menu-title">Portfolio</div>
              <div className="menu-subtitle">Selected Works</div>
            </div>
            <button className="menu-close" onClick={onClose}>
              Close ×
            </button>
          </div>

          <div className="menu-section-label">Projects</div>

          {projects.map((project, i) => (
            <div
              key={project.slug}
              ref={(el) => {
                if (el) itemsRef.current[i] = el;
              }}
              className="project-item"
              onClick={() => onProjectClick(project.slug)}
            >
              <div>
                <div className="project-name">{project.name}</div>
                <div className="project-tag">{project.tag}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span className="project-year">{project.year}</span>
                <span className="project-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { projects } from "../data/projects";

interface CaseStudyProps {
  slug: string | null;
  onClose: () => void;
}

export default function CaseStudy({ slug, onClose }: CaseStudyProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const project = projects.find((p) => p.slug === slug);

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    if (slug) {
      gsap.to(page, {
        y: 0,
        duration: 0.7,
        ease: "expo.out",
      });
      // Animate content
      const els = page.querySelectorAll(".cs-anim");
      gsap.fromTo(
        els,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.5,
          ease: "power3.out",
          delay: 0.3,
        }
      );
    } else {
      gsap.to(page, {
        y: "100%",
        duration: 0.6,
        ease: "expo.in",
      });
    }
  }, [slug]);

  if (!project && !slug) return null;

  return (
    <div ref={pageRef} className="case-study-page">
      <div
        className="cs-hero"
        style={{
          background: `linear-gradient(135deg, hsl(${
            projects.findIndex((p) => p.slug === slug) * 40 + 30
          }, 25%, 72%) 0%, hsl(${
            projects.findIndex((p) => p.slug === slug) * 40 + 10
          }, 18%, 82%) 100%)`,
        }}
      >
        <button className="cs-back cs-anim" onClick={onClose}>
          ← Back to bar
        </button>
        <div>
          <div className="cs-anim cs-meta">
            {project?.tag} — {project?.year}
          </div>
          <h1 className="cs-anim cs-title">{project?.name}</h1>
        </div>
      </div>

      <div className="cs-body">
        <div className="cs-section cs-anim">
          <div className="cs-section-label">Overview</div>
          <p className="cs-section-text">{project?.overview}</p>
        </div>

        <div className="cs-image-placeholder cs-anim">Project imagery</div>

        <div className="cs-section cs-anim">
          <div className="cs-section-label">The Challenge</div>
          <p className="cs-section-text">{project?.challenge}</p>
        </div>

        <div className="cs-section cs-anim">
          <div className="cs-section-label">The Solution</div>
          <p className="cs-section-text">{project?.solution}</p>
        </div>

        <div className="cs-image-placeholder cs-anim">Process imagery</div>

        <div
          className="cs-anim"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "16px",
            borderTop: "1px solid var(--sand)",
            marginTop: "16px",
          }}
        >
          <div>
            <div className="cs-section-label" style={{ marginBottom: "6px" }}>
              Role
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--espresso)", fontFamily: "OpenSauceSans, sans-serif", fontWeight: 900 }}>
              {project?.role}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="cs-section-label" style={{ marginBottom: "6px" }}>
              Tools
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--espresso)" }}>
              {project?.tools.join(", ")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface OrderPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderPopup({ isOpen, onClose }: OrderPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const overlay = overlayRef.current;
    const popup = popupRef.current;
    if (!overlay || !popup) return;

    if (isOpen) {
      setSubmitted(false);
      overlay.classList.add("active");
      popup.classList.add("visible");
      gsap.to(overlay, {
        backgroundColor: "rgba(26, 15, 8, 0.6)",
        duration: 0.35,
        ease: "power2.out",
      });
      gsap.to(popup, {
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.4)",
      });
    } else {
      overlay.classList.remove("active");
      popup.classList.remove("visible");
      gsap.to(overlay, {
        backgroundColor: "rgba(26, 15, 8, 0)",
        duration: 0.3,
        ease: "power2.in",
      });
      gsap.to(popup, {
        opacity: 0,
        scale: 0.94,
        duration: 0.35,
        ease: "power3.in",
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const popup = popupRef.current;
    if (!popup) return;

    gsap.to(popup.querySelectorAll(".form-group, .form-footer"), {
      opacity: 0,
      y: -8,
      stagger: 0.04,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => setSubmitted(true),
    });
  };

  return (
    <div
      ref={overlayRef}
      className="popup-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div ref={popupRef} className="order-popup">
        <div className="order-inner">
          <div className="order-header">
            <div className="order-label">Contact</div>
            <div className="order-title">Place an Order</div>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "24px 0 16px" }}>
              <div
                style={{
                  fontFamily: "Nirakolu, serif",
                  fontSize: "1.4rem",
                  letterSpacing: "2px",
                  color: "var(--espresso)",
                  marginBottom: "12px",
                }}
              >
                Order received.
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--concrete)",
                  lineHeight: 1.7,
                  marginBottom: "28px",
                }}
              >
                I&apos;ll be in touch shortly. Enjoy your coffee.
              </p>
              <button className="order-close" onClick={onClose}>
                ← Back to the bar
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" type="text" placeholder="Your name" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="your@email.com" required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-input" type="text" placeholder="What are you working on?" />
              </div>
              <div className="form-group">
                <label className="form-label">Message</label>
                <textarea
                  className="form-textarea"
                  placeholder="Tell me about the project..."
                  required
                />
              </div>
              <div className="form-footer">
                <button type="button" className="order-close" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="order-submit">
                  Send Order
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

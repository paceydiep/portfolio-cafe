"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import PendantLights from "./PendantLights";
import MenuPopup from "./MenuPopup";
import AboutPopup from "./AboutPopup";
import OrderPopup from "./OrderPopup";
import CaseStudy from "./CaseStudy";

type Popup = "menu" | "about" | "order" | null;

// ─── LA MARZOCCO LINEA (2-group) ────────────────────────────────────────────
function LaMarzocco() {
  return (
    <svg width="310" height="148" viewBox="0 0 310 148" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Chrome body gradient */}
        <linearGradient id="bodyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E2DDD8" />
          <stop offset="18%" stopColor="#D4CFC8" />
          <stop offset="55%" stopColor="#C8C2BC" />
          <stop offset="100%" stopColor="#B8B2AC" />
        </linearGradient>
        {/* Top highlight */}
        <linearGradient id="topGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EDE9E4" />
          <stop offset="100%" stopColor="#D0CBC4" />
        </linearGradient>
        {/* End panel */}
        <linearGradient id="endGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#B0AAA4" />
          <stop offset="50%" stopColor="#C8C2BC" />
          <stop offset="100%" stopColor="#A8A29C" />
        </linearGradient>
        {/* Group head */}
        <linearGradient id="groupGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8C4BE" />
          <stop offset="50%" stopColor="#A8A49E" />
          <stop offset="100%" stopColor="#989490" />
        </linearGradient>
        {/* Drip tray */}
        <linearGradient id="trayGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#909090" />
          <stop offset="100%" stopColor="#787878" />
        </linearGradient>
        {/* Front face recess */}
        <linearGradient id="faceGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8D3CE" />
          <stop offset="100%" stopColor="#C0BBB6" />
        </linearGradient>
        {/* Steam wand */}
        <linearGradient id="wandGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A8A4A0" />
          <stop offset="50%" stopColor="#D0CCC8" />
          <stop offset="100%" stopColor="#A0A09C" />
        </linearGradient>
        {/* Portafilter */}
        <linearGradient id="pfGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#989490" />
          <stop offset="100%" stopColor="#787470" />
        </linearGradient>
        {/* Boiler top */}
        <linearGradient id="boilerGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D8D4D0" />
          <stop offset="100%" stopColor="#C0BCBA" />
        </linearGradient>
        <filter id="machineShadow" x="-5%" y="-5%" width="110%" height="115%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="rgba(0,0,0,0.28)" />
        </filter>
      </defs>

      <g filter="url(#machineShadow)">
        {/* ── DRIP TRAY ── */}
        <rect x="30" y="134" width="250" height="11" rx="2" fill="url(#trayGrad)" />
        {/* Tray grate lines */}
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={38 + i * 13} y1="135" x2={38 + i * 13} y2="144"
            stroke="#686868" strokeWidth="0.8" opacity="0.6" />
        ))}
        <rect x="30" y="134" width="250" height="2" rx="1" fill="#A0A0A0" opacity="0.4" />

        {/* ── MAIN BODY ── */}
        {/* Body shell */}
        <path d="M42 36 Q155 26 268 36 L268 134 L42 134 Z" fill="url(#bodyGrad)" />
        {/* Top arch / boiler cover */}
        <path d="M42 36 Q155 24 268 36 L268 42 Q155 31 42 42 Z" fill="url(#topGrad)" />
        {/* Subtle top highlight stripe */}
        <path d="M60 30 Q155 22 250 30" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />

        {/* ── END PANELS ── */}
        <rect x="24" y="36" width="20" height="98" rx="3" fill="url(#endGrad)" />
        <rect x="266" y="36" width="20" height="98" rx="3" fill="url(#endGrad)" />
        {/* End panel highlight */}
        <rect x="25" y="37" width="3" height="96" rx="1" fill="rgba(255,255,255,0.18)" />
        <rect x="282" y="37" width="3" height="96" rx="1" fill="rgba(255,255,255,0.18)" />

        {/* ── FRONT FACE PANEL ── */}
        <rect x="55" y="50" width="200" height="68" rx="2" fill="url(#faceGrad)" />
        {/* Face panel inner shadow */}
        <rect x="55" y="50" width="200" height="2" rx="1" fill="rgba(0,0,0,0.08)" />
        <rect x="55" y="50" width="2" height="68" rx="1" fill="rgba(0,0,0,0.06)" />

        {/* ── BOILER HUMPS (visible top) ── */}
        <ellipse cx="110" cy="34" rx="28" ry="10" fill="url(#boilerGrad)" opacity="0.7" />
        <ellipse cx="200" cy="34" rx="28" ry="10" fill="url(#boilerGrad)" opacity="0.7" />

        {/* ── GROUP HEADS ── */}
        {/* Left group head */}
        <rect x="76" y="112" width="68" height="18" rx="4" fill="url(#groupGrad)" />
        <ellipse cx="110" cy="112" rx="34" ry="5" fill="#B8B4B0" />
        <ellipse cx="110" cy="112" rx="28" ry="3.5" fill="#C8C4C0" />
        {/* Left group shower screen */}
        <ellipse cx="110" cy="130" rx="22" ry="4" fill="#888480" />
        <ellipse cx="110" cy="130" rx="16" ry="2.5" fill="#787470" />

        {/* Right group head */}
        <rect x="166" y="112" width="68" height="18" rx="4" fill="url(#groupGrad)" />
        <ellipse cx="200" cy="112" rx="34" ry="5" fill="#B8B4B0" />
        <ellipse cx="200" cy="112" rx="28" ry="3.5" fill="#C8C4C0" />
        {/* Right group shower screen */}
        <ellipse cx="200" cy="130" rx="22" ry="4" fill="#888480" />
        <ellipse cx="200" cy="130" rx="16" ry="2.5" fill="#787470" />

        {/* ── PADDLES / CONTROLS ── */}
        {/* Left paddle */}
        <rect x="96" y="64" width="6" height="20" rx="3" fill="#C0BCBA" />
        <rect x="88" y="68" width="22" height="8" rx="4" fill="#B0ACAA" />
        <rect x="89" y="69" width="20" height="6" rx="3" fill="#C8C4C2" />

        {/* Right paddle */}
        <rect x="186" y="64" width="6" height="20" rx="3" fill="#C0BCBA" />
        <rect x="178" y="68" width="22" height="8" rx="4" fill="#B0ACAA" />
        <rect x="179" y="69" width="20" height="6" rx="3" fill="#C8C4C2" />

        {/* ── PRESSURE GAUGES ── */}
        <circle cx="155" cy="70" r="10" fill="#D0CCC8" stroke="#A8A4A0" strokeWidth="1" />
        <circle cx="155" cy="70" r="8" fill="#E0DCD8" />
        <circle cx="155" cy="70" r="6" fill="#F0EDEA" />
        {/* Gauge needle */}
        <line x1="155" y1="70" x2="155" y2="64" stroke="#5A5550" strokeWidth="1" strokeLinecap="round" />
        <line x1="155" y1="70" x2="158" y2="73" stroke="#5A5550" strokeWidth="0.8" strokeLinecap="round" />
        {/* Tick marks */}
        <circle cx="155" cy="62" r="0.8" fill="#9A9690" />
        <circle cx="149" cy="65" r="0.8" fill="#9A9690" />
        <circle cx="161" cy="65" r="0.8" fill="#9A9690" />

        {/* ── LOGO PLATE ── */}
        <rect x="128" y="83" width="54" height="14" rx="1.5" fill="rgba(0,0,0,0.06)" />
        <text x="155" y="93.5" textAnchor="middle" fontSize="5.5" fontFamily="Georgia, serif"
          fill="#888480" letterSpacing="1.5">LA MARZOCCO</text>

        {/* ── STEAM WANDS ── */}
        {/* Left steam wand */}
        <path d="M44 72 Q38 80 36 95 Q35 108 40 116" stroke="url(#wandGrad)"
          strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="40" cy="116" r="5" fill="#A8A4A0" />
        <circle cx="40" cy="116" r="3" fill="#B8B4B2" />
        {/* Left wand tip */}
        <line x1="40" y1="121" x2="40" y2="128" stroke="#989490" strokeWidth="2.5" strokeLinecap="round" />

        {/* Right steam wand */}
        <path d="M266 72 Q272 80 274 95 Q275 108 270 116" stroke="url(#wandGrad)"
          strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <circle cx="270" cy="116" r="5" fill="#A8A4A0" />
        <circle cx="270" cy="116" r="3" fill="#B8B4B2" />
        {/* Right wand tip */}
        <line x1="270" y1="121" x2="270" y2="128" stroke="#989490" strokeWidth="2.5" strokeLinecap="round" />

        {/* ── PORTAFILTERS ── */}
        {/* Left portafilter */}
        <path d="M90 130 Q110 138 130 130" stroke="url(#pfGrad)" strokeWidth="5"
          fill="none" strokeLinecap="round" />
        <rect x="104" y="128" width="12" height="10" rx="2" fill="url(#pfGrad)" />

        {/* Right portafilter */}
        <path d="M180 130 Q200 138 220 130" stroke="url(#pfGrad)" strokeWidth="5"
          fill="none" strokeLinecap="round" />
        <rect x="194" y="128" width="12" height="10" rx="2" fill="url(#pfGrad)" />

        {/* Reflective highlight on body face */}
        <path d="M60 54 L65 116" stroke="rgba(255,255,255,0.12)" strokeWidth="3" strokeLinecap="round" />
        <path d="M75 51 L80 117" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ─── NICHE ZERO GRINDER ─────────────────────────────────────────────────────
function NicheZero() {
  return (
    <svg width="62" height="120" viewBox="0 0 62 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="nicheBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1C1C1C" />
          <stop offset="40%" stopColor="#2E2E2E" />
          <stop offset="100%" stopColor="#1A1A1A" />
        </linearGradient>
        <linearGradient id="nicheTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A3A3A" />
          <stop offset="100%" stopColor="#222222" />
        </linearGradient>
        <linearGradient id="nicheRing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8C4C0" />
          <stop offset="100%" stopColor="#A0A09C" />
        </linearGradient>
        <filter id="nicheShadow">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.4)" />
        </filter>
      </defs>
      <g filter="url(#nicheShadow)">
        {/* Cone hopper */}
        <path d="M16 4 L20 32 L42 32 L46 4 Z" fill="url(#nicheTop)" />
        <ellipse cx="31" cy="4" rx="15" ry="4" fill="#333" />
        <ellipse cx="31" cy="4" rx="11" ry="2.5" fill="#444" />
        {/* Hopper ring */}
        <ellipse cx="31" cy="32" rx="12" ry="3" fill="url(#nicheRing)" />
        {/* Main body */}
        <rect x="11" y="32" width="40" height="72" rx="5" fill="url(#nicheBody)" />
        {/* Body highlight */}
        <rect x="12" y="33" width="4" height="70" rx="2" fill="rgba(255,255,255,0.05)" />
        {/* Button row */}
        <circle cx="24" cy="56" r="5" fill="#383838" stroke="#505050" strokeWidth="0.8" />
        <circle cx="24" cy="56" r="3" fill="#282828" />
        <circle cx="38" cy="56" r="5" fill="#C9A96E" stroke="#B8983D" strokeWidth="0.8" />
        <circle cx="38" cy="56" r="3" fill="#D4B078" />
        {/* Cup catch / outlet */}
        <rect x="15" y="90" width="32" height="6" rx="2" fill="#282828" />
        <rect x="19" y="92" width="24" height="2" rx="1" fill="#181818" />
        {/* Base */}
        <rect x="9" y="104" width="44" height="12" rx="3" fill="#1A1A1A" />
        <rect x="11" y="105" width="40" height="3" rx="1" fill="rgba(255,255,255,0.04)" />
        {/* Rubber feet */}
        <rect x="14" y="114" width="8" height="4" rx="2" fill="#111" />
        <rect x="40" y="114" width="8" height="4" rx="2" fill="#111" />
      </g>
    </svg>
  );
}

// ─── EK43 GRINDER ───────────────────────────────────────────────────────────
function EK43() {
  return (
    <svg width="70" height="130" viewBox="0 0 70 130" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ekBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C8C4BE" />
          <stop offset="35%" stopColor="#DDD8D2" />
          <stop offset="100%" stopColor="#B8B4B0" />
        </linearGradient>
        <linearGradient id="ekHopper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(200,210,220,0.25)" />
          <stop offset="100%" stopColor="rgba(180,190,200,0.1)" />
        </linearGradient>
        <filter id="ekShadow">
          <feDropShadow dx="2" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>
      <g filter="url(#ekShadow)">
        {/* Hopper (large, wide) */}
        <path d="M10 6 L15 44 L55 44 L60 6 Z" fill="url(#ekHopper)"
          stroke="rgba(180,185,190,0.5)" strokeWidth="1" />
        <ellipse cx="35" cy="6" rx="25" ry="6" fill="rgba(200,210,215,0.3)"
          stroke="rgba(180,185,190,0.5)" strokeWidth="1" />
        <ellipse cx="35" cy="6" rx="20" ry="4" fill="rgba(220,225,230,0.2)" />
        {/* Hopper collar */}
        <rect x="13" y="42" width="44" height="6" rx="2" fill="#B8B4B0" />
        {/* Main body */}
        <rect x="8" y="48" width="54" height="70" rx="4" fill="url(#ekBody)" />
        {/* Body left edge shadow */}
        <rect x="8" y="48" width="5" height="70" rx="2" fill="rgba(0,0,0,0.08)" />
        <rect x="57" y="48" width="5" height="70" rx="2" fill="rgba(0,0,0,0.05)" />
        {/* Brand label area */}
        <rect x="15" y="62" width="40" height="20" rx="1" fill="rgba(255,255,255,0.12)" />
        <text x="35" y="73" textAnchor="middle" fontSize="5" fontFamily="Georgia, serif"
          fill="rgba(80,70,60,0.8)" letterSpacing="2">MAHLKÖNIG</text>
        <text x="35" y="79" textAnchor="middle" fontSize="4.5" fontFamily="Arial, sans-serif"
          fill="rgba(80,70,60,0.6)" letterSpacing="1.5">EK43</text>
        {/* On/off knob */}
        <circle cx="35" cy="98" r="9" fill="#C0BCB8" stroke="#A8A4A0" strokeWidth="1" />
        <circle cx="35" cy="98" r="6" fill="#D0CCC8" />
        <line x1="35" y1="91" x2="35" y2="95" stroke="#787470" strokeWidth="1.5" strokeLinecap="round" />
        {/* Outlet spout */}
        <rect x="20" y="112" width="30" height="6" rx="2" fill="#A8A4A0" />
        {/* Base */}
        <rect x="6" y="118" width="58" height="10" rx="3" fill="#B0ACA8" />
        <rect x="8" y="119" width="54" height="3" rx="1" fill="rgba(255,255,255,0.1)" />
      </g>
    </svg>
  );
}

// ─── MILK PITCHER ───────────────────────────────────────────────────────────
function MilkPitcher({ size = 1 }: { size?: number }) {
  const h = 52 * size, w = 30 * size;
  return (
    <svg width={w} height={h} viewBox="0 0 30 52" fill="none">
      <defs>
        <linearGradient id={`pitcherGrad${size}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#C8C4C0" />
          <stop offset="45%" stopColor="#E0DDD8" />
          <stop offset="100%" stopColor="#B8B4B0" />
        </linearGradient>
      </defs>
      {/* Body */}
      <path d={`M6 8 L4 44 L26 44 L24 8 Z`}
        fill={`url(#pitcherGrad${size})`} />
      {/* Lip / spout */}
      <path d="M6 8 Q4 4 2 5 Q0 8 4 10" fill="#D0CCC8" />
      {/* Rim */}
      <ellipse cx="15" cy="8" rx="9" ry="2.5" fill="#D8D4D0" />
      <ellipse cx="15" cy="8" rx="7" ry="1.5" fill="#E0DCD8" />
      {/* Handle */}
      <path d="M24 16 Q32 20 32 28 Q32 36 24 38" stroke="#C8C4C0"
        strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Base */}
      <ellipse cx="15" cy="44" rx="11" ry="2.5" fill="#B8B4B0" />
      {/* Highlight */}
      <line x1="9" y1="10" x2="8" y2="42" stroke="rgba(255,255,255,0.25)"
        strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── PORTAFILTER RACK ────────────────────────────────────────────────────────
function PortafilterRack() {
  return (
    <svg width="76" height="90" viewBox="0 0 76 90" fill="none">
      <defs>
        <linearGradient id="rackGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#A0A09C" />
          <stop offset="50%" stopColor="#C0BCB8" />
          <stop offset="100%" stopColor="#989894" />
        </linearGradient>
      </defs>
      {/* Wall mount rail */}
      <rect x="4" y="2" width="68" height="8" rx="2" fill="url(#rackGrad)" />
      {/* Hooks */}
      {[14, 33, 52].map((x, i) => (
        <g key={i}>
          <line x1={x} y1="10" x2={x} y2="24" stroke="#909090" strokeWidth="2.5" />
          {/* Portafilter head */}
          <ellipse cx={x} cy="28" rx="10" ry="5" fill="#888480" />
          <ellipse cx={x} cy="28" rx="7.5" ry="3.5" fill="#787470" />
          {/* Handle */}
          <path d={`M${x - 6} 28 Q${x - 14} 38 ${x - 12} 54 Q${x - 10} 64 ${x} 66`}
            stroke="#706C68" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d={`M${x + 6} 28 Q${x + 14} 38 ${x + 12} 54 Q${x + 10} 64 ${x} 66`}
            stroke="#706C68" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Basket bottom */}
          <ellipse cx={x} cy="66" rx="8" ry="3" fill="#686460" />
        </g>
      ))}
    </svg>
  );
}

// ─── KNOCKBOX ───────────────────────────────────────────────────────────────
function Knockbox() {
  return (
    <svg width="56" height="44" viewBox="0 0 56 44" fill="none">
      <defs>
        <linearGradient id="kbGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A2A28" />
          <stop offset="100%" stopColor="#1A1A18" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="3" y="10" width="50" height="30" rx="4" fill="url(#kbGrad)" />
      {/* Rim */}
      <rect x="3" y="10" width="50" height="5" rx="3" fill="#3A3A38" />
      {/* Knock bar */}
      <rect x="10" y="16" width="36" height="8" rx="4" fill="#484844" />
      <rect x="11" y="17" width="34" height="4" rx="2" fill="#585854" />
      {/* Rubber trim */}
      <rect x="3" y="38" width="50" height="4" rx="2" fill="#222220" />
    </svg>
  );
}

// ─── ACAIA SCALE ────────────────────────────────────────────────────────────
function Scale() {
  return (
    <svg width="54" height="36" viewBox="0 0 54 36" fill="none">
      <defs>
        <linearGradient id="scaleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C2C2A" />
          <stop offset="100%" stopColor="#1E1E1C" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="50" height="32" rx="4" fill="url(#scaleGrad)" />
      {/* Display */}
      <rect x="8" y="7" width="28" height="14" rx="2" fill="#1A2A1A" />
      <text x="22" y="18" textAnchor="middle" fontSize="7" fontFamily="monospace"
        fill="#4AE04A" letterSpacing="1">0.0g</text>
      {/* Buttons */}
      <circle cx="42" cy="10" r="4" fill="#383836" stroke="#484844" strokeWidth="0.8" />
      <circle cx="42" cy="22" r="4" fill="#C9A96E" stroke="#B8983D" strokeWidth="0.8" />
      {/* Feet */}
      <rect x="6" y="32" width="10" height="3" rx="1.5" fill="#181816" />
      <rect x="38" y="32" width="10" height="3" rx="1.5" fill="#181816" />
    </svg>
  );
}

// ─── STACKED CUPS ───────────────────────────────────────────────────────────
function StackedCups({ count = 3 }: { count?: number }) {
  return (
    <svg width="36" height={24 + count * 10} viewBox={`0 0 36 ${24 + count * 10}`} fill="none">
      <defs>
        <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F0EDE8" />
          <stop offset="100%" stopColor="#D8D4D0" />
        </linearGradient>
      </defs>
      {Array.from({ length: count }).map((_, i) => {
        const y = i * 9;
        return (
          <g key={i}>
            <path d={`M7 ${y + 8} L5 ${y + 22} L31 ${y + 22} L29 ${y + 8} Z`}
              fill="url(#cupGrad)" />
            <ellipse cx="18" cy={y + 8} rx="11" ry="3" fill="#E8E4E0" />
            {/* Saucer */}
            {i === count - 1 && (
              <>
                <ellipse cx="18" cy={y + 22} rx="15" ry="3.5" fill="#D8D4D0" />
                <ellipse cx="18" cy={y + 22} rx="10" ry="2" fill="#E0DCD8" />
              </>
            )}
            {/* Handle */}
            <path d={`M29 ${y + 11} Q36 ${y + 13} 36 ${y + 17} Q36 ${y + 21} 29 ${y + 21}`}
              stroke="#D0CCC8" strokeWidth="1.5" fill="none" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── WATER GLASS ────────────────────────────────────────────────────────────
function WaterGlass() {
  return (
    <svg width="18" height="40" viewBox="0 0 18 40" fill="none">
      <path d="M3 4 L2 36 L16 36 L15 4 Z" fill="rgba(200,215,230,0.2)"
        stroke="rgba(180,200,220,0.4)" strokeWidth="0.8" />
      <ellipse cx="9" cy="4" rx="6" ry="1.5" fill="rgba(200,220,235,0.3)" />
      <ellipse cx="9" cy="36" rx="7" ry="2" fill="rgba(180,195,210,0.35)" />
      {/* Water fill */}
      <path d="M3.5 16 L2.5 36 L15.5 36 L14.5 16 Z" fill="rgba(180,210,235,0.18)" />
    </svg>
  );
}

// ─── COFFEE BAG (retail) ─────────────────────────────────────────────────────
function CoffeeBag({ color = "#3A3028" }: { color?: string }) {
  return (
    <svg width="32" height="56" viewBox="0 0 32 56" fill="none">
      {/* Bag body */}
      <path d="M4 12 L3 50 L29 50 L28 12 Z" fill={color} />
      {/* Top fold */}
      <path d="M4 12 L6 4 L26 4 L28 12 Z" fill={color} opacity="0.8" />
      <rect x="4" y="10" width="24" height="4" rx="1" fill="rgba(255,255,255,0.08)" />
      {/* Valve circle */}
      <circle cx="16" cy="28" r="5" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
      {/* Label band */}
      <rect x="3" y="32" width="26" height="14" rx="1" fill="rgba(255,255,255,0.06)" />
      {/* Seal at bottom */}
      <rect x="5" y="46" width="22" height="4" rx="1" fill="rgba(0,0,0,0.2)" />
    </svg>
  );
}

// ─── SMALL PLANT ────────────────────────────────────────────────────────────
function SmallPlant() {
  return (
    <svg width="36" height="52" viewBox="0 0 36 52" fill="none">
      {/* Pot */}
      <path d="M8 36 L10 50 L26 50 L28 36 Z" fill="#8B7355" />
      <ellipse cx="18" cy="36" rx="10" ry="3" fill="#9B8365" />
      <ellipse cx="18" cy="36" rx="8" ry="2" fill="#A09070" />
      {/* Soil */}
      <ellipse cx="18" cy="36" rx="7.5" ry="1.8" fill="#4A3828" />
      {/* Leaves */}
      <path d="M18 36 Q10 24 12 14 Q16 20 18 36" fill="#5A7A45" opacity="0.9" />
      <path d="M18 36 Q26 24 24 14 Q20 20 18 36" fill="#4A6A38" opacity="0.9" />
      <path d="M18 36 Q8 28 6 18 Q14 22 18 36" fill="#648A4E" opacity="0.8" />
      <path d="M18 36 Q28 28 30 18 Q22 22 18 36" fill="#527840" opacity="0.8" />
      <path d="M18 36 Q18 20 16 8 Q20 14 18 36" fill="#5E8448" opacity="0.85" />
    </svg>
  );
}

// ─── BACK BAR ITEMS ──────────────────────────────────────────────────────────
function SyrupBottle({ tall = false }: { tall?: boolean }) {
  const h = tall ? 52 : 40;
  return (
    <svg width="16" height={h} viewBox={`0 0 16 ${h}`} fill="none">
      <rect x="3" y={h * 0.2} width="10" height={h * 0.72} rx="2.5"
        fill="rgba(180,150,100,0.55)" stroke="rgba(160,130,80,0.3)" strokeWidth="0.6" />
      <rect x="5" y={0} width="6" height={h * 0.24} rx="1.5"
        fill="rgba(160,130,80,0.6)" />
      <rect x="5" y={h * 0.18} width="6" height="3" rx="1"
        fill="rgba(140,110,60,0.5)" />
    </svg>
  );
}

function MugHanging({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Hook */}
      <line x1="8" y1="0" x2="8" y2="8" stroke="#8B7355" strokeWidth="1.5" />
      {/* Mug */}
      <path d="M2 8 L1 28 L15 28 L14 8 Z" fill="#D8D0C8" stroke="#C8C0B8" strokeWidth="0.6" />
      <ellipse cx="8" cy="8" rx="6" ry="1.8" fill="#E0D8D0" />
      <path d="M14 12 Q19 14 19 18 Q19 22 14 24" stroke="#C8C0B8" strokeWidth="2" fill="none" />
    </g>
  );
}

// ─── FRAMED PRINT ────────────────────────────────────────────────────────────
function FramedPrint() {
  return (
    <svg width="68" height="86" viewBox="0 0 68 86" fill="none">
      {/* Frame */}
      <rect x="2" y="2" width="64" height="82" rx="2" fill="#5A4A38" />
      <rect x="5" y="5" width="58" height="76" rx="1" fill="#E8E0D4" />
      {/* Mat */}
      <rect x="8" y="8" width="52" height="70" rx="1" fill="#F0EDE8" />
      {/* Print area */}
      <rect x="14" y="16" width="40" height="50" rx="0.5" fill="#E4DED6" />
      {/* Abstract botanical lines */}
      <path d="M34 56 Q30 44 28 32" stroke="rgba(90,74,56,0.4)" strokeWidth="1.2" fill="none" />
      <path d="M34 56 Q38 42 36 28" stroke="rgba(90,74,56,0.35)" strokeWidth="1.2" fill="none" />
      <path d="M28 32 Q22 28 18 32" stroke="rgba(90,74,56,0.3)" strokeWidth="1" fill="none" />
      <path d="M36 28 Q42 24 46 30" stroke="rgba(90,74,56,0.3)" strokeWidth="1" fill="none" />
      <ellipse cx="34" cy="56" rx="3" ry="5" fill="rgba(90,74,56,0.2)" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function CafeScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const welcomeRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const btnsRef = useRef<HTMLButtonElement[]>([]);
  const counterItemsRef = useRef<HTMLDivElement>(null);

  const [activePopup, setActivePopup] = useState<Popup>(null);
  const [caseStudySlug, setCaseStudySlug] = useState<string | null>(null);

  const openPopup = useCallback((popup: Popup) => setActivePopup(popup), []);
  const closePopup = useCallback(() => setActivePopup(null), []);
  const openCaseStudy = useCallback((slug: string) => {
    setActivePopup(null);
    setCaseStudySlug(slug);
  }, []);
  const closeCaseStudy = useCallback(() => setCaseStudySlug(null), []);

  // Entrance animation
  useEffect(() => {
    const scene = sceneRef.current;
    const welcome = welcomeRef.current;
    const actions = actionsRef.current;
    const counterItems = counterItemsRef.current;
    if (!scene || !welcome || !actions || !counterItems) return;

    gsap.set(scene, { opacity: 0 });
    gsap.set([welcome, actions, counterItems], { opacity: 0, y: 16 });

    gsap.timeline({ defaults: { ease: "power3.out" } })
      .to(scene, { opacity: 1, duration: 2.2, ease: "power2.inOut" })
      .to(counterItems, { opacity: 1, y: 0, duration: 0.9 }, "-=0.8")
      .to(welcome, { opacity: 1, y: 0, duration: 0.8 }, "-=0.6")
      .to(actions, { opacity: 1, y: 0, duration: 0.7 }, "-=0.4");
  }, []);

  // Subtle mouse parallax
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      gsap.to(scene.querySelector(".back-wall"), {
        x: nx * -10, y: ny * -5, duration: 1.6, ease: "power1.out",
      });
      gsap.to(scene.querySelector(".back-bar"), {
        x: nx * -7, y: ny * -3.5, duration: 1.6, ease: "power1.out",
      });
      gsap.to(welcomeRef.current, {
        x: nx * 5, y: ny * 2.5, duration: 1.8, ease: "power1.out",
      });
      gsap.to(counterItemsRef.current, {
        x: nx * 2, duration: 2, ease: "power1.out",
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleBtnEnter = (i: number) => {
    gsap.to(btnsRef.current[i], { y: -2, duration: 0.18, ease: "power2.out" });
  };
  const handleBtnLeave = (i: number) => {
    gsap.to(btnsRef.current[i], { y: 0, duration: 0.28, ease: "power2.out" });
  };
  const handleBtnClick = (popup: Popup, el: HTMLButtonElement) => {
    gsap.timeline()
      .to(el, { scale: 0.97, duration: 0.08, ease: "power2.in" })
      .to(el, { scale: 1, duration: 0.22, ease: "back.out(2)" })
      .call(() => openPopup(popup));
  };

  return (
    <>
      <div ref={sceneRef} className="cafe-scene">
        <div className="room">

          {/* Ceiling */}
          <div className="ceiling" />

          {/* Pendant lights */}
          <PendantLights />

          {/* Side walls */}
          <div className="left-wall" />
          <div className="right-wall" />

          {/* Back wall */}
          <div className="back-wall" />

          {/* Back bar shelving */}
          <div className="back-bar">
            <div className="shelf shelf-top" />
            {/* Top shelf: coffee bags + framed print */}
            <div style={{
              position: "absolute", top: 4, left: "5%",
              display: "flex", alignItems: "flex-end", gap: 10, opacity: 0.88,
            }}>
              <CoffeeBag color="#3A3028" />
              <CoffeeBag color="#4A3830" />
              <CoffeeBag color="#2E2820" />
              <CoffeeBag color="#3C3425" />
              <div style={{ marginLeft: 8 }}>
                <FramedPrint />
              </div>
              <div style={{ display: "flex", gap: 5, marginLeft: 12 }}>
                <SyrupBottle tall />
                <SyrupBottle />
                <SyrupBottle tall />
                <SyrupBottle />
                <SyrupBottle tall />
              </div>
            </div>

            <div className="shelf shelf-mid" />
            {/* Mid shelf: mugs hanging */}
            <div style={{
              position: "absolute", top: "46%", left: "6%",
              opacity: 0.82,
            }}>
              <svg width="280" height="40" viewBox="0 0 280 40" fill="none">
                <line x1="0" y1="2" x2="280" y2="2" stroke="#8B7355" strokeWidth="1.5" opacity="0.5" />
                <MugHanging x={10} y={0} />
                <MugHanging x={38} y={0} />
                <MugHanging x={66} y={0} />
                <MugHanging x={94} y={0} />
                <MugHanging x={122} y={0} />
                <MugHanging x={150} y={0} />
              </svg>
            </div>
          </div>

          {/* Welcome text */}
          <div ref={welcomeRef} className="welcome-text">
            <div className="welcome-small">Welcome to</div>
            <div className="welcome-name">Your Name Studio</div>
          </div>

          {/* Floor */}
          <div className="floor" />

          {/* Counter */}
          <div className="counter">
            <div className="counter-top" />
            <div className="counter-face" />

            {/* Counter top items */}
            <div ref={counterItemsRef} className="counter-items">

              {/* Far left: portafilter rack */}
              <div style={{ paddingBottom: 2 }}>
                <PortafilterRack />
              </div>

              {/* Left: Niche Zero grinder */}
              <div style={{ paddingBottom: 2 }}>
                <NicheZero />
              </div>

              {/* Knockbox below grinder */}
              <div style={{ alignSelf: "flex-end", marginBottom: 0 }}>
                <Knockbox />
              </div>

              {/* CENTER: La Marzocco Linea */}
              <div style={{ paddingBottom: 0, position: "relative" }}>
                <LaMarzocco />
              </div>

              {/* Scale with cup on top */}
              <div style={{ alignSelf: "flex-end", display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
                <Scale />
              </div>

              {/* Right: EK43 grinder */}
              <div style={{ paddingBottom: 2 }}>
                <EK43 />
              </div>

              {/* Milk pitchers */}
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 4, paddingBottom: 2,
              }}>
                <MilkPitcher size={0.85} />
                <MilkPitcher size={1} />
                <MilkPitcher size={0.7} />
              </div>

              {/* Stacked cups + water glasses */}
              <div style={{
                display: "flex", alignItems: "flex-end", gap: 8, paddingBottom: 2,
              }}>
                <StackedCups count={4} />
                <StackedCups count={3} />
                <div style={{ display: "flex", gap: 3, alignSelf: "flex-end" }}>
                  <WaterGlass />
                  <WaterGlass />
                </div>
              </div>

              {/* Small plant */}
              <div style={{ paddingBottom: 2 }}>
                <SmallPlant />
              </div>

            </div>
          </div>

          {/* Vignette */}
          <div className="vignette" />

          {/* Action buttons */}
          <div ref={actionsRef} className="actions">
            {(["View Menu", "About"] as const).map((label, i) => {
              const popup = (label === "View Menu" ? "menu" : "about") as Popup;
              return (
                <button
                  key={label}
                  ref={(el) => { if (el) btnsRef.current[i] = el; }}
                  className="cafe-btn"
                  onMouseEnter={() => handleBtnEnter(i)}
                  onMouseLeave={() => handleBtnLeave(i)}
                  onClick={(e) => handleBtnClick(popup, e.currentTarget)}
                >
                  {label}
                </button>
              );
            })}
            <button
              ref={(el) => { if (el) btnsRef.current[2] = el; }}
              className="cafe-btn cafe-btn-order"
              onMouseEnter={() => handleBtnEnter(2)}
              onMouseLeave={() => handleBtnLeave(2)}
              onClick={(e) => handleBtnClick("order", e.currentTarget)}
            >
              Order
            </button>
          </div>

        </div>
      </div>

      <MenuPopup isOpen={activePopup === "menu"} onClose={closePopup} onProjectClick={openCaseStudy} />
      <AboutPopup isOpen={activePopup === "about"} onClose={closePopup} />
      <OrderPopup isOpen={activePopup === "order"} onClose={closePopup} />
      <CaseStudy slug={caseStudySlug} onClose={closeCaseStudy} />
    </>
  );
}

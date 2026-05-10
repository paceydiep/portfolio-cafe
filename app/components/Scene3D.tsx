"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  RoundedBox,
  Text,
  useGLTF,
} from "@react-three/drei";
import {
  useRef, useEffect, useState, useCallback, Suspense, useMemo,
} from "react";
import * as THREE from "three";
import gsap from "gsap";
import MenuPopup from "./MenuPopup";
import AboutPopup from "./AboutPopup";
import OrderPopup from "./OrderPopup";
import CaseStudy from "./CaseStudy";
import { rotate } from "three/tsl";

type Popup = "menu" | "about" | "order" | null;
type HoverTarget = "menu" | "order" | "vinyl" | "cups" | null;
type MeshPointerEvent = ThreeEvent<PointerEvent>;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.min(hi, Math.max(lo, v)); }

// ─── PROCEDURAL TEXTURES ──────────────────────────────────────────────────────
function useProceduralTextures() {
  return useMemo(() => {
    // ── Marble counter top ──────────────────────────────────────────────────
    const mc = document.createElement("canvas");
    mc.width = 1024; mc.height = 512;
    const mx = mc.getContext("2d")!;
    const mg = mx.createLinearGradient(0, 0, 1024, 512);
    mg.addColorStop(0, "#EDE8E0"); mg.addColorStop(0.4, "#E6E0D4");
    mg.addColorStop(0.7, "#EAE4DA"); mg.addColorStop(1, "#E2DCD0");
    mx.fillStyle = mg; mx.fillRect(0, 0, 1024, 512);
    // Veins
    for (let v = 0; v < 16; v++) {
      mx.beginPath();
      const a = 0.04 + Math.random() * 0.10;
      const r = 128 + Math.floor(Math.random() * 40);
      const g = 118 + Math.floor(Math.random() * 30);
      const b = 106 + Math.floor(Math.random() * 20);
      mx.strokeStyle = `rgba(${r},${g},${b},${a})`;
      mx.lineWidth = 0.4 + Math.random() * 2.2;
      let x = Math.random() * 1024, y = Math.random() * 512;
      mx.moveTo(x, y);
      for (let s = 0; s < 10; s++) {
        const ang = Math.atan2(Math.random() - 0.5, Math.random() - 0.3) + v * 0.35;
        const len = 55 + Math.random() * 95;
        const c1x = x + Math.cos(ang) * len * 0.4 + (Math.random() - 0.5) * 35;
        const c1y = y + Math.sin(ang) * len * 0.4 + (Math.random() - 0.5) * 28;
        const c2x = x + Math.cos(ang) * len * 0.7 + (Math.random() - 0.5) * 35;
        const c2y = y + Math.sin(ang) * len * 0.7 + (Math.random() - 0.5) * 28;
        x += Math.cos(ang) * len; y += Math.sin(ang) * len;
        mx.bezierCurveTo(c1x, c1y, c2x, c2y, x, y);
      }
      mx.stroke();
    }
    // Pixel noise
    const mid = mx.getImageData(0, 0, 1024, 512);
    for (let i = 0; i < mid.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 9;
      mid.data[i] = clamp(mid.data[i] + n, 0, 255);
      mid.data[i + 1] = clamp(mid.data[i + 1] + n, 0, 255);
      mid.data[i + 2] = clamp(mid.data[i + 2] + n * 0.8, 0, 255);
    }
    mx.putImageData(mid, 0, 0);
    const marble = new THREE.CanvasTexture(mc);
    marble.wrapS = marble.wrapT = THREE.RepeatWrapping;
    marble.repeat.set(1.4, 1);

    // Roughness map for marble — lighter (less rough) where veins are glossier
    const rc = document.createElement("canvas");
    rc.width = 256; rc.height = 128;
    const rx = rc.getContext("2d")!;
    rx.fillStyle = "#888"; rx.fillRect(0, 0, 256, 128);
    const rid = rx.getImageData(0, 0, 256, 128);
    for (let i = 0; i < rid.data.length; i += 4) {
      const v = 110 + Math.floor(Math.random() * 50);
      rid.data[i] = rid.data[i + 1] = rid.data[i + 2] = v;
      rid.data[i + 3] = 255;
    }
    rx.putImageData(rid, 0, 0);
    const marbleRoughness = new THREE.CanvasTexture(rc);
    marbleRoughness.wrapS = marbleRoughness.wrapT = THREE.RepeatWrapping;
    marbleRoughness.repeat.set(1.4, 1);

    // ── Wood grain shelves ───────────────────────────────────────────────────
    const wc = document.createElement("canvas");
    wc.width = 512; wc.height = 256;
    const wx = wc.getContext("2d")!;
    const wg = wx.createLinearGradient(0, 0, 512, 0);
    wg.addColorStop(0, "#8A6840"); wg.addColorStop(0.3, "#9E7A4A");
    wg.addColorStop(0.65, "#8A6838"); wg.addColorStop(1, "#7A5C34");
    wx.fillStyle = wg; wx.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 2 + Math.floor(Math.random() * 4)) {
      wx.beginPath();
      wx.strokeStyle = `rgba(40,18,0,${0.05 + Math.random() * 0.18})`;
      wx.lineWidth = 0.4 + Math.random() * 1.1;
      wx.moveTo(0, y);
      let px = 0;
      while (px < 512) { const step = 10 + Math.random() * 20; wx.lineTo(px + step, y + (Math.random() - 0.5) * 1.8); px += step; }
      wx.stroke();
    }
    // Knots
    for (let k = 0; k < 2; k++) {
      const kx2 = 80 + Math.random() * 340, ky2 = 40 + Math.random() * 170, kr = 12 + Math.random() * 18;
      for (let ring = 0; ring < 5; ring++) {
        wx.beginPath();
        wx.ellipse(kx2, ky2, kr + ring * 5, (kr + ring * 5) * 0.5, 0.1, 0, Math.PI * 2);
        wx.strokeStyle = `rgba(40,15,0,${0.065 - ring * 0.01})`;
        wx.lineWidth = 0.8; wx.stroke();
      }
    }
    const wood = new THREE.CanvasTexture(wc);
    wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
    wood.repeat.set(2.5, 1);

    // ── Hardwood floor ───────────────────────────────────────────────────────
    const hc = document.createElement("canvas");
    hc.width = 512; hc.height = 512;
    const hx = hc.getContext("2d")!;
    hx.fillStyle = "#E4D8C4"; // Beige base color
    hx.fillRect(0, 0, 512, 512);

    const numPlanks = 8;
    const plankH = 512 / numPlanks;
    for (let p = 0; p < numPlanks; p++) {
      const py = p * plankH;
      hx.fillStyle = p % 2 === 0 ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
      hx.fillRect(0, py, 512, plankH);

      for (let s = 0; s < 60; s++) {
        hx.beginPath();
        hx.strokeStyle = `rgba(160, 130, 90, ${0.05 + Math.random() * 0.1})`;
        hx.lineWidth = 1 + Math.random() * 2;
        const ly = py + Math.random() * plankH;
        hx.moveTo(0, ly);
        hx.lineTo(512, ly + (Math.random() - 0.5) * 3);
        hx.stroke();
      }

      hx.beginPath();
      hx.strokeStyle = "rgba(140, 110, 80, 0.4)";
      hx.lineWidth = 3;
      hx.moveTo(0, py);
      hx.lineTo(512, py);
      hx.stroke();

      const numCuts = 1 + Math.floor(Math.random() * 2);
      for (let c = 0; c < numCuts; c++) {
        const px = 50 + Math.random() * 400;
        hx.beginPath();
        hx.strokeStyle = "rgba(140, 110, 80, 0.4)";
        hx.lineWidth = 3;
        hx.moveTo(px, py);
        hx.lineTo(px, py + plankH);
        hx.stroke();
      }
    }
    const hardwood = new THREE.CanvasTexture(hc);
    hardwood.wrapS = hardwood.wrapT = THREE.RepeatWrapping;
    hardwood.repeat.set(4, 6);

    // ── Concrete walls ───────────────────────────────────────────────────────
    const pc = document.createElement("canvas");
    pc.width = 512; pc.height = 512;
    const px2 = pc.getContext("2d")!;
    px2.fillStyle = "#8C8D8E"; px2.fillRect(0, 0, 512, 512);
    const pid = px2.getImageData(0, 0, 512, 512);
    for (let i = 0; i < pid.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 20;
      pid.data[i] = clamp(pid.data[i] + n, 0, 255);
      pid.data[i + 1] = clamp(pid.data[i + 1] + n * 0.95, 0, 255);
      pid.data[i + 2] = clamp(pid.data[i + 2] + n * 0.9, 0, 255);
    }
    px2.putImageData(pid, 0, 0);
    // Draw some stains
    for (let j = 0; j < 15; j++) {
      px2.fillStyle = `rgba(0,0,0,${Math.random() * 0.05})`;
      px2.beginPath();
      px2.arc(Math.random() * 512, Math.random() * 512, Math.random() * 100 + 20, 0, Math.PI * 2);
      px2.fill();
    }
    const concrete = new THREE.CanvasTexture(pc);
    concrete.wrapS = concrete.wrapT = THREE.RepeatWrapping;
    concrete.repeat.set(4, 2);

    // ── Felt Letterboard ─────────────────────────────────────────────────────
    const fc = document.createElement("canvas");
    fc.width = 512; fc.height = 512;
    const fx = fc.getContext("2d")!;
    fx.fillStyle = "#1E1E1E";
    fx.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 8) {
      fx.fillStyle = "#0A0A0A";
      fx.fillRect(0, y, 512, 2);
      fx.fillStyle = "#2D2D2D";
      fx.fillRect(0, y + 2, 512, 1);
    }
    const fid = fx.getImageData(0, 0, 512, 512);
    for (let i = 0; i < fid.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 6;
      fid.data[i] = clamp(fid.data[i] + n, 0, 255);
      fid.data[i + 1] = clamp(fid.data[i + 1] + n, 0, 255);
      fid.data[i + 2] = clamp(fid.data[i + 2] + n, 0, 255);
    }
    fx.putImageData(fid, 0, 0);
    const feltTexture = new THREE.CanvasTexture(fc);
    feltTexture.wrapS = feltTexture.wrapT = THREE.RepeatWrapping;
    feltTexture.repeat.set(2, 4);



    // ── Normal maps (smooth noise DataTexture) ───────────────────────────────
    function buildNormalMap(size: number, strength: number) {
      const h = new Float32Array(size * size);
      for (let i = 0; i < h.length; i++) h[i] = Math.random();
      // Box-blur pass for smoothness
      const sm = new Float32Array(size * size);
      for (let y = 1; y < size - 1; y++)
        for (let x = 1; x < size - 1; x++) {
          let s = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += h[(y + dy) * size + (x + dx)];
          sm[y * size + x] = s / 9;
        }
      const data = new Uint8Array(4 * size * size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const h00 = sm[y * size + x];
          const h10 = sm[y * size + Math.min(x + 1, size - 1)];
          const h01 = sm[Math.min(y + 1, size - 1) * size + x];
          const nx = (h00 - h10) * strength, ny = (h00 - h01) * strength, nz = 1;
          const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
          const i = (y * size + x) * 4;
          data[i] = Math.floor(((nx / len + 1) / 2) * 255);
          data[i + 1] = Math.floor(((ny / len + 1) / 2) * 255);
          data[i + 2] = Math.floor(((nz / len + 1) / 2) * 255);
          data[i + 3] = 255;
        }
      }
      const t = new THREE.DataTexture(data, size, size);
      t.needsUpdate = true;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    }
    const normalMarble = buildNormalMap(128, 1.8);
    const normalHardwood = buildNormalMap(128, 1.2);
    const normalWall = buildNormalMap(128, 2.2);

    return { marble, marbleRoughness, wood, hardwood, concrete, feltTexture, normalMarble, normalHardwood, normalWall };
  }, []);
}

type Textures = ReturnType<typeof useProceduralTextures>;

// ─── STEAM SYSTEM ─────────────────────────────────────────────────────────────
function SteamSystem({ position }: { position: [number, number, number] }) {
  const N = 7;
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const offsets = useMemo(() => Array.from({ length: N }, (_, i) => i / N), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    offsets.forEach((offset, i) => {
      const mesh = meshRefs.current[i];
      if (!mesh) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const phase = (t * 0.2 + offset) % 1;
      mesh.position.y = phase * 0.28;
      mesh.position.x = Math.sin(phase * Math.PI * 2.4 + i * 0.95) * 0.015;
      mesh.position.z = Math.cos(phase * Math.PI * 1.6 + i * 0.7) * 0.01;
      mesh.scale.setScalar(0.45 + phase * 2.1);
      mat.opacity = Math.max(0, Math.sin(phase * Math.PI) * 0.17);
    });
  });

  return (
    <group position={position}>
      {offsets.map((_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el; }}>
          <planeGeometry args={[0.034, 0.034]} />
          <meshBasicMaterial
            color="#E8E8E8"
            transparent
            opacity={0.1}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// ─── CAMERA RIG ───────────────────────────────────────────────────────────────
function CameraRig({ activePopup }: { activePopup: Popup }) {
  const proxy = useRef({
    z: 0,
    baseX: 0,
    baseY: 1.62,
    lookX: 0,
    lookY: 0.82,
    lookZ: 0
  });
  const mouse = useRef({ x: 0, y: 0 });
  const lookTarget = useRef(new THREE.Vector3(0, 0.82, 0));

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    if (!activePopup) {
      gsap.to(proxy.current, {
        baseX: 0, baseY: 1.62, z: 5.2,
        lookX: 0, lookY: 0.82, lookZ: 0,
        duration: 0.8, ease: "power2.out"
      });
    } else if (activePopup === "about") {
      gsap.to(proxy.current, {
        baseX: -1.15, baseY: 1.75, z: 3.35,
        lookX: -1.15, lookY: 1.78, lookZ: 0.05,
        duration: 1.5, ease: "power3.inOut"
      });
    } else if (activePopup === "menu") {
      gsap.to(proxy.current, {
        baseX: 1.8, baseY: 1.45, z: 2.8,
        lookX: 1.8, lookY: 1.18, lookZ: 1.95,
        duration: 1.5, ease: "power3.inOut"
      });
    } else if (activePopup === "order") {
      gsap.to(proxy.current, {
        baseX: 2.6, baseY: 1.45, z: 2.8,
        lookX: 2.6, lookY: 1.1, lookZ: 1.8,
        duration: 1.5, ease: "power3.inOut"
      });
    }
  }, [activePopup]);

  useFrame(({ camera }) => {
    const wobbleIntensity = activePopup ? 0 : 1;
    camera.position.x += (proxy.current.baseX + mouse.current.x * 0.3 * wobbleIntensity - camera.position.x) * 0.04;
    camera.position.y += (proxy.current.baseY + -mouse.current.y * 0.1 * wobbleIntensity - camera.position.y) * 0.04;
    camera.position.z += (proxy.current.z - camera.position.z) * 0.04;

    lookTarget.current.x += (proxy.current.lookX + mouse.current.x * 0.15 * wobbleIntensity - lookTarget.current.x) * 0.04;
    lookTarget.current.y += (proxy.current.lookY - lookTarget.current.y) * 0.04;
    lookTarget.current.z += (proxy.current.lookZ - lookTarget.current.z) * 0.04;
    camera.lookAt(lookTarget.current);
  });

  return null;
}

// ─── CURTAINS & WINDOWS ───────────────────────────────────────────────────────
function Curtain({ position, height = 3.6, width = 1.2 }: { position: [number, number, number], height?: number, width?: number }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, height, 24, 14);
    const posAttribute = geo.attributes.position;

    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      const yNorm = (height / 2 - y) / height;
      const folds = Math.sin(x * 18) * 0.022;
      const drape = Math.sin(yNorm * Math.PI) * 0.018;
      posAttribute.setZ(i, folds + drape);
    }

    posAttribute.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  }, [height, width]);

  return (
    <mesh position={position}>
      <primitive object={geometry} attach="geometry" />
      <meshPhysicalMaterial
        color="#F2EFE8"
        roughness={0.72}
        transmission={0.28}
        transparent
        opacity={0.8}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function WindowWithCurtains({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const width = 4.0;
  const height = 6.0;

  // Crittall window grid (dividers)
  const cols = 2;
  const rows = 2;
  const hSpacing = width / cols;
  const vSpacing = height / rows;

  const frameDepth = 0.16;
  const frameThick = 0.16;

  return (
    <group position={position} rotation={rotation}>
      {/* Natural Window Glass / Background - pulled forward to avoid Z-fighting */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#AEC6D8" />
      </mesh>

      {/* Outer Metal Frame */}
      {/* Top */}
      <mesh position={[0, height / 2 + frameThick / 2, 0]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, frameDepth]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -height / 2 - frameThick / 2, 0]}>
        <boxGeometry args={[width + frameThick * 2, frameThick, frameDepth]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Right */}
      <mesh position={[width / 2 + frameThick / 2, 0, 0]}>
        <boxGeometry args={[frameThick, height, frameDepth]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Left */}
      <mesh position={[-width / 2 - frameThick / 2, 0, 0]}>
        <boxGeometry args={[frameThick, height, frameDepth]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Vertical Dividers */}
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <mesh key={`v-${i}`} position={[-width / 2 + (i + 1) * hSpacing, 0, 0]}>
          <boxGeometry args={[0.06, height, 0.08]} />
          <meshStandardMaterial color="#0A0A0A" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Horizontal Dividers */}
      {Array.from({ length: rows - 1 }).map((_, i) => (
        <mesh key={`h-${i}`} position={[0, -height / 2 + (i + 1) * vSpacing, 0]}>
          <boxGeometry args={[width, 0.06, 0.08]} />
          <meshStandardMaterial color="#0A0A0A" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Closed sheer curtains */}
      <Curtain position={[-1.0, -0.2, 0.15]} height={6.2} width={2.18} />
      <Curtain position={[1.0, -0.2, 0.16]} height={6.2} width={2.18} />

      {/* Rod */}
      <mesh position={[0, height / 2 + 0.15, 0.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, width + 1.6, 8]} />
        <meshStandardMaterial color="#0A0A0A" roughness={0.2} metalness={0.9} />
      </mesh>
    </group>
  );
}

// ─── ROOM ─────────────────────────────────────────────────────────────────────
function Room({ tex }: { tex: Textures }) {
  return (
    <group>
      {/* Hardwood floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial
          map={tex?.hardwood ?? null}
          normalMap={tex?.normalHardwood ?? null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          color="#EAE0D0"
          roughness={0.65}
          metalness={0.05}
        />
      </mesh>

      {/* Back wall — concrete */}
      <mesh position={[0, 3.7, -4.0]}>
        <planeGeometry args={[16, 8.5]} />
        <meshStandardMaterial
          map={tex?.concrete ?? null}
          normalMap={tex?.normalWall ?? null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughness={0.97} metalness={0}
        />
      </mesh>

      {/* Left wall */}
      <mesh position={[-7, 3.7, -0.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 8.5]} />
        <meshStandardMaterial
          map={tex?.concrete ?? null}
          normalMap={tex?.normalWall ?? null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughness={0.97} metalness={0}
        />
      </mesh>

      {/* Right wall */}
      <mesh position={[7, 3.7, -0.5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 8.5]} />
        <meshStandardMaterial
          map={tex?.concrete ?? null}
          normalMap={tex?.normalWall ?? null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          roughness={0.97} metalness={0}
        />
      </mesh>

      {/* Windows */}
      <WindowWithCurtains position={[-6.95, 3.0, 0]} rotation={[0, Math.PI / 2, 0]} />
      <WindowWithCurtains position={[6.95, 3.0, 0]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7.95, -0.5]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#1A1208" roughness={1} metalness={0} />
      </mesh>

      {/* Dado rail */}
      <mesh position={[0, 0.9, -3.96]}>
        <boxGeometry args={[15.5, 0.03, 0.06]} />
        <meshStandardMaterial color="#9A8860" roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.42, -3.97]}>
        <planeGeometry args={[15.8, 0.84]} />
        <meshStandardMaterial color="#A89870" roughness={0.95} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── BACK BAR ─────────────────────────────────────────────────────────────────
function BackBar({ tex }: { tex: Textures }) {
  return (
    <group>
      {/* Cabinet body */}
      <RoundedBox position={[0, 0.58, -3.2]} args={[13, 1.16, 0.72]} radius={0.06} smoothness={4}>
        <meshStandardMaterial color="#786450" roughness={0.82} metalness={0.08} />
      </RoundedBox>
      <RoundedBox position={[0, 1.19, -3.16]} args={[13.1, 0.06, 0.78]} radius={0.025} smoothness={3}>
        <meshStandardMaterial color="#D0C8C0" roughness={0.35} metalness={0.08} />
      </RoundedBox>
      <mesh position={[0, 0.58, -2.85]}>
        <boxGeometry args={[13, 1.12, 0.04]} />
        <meshStandardMaterial color="#6A5840" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Shelves — wood grain */}
      {[2.25, 3.1].map((y, i) => (
        <RoundedBox key={i} position={[0, y, -3.3]} args={[12, 0.05, 0.42]} radius={0.018} smoothness={3}>
          <meshStandardMaterial
            map={tex?.wood ?? null}
            color="#9A8060"
            roughness={0.52} metalness={0.18}
          />
        </RoundedBox>
      ))}

      {/* Shelf brackets */}
      {[-5, -2.5, 0, 2.5, 5].map((x, i) => (
        <group key={i}>
          {[2.22, 3.07].map((y, j) => (
            <mesh key={j} position={[x, y, -3.42]}>
              <boxGeometry args={[0.04, 0.08, 0.36]} />
              <meshStandardMaterial color="#8A7050" roughness={0.6} metalness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      <ShelfItems />
    </group>
  );
}

const BAG_ORIGINS = ["ETHIOPIA\nYirgacheffe", "COLOMBIA\nHuila", "KENYA\nAA", "GUATEMALA\nAntigua", "BRAZIL\nCerrado"];
const BAG_COLORS = ["#2E2416", "#3C2E20", "#261E14", "#342818", "#2A2018"];

function ShelfItems() {
  return (
    <group>
      {/* Coffee bags + Text labels — upper shelf */}
      {BAG_COLORS.map((col, i) => (
        <group key={i} position={[-3.5 + i * 0.55, 2.52, -3.26]} rotation={[0, (i - 2) * 0.04, 0]}>
          <RoundedBox args={[0.32, 0.52, 0.15]} radius={0.035} smoothness={4}>
            <meshStandardMaterial color={col} roughness={0.9} metalness={0} />
          </RoundedBox>
          {/* Valve */}
          <mesh position={[0, 0.06, 0.08]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 8]} />
            <meshStandardMaterial color="#555" roughness={0.6} metalness={0.3} />
          </mesh>
          {/* Origin label */}
          <Text
            position={[0, -0.02, 0.085]}
            fontSize={0.028}
            color="#EDE4D0"
            letterSpacing={0.1}
            textAlign="center"
            anchorX="center"
            anchorY="middle"
            maxWidth={0.28}
          >
            {BAG_ORIGINS[i]}
          </Text>
        </group>
      ))}

      {/* Extra bags */}
      {["#3A2E22", "#4A3C2A", "#2C2418"].map((col, i) => (
        <RoundedBox key={i} position={[2.5 + i * 0.45, 2.52, -3.26]} args={[0.32, 0.52, 0.15]} radius={0.035} smoothness={4}>
          <meshStandardMaterial color={col} roughness={0.9} metalness={0} />
        </RoundedBox>
      ))}

    </group>
  );
}

// ─── COUNTER ──────────────────────────────────────────────────────────────────
function Counter({ tex }: { tex: Textures }) {
  return (
    <group>
      <RoundedBox position={[0, 0.5, 1.7]} args={[11.5, 1.0, 1.3]} radius={0.08} smoothness={5}>
        <meshStandardMaterial color="#C0B8B0" roughness={0.72} metalness={0.06} />
      </RoundedBox>
      {/* Front panel detail */}
      <mesh position={[0, 0.5, 2.351]}>
        <planeGeometry args={[11.48, 0.98]} />
        <meshStandardMaterial color="#B0A8A0" roughness={0.78} metalness={0.04} />
      </mesh>
      {/* Marble top with texture + normal map */}
      <RoundedBox position={[0, 1.045, 1.68]} args={[11.7, 0.09, 1.45]} radius={0.045} smoothness={5}>
        <meshPhysicalMaterial
          map={tex?.marble ?? null}
          roughnessMap={tex?.marbleRoughness ?? null}
          normalMap={tex?.normalMarble ?? null}
          normalScale={new THREE.Vector2(0.4, 0.4)}
          color="#EAE4DC"
          roughness={0.3}
          metalness={0.02}
          clearcoat={0.3}
          clearcoatRoughness={0.25}
        />
      </RoundedBox>
      {/* Edge highlight */}
      <mesh position={[0, 1.09, 2.36]}>
        <boxGeometry args={[11.72, 0.02, 0.04]} />
        <meshStandardMaterial color="#F2EDE6" roughness={0.15} metalness={0.1} />
      </mesh>
      {/* Black Plinth Base - Slightly larger to prevent Z-fighting */}
      <RoundedBox position={[0, 0.02, 1.7]} args={[11.54, 0.04, 1.34]} radius={0.018} smoothness={3}>
        <meshStandardMaterial color="#1A1208" roughness={1} metalness={0} />
      </RoundedBox>
    </group>
  );
}

// ─── LA MARZOCCO LINEA ────────────────────────────────────────────────────────
// All metal surfaces upgraded to MeshPhysicalMaterial with clearcoat
function LaMarzocco({ position }: { position: [number, number, number] }) {
  const { scene } = useGLTF("/models/la_marzocco_coffee_machine.glb");
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={position}>
      <primitive object={model} position={[-0.4, 0, 0.04]} scale={[0.15, 0.15, 0.1]} rotation={[0, Math.PI, 0]}/>
    </group>
  );
}

// ─── NICHE ZERO ───────────────────────────────────────────────────────────────
useGLTF.preload("/models/la_marzocco_coffee_machine.glb");

function CoffeeGrinderModel({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF("/models/coffee_grinder.glb");
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} position={[0, 0.465, -0.035]} scale={[0.04, 0.04, 0.04]} rotation={[0, Math.PI, 0]} />
    </group>
  );
}

useGLTF.preload("/models/coffee_grinder.glb");

function VinylRecordPlayerModel({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF("/models/vinyl_record_player.glb");
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} position={[-0.093, 0.111, 0.022]} scale={[0.00105, 0.00105, 0.00105]} />
      <pointLight
        position={[0, 0.85, 0.25]}
        color="#FFD6A0"
        intensity={1.4}
        distance={1.7}
        decay={2}
        castShadow={false}
      />
      <spotLight
        position={[-0.25, 1.15, 0.45]}
        target-position={[0, 0.08, 0]}
        color="#FFE2B8"
        intensity={1.1}
        angle={0.42}
        penumbra={0.65}
        distance={2.1}
        decay={2}
        castShadow={false}
      />
    </group>
  );
}

function KettleScaleModel({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF("/models/coffee_scales_and_kettle.glb");
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} position={[1.363, 0, 0.024]} scale={[0.014, 0.014, 0.014]} />
    </group>
  );
}

function ChemexModel({
  position,
  rotation = [0, 0, 0],
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const { scene } = useGLTF("/models/chemex_drip_coffee_brewer.glb");
  const model = useMemo(() => scene.clone(true), [scene]);

  return (
    <group position={position} rotation={rotation}>
      <primitive object={model} position={[0.003, 0, 0]} scale={[1.8, 1.8, 1.8]} />
    </group>
  );
}

useGLTF.preload("/models/vinyl_record_player.glb");
useGLTF.preload("/models/coffee_scales_and_kettle.glb");
useGLTF.preload("/models/chemex_drip_coffee_brewer.glb");


// ─── COFFEE CANISTERS ─────────────────────────────────────────────────────────
function CoffeeCanisters({ position }: { position: [number, number, number] }) {
  const sizes = [
    { r: 0.048, h: 0.20 },
    { r: 0.055, h: 0.24 },
    { r: 0.042, h: 0.18 },
  ];
  const colors = ["#2A2A28", "#3A3A38", "#1E1E1C"];
  return (
    <group position={position}>
      {sizes.map((s, i) => (
        <group key={i} position={[i * 0.13, 0, 0]}>
          {/* Body */}
          <mesh position={[0, s.h / 2, 0]}>
            <cylinderGeometry args={[s.r, s.r * 1.02, s.h, 16]} />
            <meshPhysicalMaterial color={colors[i]} roughness={0.28} metalness={0.72} clearcoat={0.5} clearcoatRoughness={0.08} />
          </mesh>
          {/* Lid */}
          <mesh position={[0, s.h + 0.018, 0]}>
            <cylinderGeometry args={[s.r * 1.04, s.r * 1.04, 0.036, 16]} />
            <meshPhysicalMaterial color="#4A4844" roughness={0.35} metalness={0.65} clearcoat={0.4} clearcoatRoughness={0.1} />
          </mesh>
          {/* Lid knob */}
          <mesh position={[0, s.h + 0.042, 0]}>
            <sphereGeometry args={[0.012, 8, 8]} />
            <meshPhysicalMaterial color="#C8C4C0" roughness={0.2} metalness={0.8} clearcoat={0.6} clearcoatRoughness={0.06} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── BAR TOWEL ROLL ───────────────────────────────────────────────────────────
function BarTowelRoll({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.038, 0.038, 0.09, 12]} />
        <meshStandardMaterial color="#E8E4DC" roughness={0.95} metalness={0} />
      </mesh>
      {/* Stripe detail */}
      {[0, 0.035].map((y, i) => (
        <mesh key={i} position={[0, 0.04 + y, 0]}>
          <torusGeometry args={[0.039, 0.004, 6, 14]} />
          <meshStandardMaterial color={i === 0 ? "#8B5E3C" : "#4A3820"} roughness={0.9} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

// ─── REMAINING EQUIPMENT (scale, rack, knockbox, pitchers, cups, plant, glasses)
function Scale({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.22, 0.025, 0.18]} radius={0.012} smoothness={3}>
        <meshStandardMaterial color="#222220" roughness={0.82} metalness={0.15} />
      </RoundedBox>
      <RoundedBox position={[-0.028, 0.014, -0.02]} args={[0.12, 0.008, 0.09]} radius={0.006} smoothness={3}>
        <meshStandardMaterial color="#0A1A0A" roughness={0.5} metalness={0.1} emissive="#0A200A" emissiveIntensity={0.8} />
      </RoundedBox>
      <mesh position={[0.075, 0.014, 0.05]}>
        <cylinderGeometry args={[0.016, 0.016, 0.01, 10]} />
        <meshStandardMaterial color="#C9A96E" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[0.075, 0.014, 0.02]}>
        <cylinderGeometry args={[0.014, 0.014, 0.01, 10]} />
        <meshStandardMaterial color="#444" roughness={0.6} metalness={0.2} />
      </mesh>
      {[[-0.09, -0.06], [0.09, -0.06], [-0.09, 0.06], [0.09, 0.06]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.015, z]}>
          <cylinderGeometry args={[0.01, 0.01, 0.008, 6]} />
          <meshStandardMaterial color="#111" roughness={0.9} metalness={0} />
        </mesh>
      ))}
      <group position={[0, 0.025, 0]}>
        <mesh>
          <cylinderGeometry args={[0.032, 0.026, 0.048, 12]} />
          <meshStandardMaterial color="#F0EDE8" roughness={0.65} metalness={0} />
        </mesh>
        <mesh position={[0, -0.028, 0]}>
          <cylinderGeometry args={[0.042, 0.042, 0.006, 12]} />
          <meshStandardMaterial color="#E8E4E0" roughness={0.65} metalness={0} />
        </mesh>
      </group>
    </group>
  );
}

function PortafilterRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox position={[0, 0.24, 0]} args={[0.58, 0.03, 0.04]} radius={0.012} smoothness={3}>
        <meshPhysicalMaterial color="#B0A898" roughness={0.42} metalness={0.62} clearcoat={0.3} clearcoatRoughness={0.1} />
      </RoundedBox>
      <RoundedBox position={[0, 0, 0]} args={[0.62, 0.015, 0.12]} radius={0.01} smoothness={3}>
        <meshPhysicalMaterial color="#9A9490" roughness={0.52} metalness={0.58} clearcoat={0.2} clearcoatRoughness={0.12} />
      </RoundedBox>
      {[-0.19, 0, 0.19].map((x, i) => (
        <group key={i} position={[x, 0.22, 0.02]}>
          <mesh>
            <cylinderGeometry args={[0.058, 0.052, 0.026, 14]} />
            <meshPhysicalMaterial color="#7A7670" roughness={0.45} metalness={0.68} clearcoat={0.3} clearcoatRoughness={0.1} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.042, 0.046, 0.025, 12]} />
            <meshPhysicalMaterial color="#686460" roughness={0.45} metalness={0.68} clearcoat={0.3} clearcoatRoughness={0.1} />
          </mesh>
          <mesh position={[-0.065, -0.1, 0]} rotation={[0, 0, 0.4]}>
            <cylinderGeometry args={[0.012, 0.01, 0.22, 8]} />
            <meshStandardMaterial color="#706C68" roughness={0.55} metalness={0.6} />
          </mesh>
          <mesh position={[0.065, -0.1, 0]} rotation={[0, 0, -0.4]}>
            <cylinderGeometry args={[0.012, 0.01, 0.22, 8]} />
            <meshStandardMaterial color="#706C68" roughness={0.55} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Knockbox({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox position={[0, 0.076, 0]} args={[0.28, 0.15, 0.2]} radius={0.025} smoothness={4}>
        <meshStandardMaterial color="#1E1E1C" roughness={0.88} metalness={0.1} />
      </RoundedBox>
      <mesh position={[0, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.25, 8]} />
        <meshStandardMaterial color="#484844" roughness={0.8} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.152, 0]}>
        <boxGeometry args={[0.28, 0.008, 0.2]} />
        <meshStandardMaterial color="#333330" roughness={0.7} metalness={0.2} />
      </mesh>
    </group>
  );
}

function MilkPitchers({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[{ r: 0.052, h: 0.22, y: 0.11 }, { r: 0.065, h: 0.28, y: 0.14 }, { r: 0.042, h: 0.17, y: 0.085 }].map((s, i) => (
        <group key={i} position={[i * 0.16 - 0.16, 0, 0]}>
          <mesh position={[0, s.y, 0]}>
            <cylinderGeometry args={[s.r * 0.85, s.r, s.h, 14]} />
            <meshPhysicalMaterial color="#D4D0CC" roughness={0.16} metalness={0.84} clearcoat={0.6} clearcoatRoughness={0.06} />
          </mesh>
          <mesh position={[s.r + 0.032, s.y * 0.6, 0]}>
            <torusGeometry args={[0.03, 0.007, 8, 10, Math.PI]} />
            <meshPhysicalMaterial color="#C8C4C0" roughness={0.18} metalness={0.82} clearcoat={0.5} clearcoatRoughness={0.08} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CupStack({ position, count = 4 }: { position: [number, number, number]; count?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <group key={i} position={[0, i * 0.065, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.042, 0.034, 0.075, 14]} />
            <meshStandardMaterial color="#EEEAE4" roughness={0.62} metalness={0} />
          </mesh>
          {i === count - 1 && (
            <mesh position={[0.057, 0.052, 0]}>
              <torusGeometry args={[0.022, 0.006, 6, 8, Math.PI]} />
              <meshStandardMaterial color="#E8E4DE" roughness={0.62} metalness={0} />
            </mesh>
          )}
        </group>
      ))}
      <mesh position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.075, 0.065, 0.012, 16]} />
        <meshStandardMaterial color="#E8E4DE" roughness={0.6} metalness={0} />
      </mesh>
    </group>
  );
}
// ─── PENDANT LIGHTS ───────────────────────────────────────────────────────────
const PENDANTS = [
  { x: -3.2, cord: 1.5, r: 0.10, intensity: 3.2 },
  { x: -1.5, cord: 1.0, r: 0.13, intensity: 3.8 },
  { x: 0.2, cord: 1.8, r: 0.09, intensity: 2.9 },
  { x: 1.8, cord: 1.2, r: 0.12, intensity: 3.5 },
  { x: 3.4, cord: 1.4, r: 0.11, intensity: 3.3 },
];

function PendantLights() {
  return (
    <group>
      {PENDANTS.map((p, i) => {
        const ceilY = 4.45;
        const bulbY = ceilY - p.cord - p.r;
        const shadeY = bulbY + p.r * 0.45;
        return (
          <group key={i} position={[p.x, 0, -1.2]}>
            <mesh position={[0, ceilY - p.cord / 2, 0]}>
              <cylinderGeometry args={[0.004, 0.004, p.cord, 4]} />
              <meshStandardMaterial color="#2A1E10" roughness={0.9} metalness={0.1} />
            </mesh>
            <mesh position={[0, ceilY, 0]}>
              <cylinderGeometry args={[0.06, 0.04, 0.05, 10]} />
              <meshStandardMaterial color="#3A2A18" roughness={0.75} metalness={0.2} />
            </mesh>
            <mesh position={[0, shadeY, 0]}>
              <coneGeometry args={[p.r * 2.25, p.r * 1.35, 28, 1, true]} />
              <meshStandardMaterial
                color="#16110D"
                roughness={0.46}
                metalness={0.78}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Warm bulb inside the shade */}
            <mesh position={[0, bulbY, 0]}>
              <sphereGeometry args={[p.r * 0.62, 18, 18]} />
              <meshStandardMaterial
                color="#FFD98A"
                emissive="#FFD060"
                emissiveIntensity={1.7}
                roughness={0.2} metalness={0}
              />
            </mesh>
            <mesh position={[0, bulbY + p.r * 0.18, 0]}>
              <sphereGeometry args={[p.r * 0.66, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
              <meshStandardMaterial
                color="#FFF0C2"
                transparent
                opacity={0.28}
                roughness={0.08}
                depthWrite={false}
              />
            </mesh>
            <pointLight
              position={[0, bulbY - 0.1, 0]}
              color="#FFD07A"
              intensity={p.intensity * 1.15}
              distance={6.0}
              decay={2}
              castShadow={false}
            />
          </group>
        );
      })}
    </group>
  );
}

function InteractiveItems({
  hovered,
  setHovered,
  setActivePopup,
}: {
  hovered: HoverTarget;
  setHovered: (target: HoverTarget) => void;
  setActivePopup: (p: Popup) => void;
}) {
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);

  const onOver = (e: MeshPointerEvent, id: HoverTarget) => { e.stopPropagation(); setHovered(id); };
  const onOut = () => setHovered(null);

  return (
    <group>

      {/* MENU - clipboard, placed left of the Order tablet */}
      <group
        position={[1.8, 1.09, 2.0]}
        rotation={[0, -0.4, 0]}
        onClick={(e) => { e.stopPropagation(); setActivePopup("menu"); }}
        onPointerOver={(e) => onOver(e, "menu")}
        onPointerOut={onOut}
      >
        <RoundedBox position={[0, 0.15, 0]} rotation={[-0.4, 0, 0]} args={[0.3, 0.45, 0.02]} radius={0.025} smoothness={4}>
          <meshStandardMaterial color={hovered === "menu" ? "#D4B895" : "#C4A885"} roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.16, 0.012]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.26, 0.4]} />
          <meshStandardMaterial color="#FDFBF7" roughness={0.9} />
        </mesh>
        <Text position={[0, 0.28, 0.025]} rotation={[-0.4, 0, 0]} font="/fonts/OpenSauceSans-Bold.ttf" fontSize={0.035} color="#333" letterSpacing={0.1}>MENU</Text>
      </group>

      {/* ORDER - POS Tablet */}
      <group
        position={[2.6, 1.09, 2.0]}
        rotation={[0, -0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setActivePopup("order"); }}
        onPointerOver={(e) => onOver(e, "order")}
        onPointerOut={onOut}
      >
        <RoundedBox position={[0, 0.12, 0]} rotation={[-0.5, 0, 0]} args={[0.4, 0.28, 0.02]} radius={0.03} smoothness={5}>
          <meshStandardMaterial color="#111" roughness={0.5} metalness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.12, 0.011]} rotation={[-0.5, 0, 0]}>
          <planeGeometry args={[0.38, 0.26]} />
          <meshBasicMaterial color={hovered === "order" ? "#3A2A18" : "#1A0F08"} />
        </mesh>
        <RoundedBox position={[0, 0.02, -0.05]} args={[0.15, 0.04, 0.15]} radius={0.015} smoothness={3}>
          <meshStandardMaterial color="#222" roughness={0.8} />
        </RoundedBox>
        <Text position={[0, 0.12, 0.012]} rotation={[-0.5, 0, 0]} font="/fonts/OpenSauceSans-Bold.ttf" fontSize={0.04} color="#FFF" letterSpacing={0.1}>TAP TO ORDER</Text>
      </group>
    </group>
  );
}

function CafeEnvironment({
  activePopup,
  hovered,
  setHovered,
  setActivePopup,
}: {
  activePopup: Popup;
  hovered: HoverTarget;
  setHovered: (target: HoverTarget) => void;
  setActivePopup: (p: Popup) => void;
}) {
  const tex = useProceduralTextures();
  const onHover = (e: MeshPointerEvent, target: HoverTarget) => { e.stopPropagation(); setHovered(target); };
  const onHoverOut = () => setHovered(null);

  return (
    <>
      <color attach="background" args={["#1A0F08"]} />
      <fog attach="fog" args={["#221408", 7, 20]} />

      {/* Fill lights */}
      <ambientLight color="#FFE8D0" intensity={0.25} />
      <directionalLight position={[0, 4, 3]} color="#FFF4E8" intensity={0.25} />

      <CameraRig activePopup={activePopup} />

      <Suspense fallback={null}>
        <InteractiveItems hovered={hovered} setHovered={setHovered} setActivePopup={setActivePopup} />
        <Room tex={tex} />
        <BackBar tex={tex} />
        <Counter tex={tex} />
        <PendantLights />

        {/* ── BAR COUNTER — evenly spaced left → right ──────────────────────── */}

        {/* Far-left: record player, cups, and canisters */}
        <group
          onPointerOver={(e) => onHover(e, "vinyl")}
          onPointerOut={onHoverOut}
        >
          <VinylRecordPlayerModel position={[4, 1.09, 1.7]} rotation={[0, 1, 0]} />
          <mesh position={[4, 1.29, 1.7]}>
            <boxGeometry args={[0.66, 0.34, 0.5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
        <CoffeeCanisters position={[1, 1.09, 1.6]} />

        {/* Grinding Station */}
        <ChemexModel position={[-3.42, 1.09, 1.18]} rotation={[0, -0.12, 0]} />
        <ChemexModel position={[-3.08, 1.09, 1.43]} rotation={[0, 0.16, 0]} />
        <KettleScaleModel position={[-2.48, 1.09, 1.2]} rotation={[0, 3, 0]} />
        <CoffeeGrinderModel position={[-1.55, 1.09, 1.2]} rotation={[0, 0.08, 0]} />
        <CoffeeGrinderModel position={[-1, 1.09, 1.2]} rotation={[0, -0.08, 0]} />

        {/* ── ESPRESSO MACHINE — middle ── */}
        <LaMarzocco position={[-0.1, 1.09, 1.55]} />
        <SteamSystem position={[-0.28, 1.28, 1.22]} />

        {/* Milk, cups, and serviceware */}
        <group
          onPointerOver={(e) => onHover(e, "cups")}
          onPointerOut={onHoverOut}
        >
          <MilkPitchers position={[-4.7, 1.09, 1.2]} />
          <CupStack position={[-4.05, 1.09, 1.55]} count={4} />
          <CupStack position={[-3.65, 1.09, 1.55]} count={5} />
          <CupStack position={[-4, 1.09, 1.12]} count={6} />
          <CupStack position={[-4.05, 1.09, 1.2]} count={4} />
          <CupStack position={[-3.9, 1.09, 1.5]} count={3} />
          <CupStack position={[-4, 1.09, 1.45]} count={5} />
          <mesh position={[-4.18, 1.36, 1.36]}>
            <boxGeometry args={[1.06, 0.56, 0.58]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>

      </Suspense>
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const HOVER_OVERLAYS: Record<NonNullable<HoverTarget>, {
  label: string;
  left: string;
  top: string;
  width: number;
  height: number;
}> = {
  menu: { label: "[View Projects]", left: "59%", top: "54%", width: 132, height: 172 },
  order: { label: "[Connect]", left: "67%", top: "55%", width: 150, height: 112 },
  vinyl: { label: "[Now Playing]", left: "78%", top: "52%", width: 168, height: 116 },
  cups: { label: "[Cafe Tools]", left: "11%", top: "53%", width: 188, height: 122 },
};

function HoverOverlay({ target }: { target: HoverTarget }) {
  const [lastTarget, setLastTarget] = useState<NonNullable<HoverTarget>>("menu");

  useEffect(() => {
    if (target) setLastTarget(target);
  }, [target]);

  const cfg = HOVER_OVERLAYS[target ?? lastTarget];
  const active = Boolean(target);

  return (
    <div
      style={{
        position: "absolute",
        left: cfg.left,
        top: cfg.top,
        width: cfg.width,
        height: cfg.height,
        transform: `translate(-50%, -50%) scale(${active ? 1 : 0.94})`,
        opacity: active ? 1 : 0,
        transition: active
          ? "opacity 180ms ease-out, transform 260ms cubic-bezier(0.16, 1, 0.3, 1)"
          : "opacity 180ms ease-out, transform 180ms ease-out",
        pointerEvents: "none",
        zIndex: 70,
      }}
    >
      {(["tl", "tr", "bl", "br"] as const).map((corner) => {
        const vertical = corner.includes("t") ? { top: 0 } : { bottom: 0 };
        const horizontal = corner.includes("l") ? { left: 0 } : { right: 0 };
        const xOffset = corner.includes("l") ? 0 : -34;
        const yOffset = corner.includes("t") ? 0 : -34;

        return (
          <div key={corner} style={{ position: "absolute", ...vertical, ...horizontal }}>
            <span
              style={{
                position: "absolute",
                width: 34,
                height: 1,
                background: "#E8E1D6",
                transform: `translateX(${xOffset}px)`,
              }}
            />
            <span
              style={{
                position: "absolute",
                width: 1,
                height: 34,
                background: "#E8E1D6",
                transform: `translateY(${yOffset}px)`,
              }}
            />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          right: -8,
          bottom: -26,
          color: "#FFFFFF",
          fontFamily: "'OpenSauceSans', sans-serif",
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.02em",
          textShadow: "0 1px 6px rgba(0,0,0,0.85)",
          whiteSpace: "nowrap",
        }}
      >
        {cfg.label}
      </div>
    </div>
  );
}

export default function Scene3D() {
  const [activePopup, setActivePopup] = useState<Popup>(null);
  const [hoveredTarget, setHoveredTarget] = useState<HoverTarget>(null);
  const [caseStudySlug, setCaseStudySlug] = useState<string | null>(null);

  const openPopup = useCallback((p: Popup) => setActivePopup(p), []);
  const closePopup = useCallback(() => setActivePopup(null), []);
  const openCaseStudy = useCallback((slug: string) => { setActivePopup(null); setCaseStudySlug(slug); }, []);
  const closeCaseStudy = useCallback(() => setCaseStudySlug(null), []);

  return (
    <div style={{ position: "fixed", inset: 0 }}>
      {/* Navigation Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        background: '#000000',
        fontFamily: "'OpenSauceSans', sans-serif",
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontSize: '0.65rem'
      }}>
        <div style={{ color: '#F2EDE6', fontSize: '1.4rem', fontFamily: "'Nirakolu', serif", textTransform: 'none', letterSpacing: '2px' }}>
          pacey diep
        </div>
        <div style={{ display: 'flex', gap: '40px' }}>
          <button
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', transition: 'color 0.2s' }}
            onClick={() => openPopup('about')}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F2EDE6'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
          >
            About
          </button>
          <button
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', transition: 'color 0.2s' }}
            onClick={() => openPopup('menu')}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F2EDE6'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
          >
            Projects
          </button>
          <button
            style={{ background: 'none', border: 'none', color: '#FFFFFF', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 'inherit', textTransform: 'inherit', transition: 'color 0.2s' }}
            onClick={() => openPopup('order')}
            onMouseEnter={(e) => e.currentTarget.style.color = '#F2EDE6'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#FFFFFF'}
          >
            Connect
          </button>
        </div>
      </div>

      <Canvas
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.62, 8.5], fov: 66, near: 0.1, far: 50 }}
        style={{ position: "absolute", inset: 0 }}
      >
        <CafeEnvironment
          activePopup={activePopup}
          hovered={hoveredTarget}
          setHovered={setHoveredTarget}
          setActivePopup={setActivePopup}
        />
      </Canvas>

      <HoverOverlay target={hoveredTarget} />

      <MenuPopup isOpen={activePopup === "menu"} onClose={closePopup} onProjectClick={openCaseStudy} />
      <AboutPopup isOpen={activePopup === "about"} onClose={closePopup} />
      <OrderPopup isOpen={activePopup === "order"} onClose={closePopup} />
      <CaseStudy slug={caseStudySlug} onClose={closeCaseStudy} />
    </div>
  );
}

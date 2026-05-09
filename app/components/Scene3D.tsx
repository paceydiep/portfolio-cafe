"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  MeshReflectorMaterial, ContactShadows, Environment, Text,
} from "@react-three/drei";
import {
  EffectComposer, Bloom, DepthOfField, Noise, Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import {
  useRef, useEffect, useState, useCallback, Suspense, useMemo,
} from "react";
import * as THREE from "three";
import gsap from "gsap";
import MenuPopup from "./MenuPopup";
import AboutPopup from "./AboutPopup";
import OrderPopup from "./OrderPopup";
import CaseStudy from "./CaseStudy";

type Popup = "menu" | "about" | "order" | null;

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
  const N = 14;
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
    z: 8.5,
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
    if (!activePopup || activePopup === "about") {
      gsap.to(proxy.current, {
        baseX: 0, baseY: 1.62, z: 5.2,
        lookX: 0, lookY: 0.82, lookZ: 0,
        duration: 2.0, ease: "power3.inOut"
      });
    } else if (activePopup === "menu") {
      gsap.to(proxy.current, {
        baseX: -3.2, baseY: 1.45, z: 2.8,
        lookX: -3.2, lookY: 1.1, lookZ: 1.8,
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
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const initPosRef = useRef<Float32Array | null>(null);

  useFrame(({ clock }) => {
    if (!geoRef.current) return;
    const t = clock.elapsedTime;
    const posAttribute = geoRef.current.attributes.position;

    if (!initPosRef.current) {
      initPosRef.current = new Float32Array(posAttribute.array);
    }
    const initPos = initPosRef.current;

    for (let i = 0; i < posAttribute.count; i++) {
      const x = initPos[i * 3];
      const y = initPos[i * 3 + 1];
      const z = initPos[i * 3 + 2];

      // normalize y to [0, 1] for increasing sway at bottom
      const yNorm = (height / 2 - y) / height;

      // softer folds based on x
      const folds = Math.sin(x * 12) * 0.025;

      // very subtle wind sway
      const sway = Math.sin(t * 1.2 + y * 1.5) * 0.03 * yNorm + Math.sin(t * 0.8 + x * 2) * 0.01 * yNorm;

      posAttribute.setZ(i, z + folds + sway);
    }
    posAttribute.needsUpdate = true;
    geoRef.current.computeVertexNormals();
  });

  return (
    <mesh position={position}>
      <planeGeometry ref={geoRef} args={[width, height, 32, 32]} />
      <meshStandardMaterial color="#EAE6DF" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function WindowWithCurtains({ position, rotation }: { position: [number, number, number], rotation: [number, number, number] }) {
  const width = 4.0;
  const height = 6.0;

  // Crittall window grid (dividers)
  const cols = 5;
  const rows = 8;
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

      {/* Curtains */}
      <Curtain position={[-1.7, -0.2, 0.15]} height={6.2} width={1.8} />
      <Curtain position={[1.7, -0.2, 0.15]} height={6.2} width={1.8} />

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
        <MeshReflectorMaterial
          map={tex?.hardwood ?? null}
          normalMap={tex?.normalHardwood ?? null}
          normalScale={new THREE.Vector2(0.5, 0.5)}
          color="#EAE0D0"
          roughness={0.65}
          metalness={0.05}
          mirror={0.15}
          blur={[50, 30]}
          resolution={512}
          mixBlur={1.0}
          mixStrength={0.5}
          depthScale={0.8}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.2}
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
      <mesh position={[0, 0.58, -3.2]}>
        <boxGeometry args={[13, 1.16, 0.72]} />
        <meshStandardMaterial color="#786450" roughness={0.82} metalness={0.08} />
      </mesh>
      <mesh position={[0, 1.19, -3.16]}>
        <boxGeometry args={[13.1, 0.06, 0.78]} />
        <meshStandardMaterial color="#D0C8C0" roughness={0.35} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.58, -2.85]}>
        <boxGeometry args={[13, 1.12, 0.04]} />
        <meshStandardMaterial color="#6A5840" roughness={0.85} metalness={0.05} />
      </mesh>

      {/* Shelves — wood grain */}
      {[2.25, 3.1].map((y, i) => (
        <mesh key={i} position={[0, y, -3.3]}>
          <boxGeometry args={[12, 0.05, 0.42]} />
          <meshStandardMaterial
            map={tex?.wood ?? null}
            color="#9A8060"
            roughness={0.52} metalness={0.18}
          />
        </mesh>
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

      {/* Mug rail */}
      <mesh position={[0, 1.72, -2.88]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.015, 0.015, 12.5, 8]} />
        <meshStandardMaterial color="#9A8060" roughness={0.5} metalness={0.4} />
      </mesh>
      {[-5.5, -4.5, -3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((x, i) => (
        <HangingMug key={i} position={[x, 1.72, -2.88]} />
      ))}
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
          <mesh>
            <boxGeometry args={[0.32, 0.52, 0.15]} />
            <meshStandardMaterial color={col} roughness={0.9} metalness={0} />
          </mesh>
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
        <mesh key={i} position={[2.5 + i * 0.45, 2.52, -3.26]}>
          <boxGeometry args={[0.32, 0.52, 0.15]} />
          <meshStandardMaterial color={col} roughness={0.9} metalness={0} />
        </mesh>
      ))}

      {/* Framed print */}
      <group position={[4.5, 2.65, -3.92]}>
        <mesh>
          <boxGeometry args={[0.9, 1.12, 0.05]} />
          <meshStandardMaterial color="#5A4838" roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.80, 1.02, 0.01]} />
          <meshStandardMaterial color="#F0EDE6" roughness={1} metalness={0} />
        </mesh>
        {/* Botanical line detail */}
        {[
          { pos: [0, -0.1, 0.04] as [number, number, number], rot: [0, 0, 0] as [number, number, number], size: [0.005, 0.5, 0.005] as [number, number, number] },
          { pos: [-0.1, 0.05, 0.04] as [number, number, number], rot: [0, 0, 0.3] as [number, number, number], size: [0.005, 0.3, 0.005] as [number, number, number] },
          { pos: [0.1, 0.05, 0.04] as [number, number, number], rot: [0, 0, -0.3] as [number, number, number], size: [0.005, 0.28, 0.005] as [number, number, number] },
        ].map((l, i) => (
          <mesh key={i} position={l.pos} rotation={l.rot}>
            <boxGeometry args={l.size} />
            <meshStandardMaterial color="#5A4838" roughness={1} metalness={0} />
          </mesh>
        ))}
      </group>

      {/* Syrup/ingredient bottles — extended row */}
      {[0, 0.26, 0.52, 0.78, 1.04, 1.30, 1.56, 1.82, 2.08].map((dx, i) => (
        <group key={i} position={[-5.2 + dx, 1.52, -3.26]}>
          <mesh>
            <cylinderGeometry args={[0.044, 0.05, i % 3 === 0 ? 0.50 : i % 3 === 1 ? 0.38 : 0.44, 10]} />
            <meshPhysicalMaterial
              color={`hsl(${20 + i * 18}, 48%, ${48 + (i % 4) * 7}%)`}
              roughness={0.06}
              metalness={0}
              transmission={0.70}
              transparent
              ior={1.46}
              thickness={0.14}
            />
          </mesh>
          {/* Pump cap */}
          <mesh position={[0, i % 3 === 0 ? 0.28 : i % 3 === 1 ? 0.22 : 0.25, 0]}>
            <cylinderGeometry args={[0.018, 0.022, 0.04, 8]} />
            <meshStandardMaterial color="#2A2A2A" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, i % 3 === 0 ? 0.32 : i % 3 === 1 ? 0.26 : 0.29, 0]}>
            <cylinderGeometry args={[0.006, 0.006, 0.06, 6]} />
            <meshStandardMaterial color="#555" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Glass jars — wider spread */}
      {[-3.2, -2.5, -1.8, -1.1, -0.4].map((x, i) => (
        <group key={i} position={[x, 1.58, -3.28]}>
          <mesh>
            <cylinderGeometry args={[0.076 + (i % 2) * 0.01, 0.072 + (i % 2) * 0.01, 0.38 + (i % 3) * 0.06, 12]} />
            <meshPhysicalMaterial
              color={i % 2 === 0 ? "#C8D4C0" : "#D4CCC0"}
              roughness={0.04}
              metalness={0}
              transmission={0.82}
              transparent
              ior={1.52}
              thickness={0.1}
            />
          </mesh>
          {/* Lid */}
          <mesh position={[0, 0.21 + (i % 3) * 0.03, 0]}>
            <cylinderGeometry args={[0.082 + (i % 2) * 0.01, 0.082 + (i % 2) * 0.01, 0.032, 12]} />
            <meshStandardMaterial color={i % 2 === 0 ? "#9A8860" : "#7A6848"} roughness={0.4} metalness={0.5} />
          </mesh>
          {/* Content fill (visible through glass) */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.064 + (i % 2) * 0.008, 0.060 + (i % 2) * 0.008, 0.28 + (i % 3) * 0.04, 10]} />
            <meshStandardMaterial
              color={["#8B5E3C", "#F5DEB3", "#3C2010", "#C8A870", "#6B4423"][i]}
              roughness={0.9} metalness={0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function HangingMug({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, -0.04, 0.06]}>
        <torusGeometry args={[0.025, 0.006, 6, 8, Math.PI]} />
        <meshStandardMaterial color="#9A8060" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, -0.12, 0.06]}>
        <cylinderGeometry args={[0.065, 0.055, 0.12, 12]} />
        <meshStandardMaterial color="#F0ECE6" roughness={0.5} metalness={0.02} />
      </mesh>
      <mesh position={[0.085, -0.12, 0.06]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.03, 0.009, 6, 8, Math.PI]} />
        <meshStandardMaterial color="#EEE8E2" roughness={0.5} metalness={0.02} />
      </mesh>
    </group>
  );
}

// ─── COUNTER ──────────────────────────────────────────────────────────────────
function Counter({ tex }: { tex: Textures }) {
  return (
    <group>
      <mesh position={[0, 0.5, 1.7]}>
        <boxGeometry args={[11.5, 1.0, 1.3]} />
        <meshStandardMaterial color="#C0B8B0" roughness={0.72} metalness={0.06} />
      </mesh>
      {/* Front panel detail */}
      <mesh position={[0, 0.5, 2.351]}>
        <planeGeometry args={[11.48, 0.98]} />
        <meshStandardMaterial color="#B0A8A0" roughness={0.78} metalness={0.04} />
      </mesh>
      {/* Marble top with texture + normal map */}
      <mesh position={[0, 1.045, 1.68]}>
        <boxGeometry args={[11.7, 0.09, 1.45]} />
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
      </mesh>
      {/* Edge highlight */}
      <mesh position={[0, 1.09, 2.36]}>
        <boxGeometry args={[11.72, 0.02, 0.04]} />
        <meshStandardMaterial color="#F2EDE6" roughness={0.15} metalness={0.1} />
      </mesh>
      {/* Black Plinth Base - Slightly larger to prevent Z-fighting */}
      <mesh position={[0, 0.02, 1.7]}>
        <boxGeometry args={[11.54, 0.04, 1.34]} />
        <meshStandardMaterial color="#1A1208" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

// ─── LA MARZOCCO LINEA ────────────────────────────────────────────────────────
// All metal surfaces upgraded to MeshPhysicalMaterial with clearcoat
function LaMarzocco({ position }: { position: [number, number, number] }) {
  // Reusable physical materials
  const body = { color: "#D0CCCA", roughness: 0.18, metalness: 0.88, clearcoat: 0.7, clearcoatRoughness: 0.08 };
  const bodyDark = { color: "#9A9694", roughness: 0.32, metalness: 0.78, clearcoat: 0.4, clearcoatRoughness: 0.12 };
  const chrome = { color: "#E2DEDE", roughness: 0.06, metalness: 0.96, clearcoat: 1.0, clearcoatRoughness: 0.04 };

  return (
    <group position={position}>
      {/* Main body */}
      <mesh position={[0, 0.26, 0]}>
        <boxGeometry args={[1.22, 0.48, 0.44]} />
        <meshPhysicalMaterial {...body} />
      </mesh>
      <mesh position={[0, 0.26, 0.225]}>
        <boxGeometry args={[1.1, 0.42, 0.01]} />
        <meshPhysicalMaterial {...bodyDark} />
      </mesh>
      <mesh position={[0, 0.505, 0]}>
        <boxGeometry args={[1.22, 0.02, 0.44]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>

      {/* Boiler humps */}
      {([-0.22, 0.22] as const).map((x, i) => (
        <group key={i} position={[x, 0.58, 0]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.14, 0.14, 20]} />
            <meshPhysicalMaterial {...body} />
          </mesh>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.04, 10]} />
            <meshPhysicalMaterial {...chrome} />
          </mesh>
        </group>
      ))}

      {/* End panels */}
      {([-0.63, 0.63] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.26, 0]}>
          <boxGeometry args={[0.07, 0.52, 0.46]} />
          <meshPhysicalMaterial {...body} />
        </mesh>
      ))}

      {/* Group heads */}
      {([-0.28, 0.28] as const).map((x, i) => (
        <group key={i} position={[x, 0.08, 0.12]}>
          <mesh>
            <cylinderGeometry args={[0.12, 0.12, 0.06, 20]} />
            <meshPhysicalMaterial {...bodyDark} />
          </mesh>
          <mesh position={[0, -0.04, 0]}>
            <cylinderGeometry args={[0.098, 0.098, 0.018, 18]} />
            <meshPhysicalMaterial color="#7A7874" roughness={0.45} metalness={0.72} clearcoat={0.3} clearcoatRoughness={0.1} />
          </mesh>
          <mesh position={[0, -0.07, 0]}>
            <cylinderGeometry args={[0.08, 0.1, 0.03, 14]} />
            <meshPhysicalMaterial color="#888480" roughness={0.4} metalness={0.72} clearcoat={0.3} clearcoatRoughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Portafilters */}
      {([-0.28, 0.28] as const).map((x, i) => (
        <group key={i} position={[x, -0.04, 0.12]}>
          <mesh position={[0, -0.08, 0]} rotation={[0.55, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.022, 0.34, 10]} />
            <meshPhysicalMaterial color="#706C68" roughness={0.5} metalness={0.65} clearcoat={0.2} clearcoatRoughness={0.15} />
          </mesh>
          <mesh position={[0, -0.14, 0.1]}>
            <cylinderGeometry args={[0.065, 0.055, 0.03, 14]} />
            <meshPhysicalMaterial color="#686460" roughness={0.45} metalness={0.68} clearcoat={0.2} clearcoatRoughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* Paddle levers */}
      {([-0.28, 0.28] as const).map((x, i) => (
        <group key={i} position={[x, 0.32, 0.23]}>
          <mesh>
            <boxGeometry args={[0.16, 0.06, 0.028]} />
            <meshPhysicalMaterial {...bodyDark} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.06, 8]} />
            <meshPhysicalMaterial {...chrome} />
          </mesh>
        </group>
      ))}

      {/* Pressure gauge */}
      <group position={[0, 0.36, 0.226]}>
        <mesh>
          <cylinderGeometry args={[0.07, 0.07, 0.016, 18]} />
          <meshPhysicalMaterial color="#D4D0CC" roughness={0.28} metalness={0.72} clearcoat={0.5} clearcoatRoughness={0.08} />
        </mesh>
        <mesh position={[0, 0.012, 0]}>
          <cylinderGeometry args={[0.055, 0.055, 0.006, 16]} />
          <meshPhysicalMaterial color="#F0ECE8" roughness={0.7} metalness={0.02} clearcoat={0.2} clearcoatRoughness={0.1} />
        </mesh>
      </group>

      {/* Logo */}
      <Text
        position={[0, 0.14, 0.228]}
        fontSize={0.028}
        color="#9A9490"
        letterSpacing={0.18}
        anchorX="center"
        anchorY="middle"
      >
        LA MARZOCCO
      </Text>

      {/* Steam wands */}
      {([-1, 1] as const).map((side, i) => (
        <group key={i} position={[side * 0.63, 0.28, 0.05]}>
          <mesh rotation={[0.45, 0, side * 0.25]}>
            <cylinderGeometry args={[0.014, 0.012, 0.4, 8]} />
            <meshPhysicalMaterial {...chrome} />
          </mesh>
          <mesh position={[side * 0.08, -0.18, 0.12]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshPhysicalMaterial color="#C8C4C0" roughness={0.25} metalness={0.82} clearcoat={0.5} clearcoatRoughness={0.1} />
          </mesh>
          <mesh position={[0, 0.1, 0.08]}>
            <cylinderGeometry args={[0.032, 0.028, 0.06, 10]} />
            <meshPhysicalMaterial color="#B0A898" roughness={0.5} metalness={0.52} clearcoat={0.3} clearcoatRoughness={0.12} />
          </mesh>
        </group>
      ))}

      {/* Drip tray */}
      <mesh position={[0, -0.04, 0.1]}>
        <boxGeometry args={[1.18, 0.03, 0.38]} />
        <meshPhysicalMaterial color="#9A9898" roughness={0.38} metalness={0.72} clearcoat={0.4} clearcoatRoughness={0.1} />
      </mesh>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} position={[-0.5 + i * 0.091, -0.016, 0.1]}>
          <boxGeometry args={[0.018, 0.02, 0.33]} />
          <meshPhysicalMaterial color="#707070" roughness={0.35} metalness={0.78} clearcoat={0.3} clearcoatRoughness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// ─── NICHE ZERO ───────────────────────────────────────────────────────────────
function NicheZero({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.26, 0.14, 0.26]} />
        <meshStandardMaterial color="#1E1E1C" roughness={0.88} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[0.23, 0.5, 0.23]} />
        <meshStandardMaterial color="#1E1E1C" roughness={0.88} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.645, 0]}>
        <cylinderGeometry args={[0.115, 0.1, 0.04, 18]} />
        <meshPhysicalMaterial color="#9A9694" roughness={0.32} metalness={0.78} clearcoat={0.4} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0.78, 0]}>
        <coneGeometry args={[0.1, 0.22, 16]} />
        <meshStandardMaterial color="#2A2A28" roughness={0.85} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.895, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.01, 16]} />
        <meshStandardMaterial color="#3A3A38" roughness={0.8} metalness={0.2} />
      </mesh>
      <mesh position={[0.12, 0.44, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.012, 12]} />
        <meshStandardMaterial color="#C9A96E" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0.12, 0.38, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.01, 10]} />
        <meshStandardMaterial color="#444" roughness={0.7} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.19, 0.1]}>
        <boxGeometry args={[0.16, 0.06, 0.08]} />
        <meshStandardMaterial color="#222" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
}

// ─── EK43 ─────────────────────────────────────────────────────────────────────
function EK43({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.34, 0.1, 0.34]} />
        <meshPhysicalMaterial color="#C8C4BE" roughness={0.42} metalness={0.58} clearcoat={0.3} clearcoatRoughness={0.12} />
      </mesh>
      <mesh position={[0, 0.44, 0]}>
        <boxGeometry args={[0.3, 0.68, 0.3]} />
        <meshPhysicalMaterial color="#CCCAC4" roughness={0.36} metalness={0.60} clearcoat={0.35} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[-0.151, 0.44, 0]}>
        <boxGeometry args={[0.008, 0.68, 0.3]} />
        <meshPhysicalMaterial color="#D8D4D0" roughness={0.18} metalness={0.72} clearcoat={0.5} clearcoatRoughness={0.06} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.14, 0.13, 0.04, 18]} />
        <meshPhysicalMaterial color="#B8B4B0" roughness={0.32} metalness={0.68} clearcoat={0.4} clearcoatRoughness={0.08} />
      </mesh>
      {/* Glass hopper — transmission for realism */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 0.46, 18]} />
        <meshPhysicalMaterial
          color="#C8D4DC"
          roughness={0.02}
          metalness={0}
          transmission={0.88}
          transparent
          ior={1.52}
          thickness={0.3}
          envMapIntensity={1.5}
        />
      </mesh>
      <mesh position={[0, 1.29, 0]}>
        <cylinderGeometry args={[0.225, 0.225, 0.02, 16]} />
        <meshPhysicalMaterial color="#B8B4B0" roughness={0.32} metalness={0.62} clearcoat={0.4} clearcoatRoughness={0.08} />
      </mesh>
      <mesh position={[0, 0.3, 0.155]}>
        <cylinderGeometry args={[0.03, 0.03, 0.025, 12]} />
        <meshPhysicalMaterial color="#C0BCB8" roughness={0.28} metalness={0.72} clearcoat={0.5} clearcoatRoughness={0.06} />
      </mesh>
      <mesh position={[0, 0.18, 0.16]}>
        <boxGeometry args={[0.12, 0.06, 0.04]} />
        <meshPhysicalMaterial color="#AAA8A4" roughness={0.45} metalness={0.58} clearcoat={0.2} clearcoatRoughness={0.12} />
      </mesh>
    </group>
  );
}

// ─── TAMPING STATION ──────────────────────────────────────────────────────────
function TampingStation({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tamping mat */}
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.28, 0.01, 0.20]} />
        <meshStandardMaterial color="#2A2A28" roughness={0.95} metalness={0} />
      </mesh>
      {/* Mat rim */}
      <mesh position={[0, 0.008, 0]}>
        <boxGeometry args={[0.30, 0.006, 0.22]} />
        <meshStandardMaterial color="#1A1A18" roughness={0.9} metalness={0.05} />
      </mesh>
      {/* Tamper body */}
      <mesh position={[0.06, 0.085, 0.04]}>
        <cylinderGeometry args={[0.028, 0.03, 0.11, 14]} />
        <meshPhysicalMaterial color="#D0CCCA" roughness={0.18} metalness={0.88} clearcoat={0.7} clearcoatRoughness={0.08} />
      </mesh>
      {/* Tamper base */}
      <mesh position={[0.06, 0.024, 0.04]}>
        <cylinderGeometry args={[0.032, 0.028, 0.015, 14]} />
        <meshPhysicalMaterial color="#C4C0BC" roughness={0.22} metalness={0.82} clearcoat={0.5} clearcoatRoughness={0.1} />
      </mesh>
      {/* Distribution tool */}
      <mesh position={[-0.07, 0.055, -0.03]}>
        <cylinderGeometry args={[0.022, 0.028, 0.07, 12]} />
        <meshPhysicalMaterial color="#9A9490" roughness={0.32} metalness={0.72} clearcoat={0.4} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[-0.07, 0.018, -0.03]}>
        <cylinderGeometry args={[0.03, 0.03, 0.012, 12]} />
        <meshStandardMaterial color="#7A7470" roughness={0.45} metalness={0.6} />
      </mesh>
    </group>
  );
}

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

// ─── SYRUP RACK ───────────────────────────────────────────────────────────────
function SyrupRack({ position }: { position: [number, number, number] }) {
  const syrupColors = [
    "#8B2020", // raspberry
    "#4A1A6A", // lavender
    "#1A3A2A", // matcha
    "#7A4A10", // caramel
    "#3A1A0A", // chocolate
  ];
  return (
    <group position={position}>
      {/* Rack base rail */}
      <mesh position={[0, 0.01, 0]}>
        <boxGeometry args={[0.72, 0.018, 0.12]} />
        <meshStandardMaterial color="#7A6848" roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Back rail */}
      <mesh position={[0, 0.22, -0.05]}>
        <boxGeometry args={[0.72, 0.016, 0.016]} />
        <meshStandardMaterial color="#7A6848" roughness={0.55} metalness={0.3} />
      </mesh>
      {/* Side uprights */}
      {([-0.35, 0.35] as const).map((x, i) => (
        <mesh key={i} position={[x, 0.12, -0.05]}>
          <boxGeometry args={[0.016, 0.24, 0.016]} />
          <meshStandardMaterial color="#7A6848" roughness={0.55} metalness={0.3} />
        </mesh>
      ))}
      {/* Syrup bottles on rack */}
      {syrupColors.map((col, i) => (
        <group key={i} position={[-0.28 + i * 0.14, 0.14, 0]}>
          <mesh>
            <cylinderGeometry args={[0.038, 0.042, 0.26, 10]} />
            <meshPhysicalMaterial
              color={col}
              roughness={0.08} metalness={0} transmission={0.55} transparent ior={1.46} thickness={0.18}
            />
          </mesh>
          {/* Pump */}
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.014, 0.018, 0.038, 8]} />
            <meshStandardMaterial color="#1A1A1A" roughness={0.6} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.20, 0]}>
            <cylinderGeometry args={[0.005, 0.005, 0.055, 6]} />
            <meshStandardMaterial color="#555" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── V60 POUR-OVER STAND ──────────────────────────────────────────────────────
function V60Stand({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Wooden base */}
      <mesh position={[0, 0.025, 0]}>
        <boxGeometry args={[0.22, 0.05, 0.22]} />
        <meshStandardMaterial color="#8A6840" roughness={0.72} metalness={0.05} />
      </mesh>
      {/* Four legs */}
      {([[-0.08, -0.08], [0.08, -0.08], [-0.08, 0.08], [0.08, 0.08]] as const).map(([x, z], i) => (
        <mesh key={i} position={[x, 0.11, z]}>
          <cylinderGeometry args={[0.008, 0.008, 0.22, 8]} />
          <meshStandardMaterial color="#5A3E28" roughness={0.8} metalness={0.1} />
        </mesh>
      ))}
      {/* Cross-ring */}
      <mesh position={[0, 0.22, 0]}>
        <torusGeometry args={[0.085, 0.007, 8, 20]} />
        <meshStandardMaterial color="#5A3E28" roughness={0.75} metalness={0.1} />
      </mesh>
      {/* V60 dripper body (cone) */}
      <mesh position={[0, 0.30, 0]}>
        <coneGeometry args={[0.075, 0.14, 16, 1, true]} />
        <meshPhysicalMaterial color="#D4CFC8" roughness={0.05} metalness={0} transmission={0.88} transparent ior={1.52} thickness={0.05} />
      </mesh>
      {/* Dripper lip */}
      <mesh position={[0, 0.37, 0]}>
        <torusGeometry args={[0.075, 0.006, 8, 18]} />
        <meshStandardMaterial color="#C8C4C0" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Paper filter silhouette */}
      <mesh position={[0, 0.295, 0]}>
        <coneGeometry args={[0.068, 0.12, 14, 1, true]} />
        <meshStandardMaterial color="#F5F0E8" roughness={0.95} metalness={0} side={2} />
      </mesh>
      {/* Server / glass carafe below */}
      <mesh position={[0, 0.085, 0]}>
        <cylinderGeometry args={[0.055, 0.065, 0.13, 14]} />
        <meshPhysicalMaterial color="#C8D4DC" roughness={0.04} metalness={0} transmission={0.90} transparent ior={1.52} thickness={0.08} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.092, 0.09, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.03, 0.005, 6, 10, Math.PI]} />
        <meshStandardMaterial color="#9A8060" roughness={0.5} metalness={0.3} />
      </mesh>
    </group>
  );
}

// ─── CHEMEX ───────────────────────────────────────────────────────────────────
function Chemex({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Bottom carafe (wide) */}
      <mesh position={[0, 0.115, 0]}>
        <cylinderGeometry args={[0.078, 0.092, 0.23, 16]} />
        <meshPhysicalMaterial color="#C8D4DC" roughness={0.03} metalness={0} transmission={0.92} transparent ior={1.52} thickness={0.1} />
      </mesh>
      {/* Waist/neck */}
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.028, 0.078, 0.07, 14]} />
        <meshPhysicalMaterial color="#C8D4DC" roughness={0.03} metalness={0} transmission={0.92} transparent ior={1.52} thickness={0.08} />
      </mesh>
      {/* Wooden collar */}
      <mesh position={[0, 0.265, 0]}>
        <torusGeometry args={[0.052, 0.018, 10, 22]} />
        <meshStandardMaterial color="#8A6840" roughness={0.72} metalness={0.05} />
      </mesh>
      {/* Leather tie */}
      <mesh position={[0.052, 0.265, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.004, 0.004, 0.032, 6]} />
        <meshStandardMaterial color="#4A3020" roughness={0.9} metalness={0} />
      </mesh>
      {/* Top funnel */}
      <mesh position={[0, 0.335, 0]}>
        <cylinderGeometry args={[0.068, 0.028, 0.14, 14]} />
        <meshPhysicalMaterial color="#C8D4DC" roughness={0.03} metalness={0} transmission={0.92} transparent ior={1.52} thickness={0.06} />
      </mesh>
      {/* Paper filter */}
      <mesh position={[0, 0.345, 0]}>
        <coneGeometry args={[0.062, 0.10, 14, 1, true]} />
        <meshStandardMaterial color="#F5F0E8" roughness={0.95} metalness={0} side={2} />
      </mesh>
    </group>
  );
}

// ─── GOOSENECK KETTLE ─────────────────────────────────────────────────────────
function GooseneckKettle({ position }: { position: [number, number, number] }) {
  const chrome = { color: "#D8D4D0" as const, roughness: 0.14, metalness: 0.90, clearcoat: 0.8 as number, clearcoatRoughness: 0.06 as number };
  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.068, 0.072, 0.26, 16]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Base disc */}
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.076, 0.076, 0.01, 16]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Lid */}
      <mesh position={[0, 0.265, 0]}>
        <cylinderGeometry args={[0.065, 0.068, 0.022, 16]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Lid knob */}
      <mesh position={[0, 0.284, 0]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Gooseneck spout — approximated with two cylinders + sphere joint */}
      <mesh position={[0.07, 0.22, 0]} rotation={[0, 0, -0.7]}>
        <cylinderGeometry args={[0.012, 0.012, 0.12, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      <mesh position={[0.145, 0.13, 0]} rotation={[0, 0, 0.65]}>
        <cylinderGeometry args={[0.010, 0.012, 0.13, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      <mesh position={[0.168, 0.19, 0]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
      {/* Handle (far side) */}
      <mesh position={[-0.10, 0.15, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.058, 0.009, 8, 14, Math.PI]} />
        <meshPhysicalMaterial {...chrome} />
      </mesh>
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
      <mesh>
        <boxGeometry args={[0.22, 0.025, 0.18]} />
        <meshStandardMaterial color="#222220" roughness={0.82} metalness={0.15} />
      </mesh>
      <mesh position={[-0.028, 0.014, -0.02]}>
        <boxGeometry args={[0.12, 0.008, 0.09]} />
        <meshStandardMaterial color="#0A1A0A" roughness={0.5} metalness={0.1} emissive="#0A200A" emissiveIntensity={0.8} />
      </mesh>
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
      <mesh position={[0, 0.24, 0]}>
        <boxGeometry args={[0.58, 0.03, 0.04]} />
        <meshPhysicalMaterial color="#B0A898" roughness={0.42} metalness={0.62} clearcoat={0.3} clearcoatRoughness={0.1} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.62, 0.015, 0.12]} />
        <meshPhysicalMaterial color="#9A9490" roughness={0.52} metalness={0.58} clearcoat={0.2} clearcoatRoughness={0.12} />
      </mesh>
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
      <mesh position={[0, 0.076, 0]}>
        <boxGeometry args={[0.28, 0.15, 0.2]} />
        <meshStandardMaterial color="#1E1E1C" roughness={0.88} metalness={0.1} />
      </mesh>
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

function SmallPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.065, 0.052, 0.14, 12]} />
        <meshStandardMaterial color="#8B6E50" roughness={0.85} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.142, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.01, 12]} />
        <meshStandardMaterial color="#3A2A18" roughness={0.95} metalness={0} />
      </mesh>
      {[0, 0.7, 1.5, 2.3, 3.1, 3.8].map((rot, i) => (
        <mesh key={i}
          position={[Math.sin(rot) * 0.04, 0.24 + i * 0.02, Math.cos(rot) * 0.04]}
          rotation={[0.2 + i * 0.06, rot, 0.1]}
        >
          <planeGeometry args={[0.06 + (i % 3) * 0.02, 0.18 + (i % 2) * 0.04]} />
          <meshStandardMaterial
            color={`hsl(${100 + i * 5}, ${38 + i * 3}%, ${28 + i * 2}%)`}
            roughness={0.85} metalness={0} side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function WaterGlasses({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 0.1].map((x, i) => (
        <mesh key={i} position={[x, 0.09, 0]}>
          <cylinderGeometry args={[0.028, 0.024, 0.18, 12]} />
          <meshPhysicalMaterial
            color="#C8D8E0" roughness={0.04} metalness={0}
            transmission={0.9} transparent ior={1.52} thickness={0.08}
          />
        </mesh>
      ))}
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
  const refs = useRef<THREE.Mesh[]>([]);
  useFrame(() => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.rotation.z = Math.sin(Date.now() * 0.0004 + i * 1.2) * 0.012;
    });
  });

  return (
    <group>
      {PENDANTS.map((p, i) => {
        const ceilY = 4.45;
        const bulbY = ceilY - p.cord - p.r;
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
            {/* Bulb — high emissive so Bloom picks it up */}
            <mesh ref={(el) => { if (el) refs.current[i] = el; }} position={[0, bulbY, 0]}>
              <sphereGeometry args={[p.r, 18, 18]} />
              <meshStandardMaterial
                color="#FFE8A0"
                emissive="#FFD060"
                emissiveIntensity={4.5}
                roughness={0.05} metalness={0}
              />
            </mesh>
            <pointLight
              position={[0, bulbY - 0.1, 0]}
              color="#FFD07A"
              intensity={p.intensity * 1.8}
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

// Floating tooltip that fades/rises on hover
function Tooltip3D({ visible, text, position }: { visible: boolean; text: string; position: [number, number, number] }) {
  const ref = useRef<any>(null);
  useFrame(() => {
    if (!ref.current) return;
    const target = visible ? 1 : 0;
    ref.current.fillOpacity += (target - ref.current.fillOpacity) * 0.12;
    ref.current.position.y += ((position[1] + (visible ? 0.06 : 0)) - ref.current.position.y) * 0.12;
  });
  return (
    <Text
      ref={ref}
      position={position}
      font="/fonts/OpenSauceSans-Black.ttf"
      fontSize={0.045}
      color="#FFFFFF"
      letterSpacing={0.12}
      anchorX="center"
      anchorY="middle"
      fillOpacity={0}
      outlineWidth={0.004}
      outlineColor="#FFFFFF"
      outlineOpacity={0.6}
    >
      {text}
    </Text>
  );
}

function InteractiveItems({ setActivePopup }: { setActivePopup: (p: Popup) => void }) {
  const [hovered, setHovered] = useState<Popup>(null);
  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
  }, [hovered]);

  const onOver = (e: any, id: Popup) => { e.stopPropagation(); setHovered(id); };
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
        <mesh position={[0, 0.15, 0]} rotation={[-0.4, 0, 0]}>
          <boxGeometry args={[0.3, 0.45, 0.02]} />
          <meshStandardMaterial color={hovered === "menu" ? "#D4B895" : "#C4A885"} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.16, 0.012]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[0.26, 0.4]} />
          <meshStandardMaterial color="#FDFBF7" roughness={0.9} />
        </mesh>
        <Text position={[0, 0.28, 0.025]} rotation={[-0.4, 0, 0]} font="/fonts/OpenSauceSans-Bold.ttf" fontSize={0.035} color="#333" letterSpacing={0.1}>MENU</Text>
        <Text position={[0, 0.18, 0.025]} rotation={[-0.4, 0, 0]} font="/fonts/OpenSauceSans-Black.ttf" fontSize={0.018} color="#666" maxWidth={0.2} textAlign="center">
          Espresso... 3.50{"\n"}Cortado... 4.50{"\n"}Latte... 5.00{"\n"}Pour Over... 6.00
        </Text>
        <Tooltip3D
          visible={hovered === "menu"}
          text="View Projects"
          position={[0, 0.62, 0.025]}
        />
      </group>

      {/* ORDER - POS Tablet */}
      <group
        position={[2.6, 1.09, 2.0]}
        rotation={[0, -0.5, 0]}
        onClick={(e) => { e.stopPropagation(); setActivePopup("order"); }}
        onPointerOver={(e) => onOver(e, "order")}
        onPointerOut={onOut}
      >
        <mesh position={[0, 0.12, 0]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[0.4, 0.28, 0.02]} />
          <meshStandardMaterial color="#111" roughness={0.5} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.12, 0.011]} rotation={[-0.5, 0, 0]}>
          <planeGeometry args={[0.38, 0.26]} />
          <meshBasicMaterial color={hovered === "order" ? "#3A2A18" : "#1A0F08"} />
        </mesh>
        <mesh position={[0, 0.02, -0.05]}>
          <boxGeometry args={[0.15, 0.04, 0.15]} />
          <meshStandardMaterial color="#222" roughness={0.8} />
        </mesh>
        <Text position={[0, 0.12, 0.012]} rotation={[-0.5, 0, 0]} font="/fonts/OpenSauceSans-Bold.ttf" fontSize={0.04} color="#FFF" letterSpacing={0.1}>TAP TO ORDER</Text>
        <Tooltip3D
          visible={hovered === "order"}
          text="Start a Conversation"
          position={[0, 0.35, 0.012]}
        />
      </group>
    </group>
  );
}

function CafeEnvironment({ activePopup, setActivePopup }: { activePopup: Popup; setActivePopup: (p: Popup) => void }) {
  const tex = useProceduralTextures();

  return (
    <>
      <color attach="background" args={["#1A0F08"]} />
      <fog attach="fog" args={["#221408", 7, 20]} />

      {/* HDRI — warm lobby environment for realistic reflections */}
      {/* <Environment preset="lobby" background={false} environmentIntensity={0.4} /> */}

      {/* Fill lights */}
      <ambientLight color="#FFE8D0" intensity={0.25} />
      <directionalLight position={[0, 4, 3]} color="#FFF4E8" intensity={0.25} />

      <CameraRig activePopup={activePopup} />

      <Suspense fallback={null}>
        <InteractiveItems setActivePopup={setActivePopup} />
        <Room tex={tex} />
        <BackBar tex={tex} />
        <Counter tex={tex} />
        <PendantLights />

        {/* ── BAR COUNTER — evenly spaced left → right ──────────────────────── */}

        {/* Far-left: Cups and Canisters */}
        <CupStack position={[-5.2, 1.09, 1.35]} count={4} />
        <CupStack position={[-4.9, 1.09, 1.35]} count={5} />
        <CoffeeCanisters position={[-4.3, 1.09, 1.18]} />

        {/* Grinding Station */}
        <EK43 position={[-3.4, 1.09, 1.05]} />
        <NicheZero position={[-2.7, 1.09, 1.08]} />
        <NicheZero position={[-2.1, 1.09, 1.08]} />
        <NicheZero position={[-1.5, 1.09, 1.08]} />

        {/* Prep Station */}
        <PortafilterRack position={[-0.9, 1.09, 1.05]} />
        <Knockbox position={[-0.5, 1.09, 1.38]} />
        <Scale position={[-0.25, 1.104, 1.38]} />
        <TampingStation position={[-0.1, 1.09, 1.15]} />

        {/* ── ESPRESSO MACHINE — middle ── */}
        <LaMarzocco position={[0.4, 1.09, 1.05]} />
        <SteamSystem position={[-0.28, 1.28, 1.22]} />

        {/* Milk & Towels */}
        <BarTowelRoll position={[1.1, 1.09, 1.40]} />
        <BarTowelRoll position={[1.25, 1.09, 1.40]} />
        <MilkPitchers position={[1.4, 1.09, 1.15]} />
        <BarTowelRoll position={[1.6, 1.09, 1.40]} />

        {/* Pour Over Station */}
        <GooseneckKettle position={[2.1, 1.09, 1.20]} />
        <V60Stand position={[2.6, 1.09, 1.20]} />
        <Chemex position={[3.1, 1.09, 1.18]} />

        {/* Far-right: Syrups, Water, and Cups */}
        <SyrupRack position={[3.8, 1.09, 1.20]} />
        <SmallPlant position={[4.2, 1.09, 1.18]} />
        <WaterGlasses position={[4.5, 1.09, 1.38]} />
        <CupStack position={[4.8, 1.09, 1.12]} count={6} />
        <CupStack position={[5.05, 1.09, 1.12]} count={4} />
        <CupStack position={[5.3, 1.09, 1.15]} count={3} />
        <CupStack position={[5.55, 1.09, 1.15]} count={5} />

        <ContactShadows
          position={[0, 1.096, 1.7]}
          rotation={[Math.PI / 2, 0, 0]}
          opacity={0.5}
          scale={[12, 1.4]}
          blur={1.8}
          far={0.5}
          color="#1A0F08"
        />

        {/* ── POST-PROCESSING ── */}
        <EffectComposer>
          {/* Bloom — makes pendant bulbs genuinely glow */}
          <Bloom
            mipmapBlur
            luminanceThreshold={0.62}
            luminanceSmoothing={0.35}
            intensity={1.4}
          />
          {/* Depth of Field — focus on machine, blur near edge + far wall */}
          {/* <DepthOfField
            focusDistance={0.078}
            focalLength={0.028}
            bokehScale={2.8}
          /> */}
          {/* Film grain — breaks the mathematical perfection */}
          <Noise
            opacity={0.032}
            blendFunction={BlendFunction.SOFT_LIGHT}
          />
          {/* Vignette — frames the scene */}
          <Vignette
            darkness={0.52}
            offset={0.38}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Suspense>
    </>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function Scene3D() {
  const [activePopup, setActivePopup] = useState<Popup>(null);
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
        padding: '36px 48px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 50,
        background: 'transparent',
        fontFamily: "'OpenSauceSans', sans-serif",
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        fontSize: '0.65rem'
      }}>
        <div style={{ color: '#F2EDE6', fontSize: '1.4rem', fontFamily: "'Nirakolu', serif", textTransform: 'none', letterSpacing: '3px' }}>
          Pacey Diep
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
        dpr={[1, 2]}
        camera={{ position: [0, 1.62, 8.5], fov: 56, near: 0.1, far: 50 }}
        shadows
        style={{ position: "absolute", inset: 0 }}
      >
        <CafeEnvironment activePopup={activePopup} setActivePopup={setActivePopup} />
      </Canvas>

      <MenuPopup isOpen={activePopup === "menu"} onClose={closePopup} onProjectClick={openCaseStudy} />
      <AboutPopup isOpen={activePopup === "about"} onClose={closePopup} />
      <OrderPopup isOpen={activePopup === "order"} onClose={closePopup} />
      <CaseStudy slug={caseStudySlug} onClose={closeCaseStudy} />
    </div>
  );
}

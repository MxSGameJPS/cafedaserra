"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 16000;
const AMBIENT_COUNT = 1800;
const MAP_COUNT = 2200;
const TAU = Math.PI * 2;

type ProgressProps = {
  progressRef: MutableRefObject<number>;
};

type MorphState = {
  from: number;
  to: number;
  t: number;
  scatter: number;
};

function hash(n: number) {
  const value = Math.sin(n * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
}

function randomFor(index: number, salt: number) {
  return hash(index * 17.17 + salt * 91.73);
}

function setPoint(target: Float32Array, index: number, x: number, y: number, z: number) {
  const i = index * 3;
  target[i] = x;
  target[i + 1] = y;
  target[i + 2] = z;
}

function rotate(x: number, y: number, angle: number) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [x * c - y * s, x * s + y * c] as const;
}

function smooth01(value: number) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function transition(progress: number, start: number, end: number, from: number, to: number): MorphState {
  const linear = THREE.MathUtils.clamp((progress - start) / Math.max(0.0001, end - start), 0, 1);
  const t = smooth01(linear);
  return {
    from,
    to,
    t,
    // A small local turbulence keeps the particles alive without throwing them
    // across the viewport during a morph.
    scatter: Math.pow(Math.sin(linear * Math.PI), 2) * 0.075,
  };
}

function getMorphState(progress: number): MorphState {
  if (progress < 0.10) return { from: 0, to: 0, t: 0, scatter: 0 };
  if (progress < 0.18) return transition(progress, 0.10, 0.18, 0, 1);

  if (progress < 0.35) return { from: 1, to: 1, t: 0, scatter: 0 };
  if (progress < 0.45) return transition(progress, 0.35, 0.45, 1, 2);

  if (progress < 0.61) return { from: 2, to: 2, t: 0, scatter: 0 };
  if (progress < 0.70) return transition(progress, 0.61, 0.70, 2, 3);

  if (progress < 0.82) return { from: 3, to: 3, t: 0, scatter: 0 };
  if (progress < 0.91) return transition(progress, 0.82, 0.91, 3, 4);

  return { from: 4, to: 4, t: 0, scatter: 0 };
}

function createMortar() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const rimEnd = Math.floor(PARTICLE_COUNT * 0.24);
  const bodyEnd = Math.floor(PARTICLE_COUNT * 0.70);
  const pestleEnd = Math.floor(PARTICLE_COUNT * 0.92);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < rimEnd) {
      const a = randomFor(i, 1) * TAU;
      const ring = 0.73 + randomFor(i, 2) * 0.27;
      setPoint(
        target,
        i,
        Math.cos(a) * 2.05 * ring - 0.18,
        -0.38 + Math.sin(a) * 0.56 * ring,
        (randomFor(i, 3) - 0.5) * (0.34 + (1 - ring) * 0.75),
      );
    } else if (i < bodyEnd) {
      const t = randomFor(i, 4);
      const y = -0.58 - t * 1.55;
      const width = 1.86 - t * 0.34;
      const xNorm = randomFor(i, 5) * 2 - 1;
      const curvedSide = Math.pow(Math.abs(xNorm), 2.6) * 0.20;
      setPoint(
        target,
        i,
        xNorm * width - 0.18,
        y + curvedSide,
        (randomFor(i, 6) - 0.5) * (0.92 - t * 0.26),
      );
    } else if (i < pestleEnd) {
      const t = randomFor(i, 7);
      const startX = -1.64;
      const startY = 3.08;
      const endX = -0.44;
      const endY = -0.22;
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const px = -dy / length;
      const py = dx / length;
      const radius = 0.16 + randomFor(i, 8) * 0.16;
      const side = (randomFor(i, 9) * 2 - 1) * radius;
      setPoint(
        target,
        i,
        startX + dx * t + px * side,
        startY + dy * t + py * side,
        (randomFor(i, 10) - 0.5) * radius * 1.9,
      );
    } else {
      const a = randomFor(i, 14) * TAU;
      const radial = 0.25 + Math.pow(randomFor(i, 15), 0.68) * 1.62;
      setPoint(
        target,
        i,
        -0.48 + Math.cos(a) * radial,
        -0.10 + Math.sin(a) * radial * 0.62 + randomFor(i, 16) * 0.65,
        (randomFor(i, 17) - 0.5) * 1.35,
      );
    }
  }

  return target;
}

function createBean() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const seamWidth = 0.105;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const a = randomFor(i, 21) * TAU;
    const r = Math.sqrt(randomFor(i, 22));
    let x = Math.cos(a) * 1.72 * r;
    const y = Math.sin(a) * 2.43 * r;
    const normalizedY = y / 2.43;
    const seam = 0.18 * Math.sin(normalizedY * Math.PI * 1.35) - 0.03 * normalizedY;
    const localWidth = seamWidth * (0.78 + (1 - Math.abs(normalizedY)) * 0.52);
    const distance = x - seam;

    if (Math.abs(distance) < localWidth) {
      x = seam + Math.sign(distance || randomFor(i, 23) - 0.5) * localWidth;
    }

    const [rx, ry] = rotate(x, y, -0.34);
    setPoint(target, i, rx, ry, (randomFor(i, 24) - 0.5) * 0.48);
  }

  return target;
}

function createLocationPin() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const headEnd = Math.floor(PARTICLE_COUNT * 0.67);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < headEnd) {
      const a = randomFor(i, 31) * TAU;
      const inner = 0.52;
      const outer = 1.48;
      const radius = Math.sqrt(inner * inner + randomFor(i, 32) * (outer * outer - inner * inner));
      setPoint(
        target,
        i,
        Math.cos(a) * radius,
        0.74 + Math.sin(a) * radius,
        (randomFor(i, 33) - 0.5) * 0.38,
      );
    } else {
      const t = randomFor(i, 34);
      const halfWidth = (1 - t) * 1.10 + 0.05;
      const x = (randomFor(i, 35) * 2 - 1) * halfWidth;
      const edgeLift = Math.pow(Math.abs(x) / Math.max(halfWidth, 0.001), 2) * 0.15;
      setPoint(target, i, x, -0.40 - t * 2.26 + edgeLift, (randomFor(i, 36) - 0.5) * 0.34);
    }
  }

  return target;
}

function createSteamFlow() {
  const target = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = randomFor(i, 41);
    const lane = (i % 3) - 1;
    const y = -3.0 + t * 6.2;
    const widening = 0.12 + (1 - Math.abs(t - 0.52) * 1.4) * 0.22;
    const x =
      lane * 0.16 +
      Math.sin(t * 9.2 + lane * 1.8) * widening +
      (randomFor(i, 42) - 0.5) * 0.30;
    const z = Math.cos(t * 7.4 + lane) * 0.10 + (randomFor(i, 43) - 0.5) * 0.24;
    setPoint(target, i, x, y, z);
  }

  return target;
}

function createFinalFlow() {
  const target = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = randomFor(i, 51);
    const y = 3.12 - t * 5.9;
    const taper = THREE.MathUtils.lerp(0.42, 0.12, t);
    const swirl = Math.sin(t * 10.6 + (i % 4) * 1.1) * taper;
    setPoint(
      target,
      i,
      swirl + (randomFor(i, 52) - 0.5) * (0.25 + taper),
      y,
      (randomFor(i, 53) - 0.5) * (0.40 - t * 0.14),
    );
  }

  return target;
}

function buildColors(count: number, salt = 0) {
  const palette = ["#512614", "#713417", "#93451d", "#b45c29", "#cd793d", "#dfa168", "#f0c497"];
  const data = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    color.set(palette[Math.floor(randomFor(i, 90 + salt) * palette.length)]);
    data[i * 3] = color.r;
    data[i * 3 + 1] = color.g;
    data[i * 3 + 2] = color.b;
  }

  return data;
}

function AmbientDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(AMBIENT_COUNT * 3);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const angle = randomFor(i, 101) * TAU;
      const radius = 1.3 + Math.pow(randomFor(i, 102), 0.58) * 4.2;
      setPoint(
        data,
        i,
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.72 + (randomFor(i, 103) - 0.5) * 1.1,
        (randomFor(i, 104) - 0.5) * 4.8,
      );
    }
    return data;
  }, []);
  const colors = useMemo(() => buildColors(AMBIENT_COUNT, 15), []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.z = Math.sin(state.clock.elapsedTime * 0.04) * 0.018;
    points.rotation.y = state.pointer.x * 0.008;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.16) * 0.025;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.018}
        sizeAttenuation
        transparent
        opacity={0.18}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function LocationMap({ progressRef }: ProgressProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const data = new Float32Array(MAP_COUNT * 3);

    for (let i = 0; i < MAP_COUNT; i++) {
      const t = randomFor(i, 121);
      const route = i % 7;
      let x = 0;
      let y = -2.35;

      if (route === 0) {
        x = -2.25 + t * 4.5;
        y = -2.25 + Math.sin(t * 5.4) * 0.12;
      } else if (route === 1) {
        x = -2.0 + t * 4.1;
        y = -2.68 + Math.sin(t * 7.2 + 1.4) * 0.10;
      } else if (route === 2) {
        x = -1.78 + t * 3.7;
        y = -3.00 + Math.sin(t * 4.6 + 2.2) * 0.08;
      } else if (route === 3) {
        x = -1.55 + t * 3.1;
        y = -3.20 + t * 1.25;
      } else if (route === 4) {
        x = -0.95 + t * 2.25;
        y = -3.16 + t * 1.15;
      } else if (route === 5) {
        x = 1.35 - t * 2.8;
        y = -3.14 + t * 1.0;
      } else {
        x = -1.8 + t * 3.6;
        y = -2.48 + t * 0.52;
      }

      x += (randomFor(i, 122) - 0.5) * 0.035;
      y += (randomFor(i, 123) - 0.5) * 0.035;
      setPoint(data, i, x, y, -0.20 + (randomFor(i, 124) - 0.5) * 0.08);
    }

    return data;
  }, []);

  const colors = useMemo(() => buildColors(MAP_COUNT, 27), []);

  useFrame((state) => {
    const points = pointsRef.current;
    const material = materialRef.current;
    if (!points || !material) return;

    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const enter = THREE.MathUtils.smoothstep(progress, 0.40, 0.47);
    const leave = THREE.MathUtils.smoothstep(progress, 0.60, 0.67);
    const presence = enter * (1 - leave);
    const isMobile = state.size.width <= 900;

    points.visible = presence > 0.01;
    const targetX = isMobile ? 0 : 1.65;
    const targetScale = isMobile ? 0.54 : 0.62;

    points.position.x += (targetX - points.position.x) * 0.10;
    points.position.y += ((isMobile ? 0.50 : 0) - points.position.y) * 0.10;
    points.scale.x += (targetScale - points.scale.x) * 0.10;
    points.scale.y += (targetScale * 0.58 - points.scale.y) * 0.10;
    points.scale.z += (targetScale - points.scale.z) * 0.10;
    points.rotation.z = -0.08;
    material.opacity = presence * 0.34;
  });

  return (
    <points ref={pointsRef} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.025}
        sizeAttenuation
        transparent
        opacity={0}
        vertexColors
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

function ParticleField({ progressRef }: ProgressProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => createMortar(), []);
  const shapes = useMemo(
    () => [createMortar(), createBean(), createLocationPin(), createSteamFlow(), createFinalFlow()],
    [],
  );
  const colors = useMemo(() => buildColors(PARTICLE_COUNT), []);

  const scatterVectors = useMemo(() => {
    const vectors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = randomFor(i, 70) * TAU;
      const z = randomFor(i, 71) * 2 - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const strength = 0.35 + randomFor(i, 72) * 0.55;
      setPoint(vectors, i, Math.cos(a) * r * strength, Math.sin(a) * r * strength, z * strength);
    }
    return vectors;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    const material = materialRef.current;
    if (!points || !material) return;

    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const morph = getMorphState(progress);
    const from = shapes[morph.from];
    const to = shapes[morph.to];
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < array.length; i++) {
      const desired = THREE.MathUtils.lerp(from[i], to[i], morph.t) + scatterVectors[i] * morph.scatter;
      array[i] += (desired - array[i]) * 0.13;
    }

    attribute.needsUpdate = true;

    const stageX = [1.78, -1.72, 1.65, -1.58, 1.70];
    const stageScale = [0.84, 0.90, 0.62, 0.76, 0.72];
    const stageY = [0.05, 0.04, 0.08, 0.02, 0.10];
    const isMobile = state.size.width <= 900;

    let targetX = THREE.MathUtils.lerp(stageX[morph.from], stageX[morph.to], morph.t);
    let targetScale = THREE.MathUtils.lerp(stageScale[morph.from], stageScale[morph.to], morph.t);
    let targetY = THREE.MathUtils.lerp(stageY[morph.from], stageY[morph.to], morph.t);

    if (isMobile) {
      targetX = 0;
      targetScale *= 0.78;
      targetY = 0.64;
    }

    points.position.x += (targetX - points.position.x) * 0.085;
    points.position.y += (targetY - points.position.y) * 0.085;
    points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, targetScale, 0.085));
    points.rotation.y = Math.sin(state.clock.elapsedTime * 0.10) * 0.026 + state.pointer.x * 0.012;
    points.rotation.x = state.pointer.y * -0.008;

    const inTransition = morph.from !== morph.to;
    const transitionDip = inTransition ? Math.sin(morph.t * Math.PI) : 0;
    const closingPresence = THREE.MathUtils.smoothstep(progress, 0.74, 0.88);
    const morphOpacity = 0.94 - transitionDip * 0.18;
    material.opacity = THREE.MathUtils.lerp(morphOpacity, 0.28, closingPresence);
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.031}
        sizeAttenuation
        transparent
        opacity={0.94}
        vertexColors
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default function ParticleNarrative() {
  const progressRef = useRef(0);
  const closingRef = useRef<HTMLDivElement>(null);
  const smokeRef = useRef<HTMLDivElement>(null);
  const beansARef = useRef<HTMLDivElement>(null);
  const beansBRef = useRef<HTMLDivElement>(null);
  const cupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = THREE.MathUtils.clamp(window.scrollY / max, 0, 1);
      progressRef.current = progress;

      const locationPhase = progress >= 0.40 && progress <= 0.64;
      const closing = THREE.MathUtils.smoothstep(progress, 0.73, 0.85);
      const cupReveal = THREE.MathUtils.smoothstep(progress, 0.84, 0.96);
      const steamLift = THREE.MathUtils.lerp(46, -10, closing);
      const beanDrift = THREE.MathUtils.lerp(34, -30, closing);

      document.documentElement.classList.toggle("location-phase", locationPhase);
      document.documentElement.classList.toggle("closing-phase", progress >= 0.73);

      if (closingRef.current) {
        closingRef.current.style.opacity = String(closing);
      }
      if (smokeRef.current) {
        smokeRef.current.style.opacity = String(0.16 + closing * 0.58);
        smokeRef.current.style.transform = `translate3d(-50%, ${steamLift}px, 0) scale(${0.94 + closing * 0.06})`;
      }
      if (beansARef.current) {
        beansARef.current.style.opacity = String(0.10 + closing * 0.72);
        beansARef.current.style.transform = `translate3d(-50%, ${beanDrift}px, 0) scale(${0.94 + closing * 0.06})`;
      }
      if (beansBRef.current) {
        beansBRef.current.style.opacity = String(0.05 + closing * 0.28);
        beansBRef.current.style.transform = `translate3d(-50%, ${-beanDrift * 0.28}px, 0) scale(.88)`;
      }
      if (cupRef.current) {
        cupRef.current.style.opacity = String(cupReveal);
        cupRef.current.style.transform = `translate3d(-50%, ${THREE.MathUtils.lerp(54, 0, cupReveal)}px, 0) scale(${0.95 + cupReveal * 0.05})`;
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      document.documentElement.classList.remove("location-phase", "closing-phase");
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <div className="particle-canvas" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0, 7.2], fov: 48 }}
          dpr={[1, 1.45]}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        >
          <AmbientDust />
          <LocationMap progressRef={progressRef} />
          <ParticleField progressRef={progressRef} />
        </Canvas>
      </div>

      <div className="closing-visual" ref={closingRef} aria-hidden="true">
        <div className="closing-smoke" ref={smokeRef} />
        <div className="closing-beans closing-beans--a" ref={beansARef} />
        <div className="closing-beans closing-beans--b" ref={beansBRef} />
        <div className="closing-cup" ref={cupRef} />
      </div>
    </>
  );
}

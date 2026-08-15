"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 16000;
const AMBIENT_COUNT = 900;
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

function transition(
  progress: number,
  start: number,
  end: number,
  from: number,
  to: number,
  scatterStrength = 0,
): MorphState {
  const linear = THREE.MathUtils.clamp((progress - start) / Math.max(0.0001, end - start), 0, 1);
  return {
    from,
    to,
    t: smooth01(linear),
    scatter: Math.pow(Math.sin(linear * Math.PI), 2) * scatterStrength,
  };
}

/*
 * One simple rule drives the whole site:
 *  - scenes without photography: particles form a readable object;
 *  - once photography begins: the same particles dissolve into a full-screen
 *    atmospheric field and never form another object.
 */
function getMorphState(progress: number): MorphState {
  if (progress < 0.12) return { from: 0, to: 0, t: 0, scatter: 0 };
  if (progress < 0.20) return transition(progress, 0.12, 0.20, 0, 1, 0.035);

  if (progress < 0.35) return { from: 1, to: 1, t: 0, scatter: 0 };
  if (progress < 0.47) return transition(progress, 0.35, 0.47, 1, 2, 0);

  return { from: 2, to: 2, t: 0, scatter: 0 };
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

function createDiffuseField() {
  const target = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (randomFor(i, 31) * 2 - 1) * 5.9;
    const y = (randomFor(i, 32) * 2 - 1) * 3.55;
    const depth = randomFor(i, 33);

    // Very soft density variation keeps the field organic without creating a
    // silhouette or focal object.
    const drift = Math.sin(x * 0.72 + i * 0.013) * 0.16 + Math.cos(y * 1.08 + i * 0.007) * 0.10;
    const z = -0.45 - depth * 2.0 + drift;

    setPoint(target, i, x, y, z);
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
      setPoint(
        data,
        i,
        (randomFor(i, 101) * 2 - 1) * 5.7,
        (randomFor(i, 102) * 2 - 1) * 3.4,
        -1.2 - randomFor(i, 103) * 2.6,
      );
    }

    return data;
  }, []);
  const colors = useMemo(() => buildColors(AMBIENT_COUNT, 15), []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.022;
    points.rotation.z = Math.sin(state.clock.elapsedTime * 0.035) * 0.008;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.014}
        sizeAttenuation
        transparent
        opacity={0.10}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ParticleField({ progressRef }: ProgressProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => createMortar(), []);
  const shapes = useMemo(() => [createMortar(), createBean(), createDiffuseField()], []);
  const colors = useMemo(() => buildColors(PARTICLE_COUNT), []);

  const scatterVectors = useMemo(() => {
    const vectors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = randomFor(i, 70) * TAU;
      const z = randomFor(i, 71) * 2 - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const strength = 0.25 + randomFor(i, 72) * 0.42;
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
      array[i] += (desired - array[i]) * 0.115;
    }

    attribute.needsUpdate = true;

    const isMobile = state.size.width <= 900;
    const stageX = isMobile ? [0, 0, 0] : [1.78, -1.70, 0];
    const stageY = isMobile ? [0.72, 0.66, 0] : [0.05, 0.04, 0];
    const stageScaleX = isMobile ? [0.66, 0.69, 0.62] : [0.84, 0.90, 1.05];
    const stageScaleY = isMobile ? [0.66, 0.69, 1.02] : [0.84, 0.90, 1.00];

    const targetX = THREE.MathUtils.lerp(stageX[morph.from], stageX[morph.to], morph.t);
    const targetY = THREE.MathUtils.lerp(stageY[morph.from], stageY[morph.to], morph.t);
    const targetScaleX = THREE.MathUtils.lerp(stageScaleX[morph.from], stageScaleX[morph.to], morph.t);
    const targetScaleY = THREE.MathUtils.lerp(stageScaleY[morph.from], stageScaleY[morph.to], morph.t);

    points.position.x += (targetX - points.position.x) * 0.085;
    points.position.y += (targetY - points.position.y) * 0.085;
    points.scale.x += (targetScaleX - points.scale.x) * 0.085;
    points.scale.y += (targetScaleY - points.scale.y) * 0.085;
    points.scale.z += (1 - points.scale.z) * 0.085;

    const diffusePresence = THREE.MathUtils.smoothstep(progress, 0.37, 0.49);
    points.rotation.y = state.pointer.x * THREE.MathUtils.lerp(0.012, 0.003, diffusePresence);
    points.rotation.x = state.pointer.y * THREE.MathUtils.lerp(-0.008, -0.002, diffusePresence);
    points.rotation.z = Math.sin(state.clock.elapsedTime * 0.055) * diffusePresence * 0.006;

    const inTransition = morph.from !== morph.to;
    const transitionDip = inTransition ? Math.sin(morph.t * Math.PI) : 0;
    const figureOpacity = 0.94 - transitionDip * 0.12;
    const diffuseOpacity = isMobile ? 0.22 : 0.28;
    material.opacity = THREE.MathUtils.lerp(figureOpacity, diffuseOpacity, diffusePresence);
    material.size = THREE.MathUtils.lerp(0.031, isMobile ? 0.018 : 0.020, diffusePresence);
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

      // Real PNG assets appear only in the final act. Until then, photography
      // is the only foreground visual and particles remain diffuse behind it.
      const closing = THREE.MathUtils.smoothstep(progress, 0.82, 0.91);
      const cupReveal = THREE.MathUtils.smoothstep(progress, 0.88, 0.98);
      const steamLift = THREE.MathUtils.lerp(44, -8, closing);
      const beanDrift = THREE.MathUtils.lerp(32, -26, closing);

      document.documentElement.classList.toggle("closing-phase", progress >= 0.81);

      if (closingRef.current) closingRef.current.style.opacity = String(closing);

      if (smokeRef.current) {
        smokeRef.current.style.opacity = String(0.12 + closing * 0.58);
        smokeRef.current.style.transform = `translate3d(-50%, ${steamLift}px, 0) scale(${0.95 + closing * 0.05})`;
      }

      if (beansARef.current) {
        beansARef.current.style.opacity = String(0.08 + closing * 0.70);
        beansARef.current.style.transform = `translate3d(-50%, ${beanDrift}px, 0) scale(${0.95 + closing * 0.05})`;
      }

      if (beansBRef.current) {
        beansBRef.current.style.opacity = String(0.04 + closing * 0.24);
        beansBRef.current.style.transform = `translate3d(-50%, ${-beanDrift * 0.25}px, 0) scale(.88)`;
      }

      if (cupRef.current) {
        cupRef.current.style.opacity = String(cupReveal);
        cupRef.current.style.transform = `translate3d(-50%, ${THREE.MathUtils.lerp(46, 0, cupReveal)}px, 0) scale(${0.96 + cupReveal * 0.04})`;
      }
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      document.documentElement.classList.remove("closing-phase");
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

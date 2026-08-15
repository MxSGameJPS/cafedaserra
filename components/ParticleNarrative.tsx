"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 16000;
const AMBIENT_COUNT = 3200;
const TAU = Math.PI * 2;

type ParticleFieldProps = {
  progressRef: MutableRefObject<number>;
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

function createMortar() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const rimEnd = Math.floor(PARTICLE_COUNT * 0.24);
  const bodyEnd = Math.floor(PARTICLE_COUNT * 0.70);
  const pestleEnd = Math.floor(PARTICLE_COUNT * 0.92);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < rimEnd) {
      const a = randomFor(i, 1) * TAU;
      const ring = 0.73 + randomFor(i, 2) * 0.27;
      const x = Math.cos(a) * 2.05 * ring;
      const y = -0.38 + Math.sin(a) * 0.56 * ring;
      const z = (randomFor(i, 3) - 0.5) * (0.34 + (1 - ring) * 0.75);
      setPoint(target, i, x - 0.18, y, z);
    } else if (i < bodyEnd) {
      const t = randomFor(i, 4);
      const y = -0.58 - t * 1.55;
      const width = 1.86 - t * 0.34;
      const xNorm = randomFor(i, 5) * 2 - 1;
      const curvedSide = Math.pow(Math.abs(xNorm), 2.6) * 0.20;
      const x = xNorm * width;
      const z = (randomFor(i, 6) - 0.5) * (0.92 - t * 0.26);
      setPoint(target, i, x - 0.18, y + curvedSide, z);
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
      const x = startX + dx * t + px * side;
      const y = startY + dy * t + py * side;
      const z = (randomFor(i, 10) - 0.5) * radius * 1.9;
      setPoint(target, i, x, y, z);
    } else {
      const a = randomFor(i, 14) * TAU;
      const radial = 0.25 + Math.pow(randomFor(i, 15), 0.68) * 1.62;
      const x = -0.48 + Math.cos(a) * radial;
      const y = -0.10 + Math.sin(a) * radial * 0.62 + randomFor(i, 16) * 0.65;
      const z = (randomFor(i, 17) - 0.5) * 1.35;
      setPoint(target, i, x, y, z);
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
      x = seam + Math.sign(distance || (randomFor(i, 23) - 0.5)) * localWidth;
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
      const outer = 1.58;
      const radius = Math.sqrt(inner * inner + randomFor(i, 32) * (outer * outer - inner * inner));
      const x = Math.cos(a) * radius;
      const y = 0.74 + Math.sin(a) * radius;
      setPoint(target, i, x, y, (randomFor(i, 33) - 0.5) * 0.42);
    } else {
      const t = randomFor(i, 34);
      const halfWidth = (1 - t) * 1.20 + 0.06;
      const x = (randomFor(i, 35) * 2 - 1) * halfWidth;
      const edgeLift = Math.pow(Math.abs(x) / Math.max(halfWidth, 0.001), 2) * 0.18;
      const y = -0.42 - t * 2.35 + edgeLift;
      setPoint(target, i, x, y, (randomFor(i, 36) - 0.5) * 0.38);
    }
  }

  return target;
}

function createSteam() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const steamEnd = Math.floor(PARTICLE_COUNT * 0.74);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < steamEnd) {
      const strand = i % 3;
      const t = randomFor(i, 41);
      const y = -1.82 + t * 4.62;
      const phase = strand * 1.78;
      const center = (strand - 1) * 0.58;
      const x = center + Math.sin(t * 7.5 + phase) * (0.18 + t * 0.22);
      const thickness = (randomFor(i, 42) - 0.5) * 0.13;
      const z = Math.cos(t * 6.5 + phase) * 0.13 + (randomFor(i, 43) - 0.5) * 0.12;
      setPoint(target, i, x + thickness, y, z);
    } else {
      const a = randomFor(i, 44) * TAU;
      const ring = 0.55 + randomFor(i, 45) * 0.45;
      const x = Math.cos(a) * 1.88 * ring;
      const y = -2.02 + Math.sin(a) * 0.23 * ring;
      setPoint(target, i, x, y, (randomFor(i, 46) - 0.5) * 0.34);
    }
  }

  return target;
}

function createCup() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const rimEnd = Math.floor(PARTICLE_COUNT * 0.20);
  const bodyEnd = Math.floor(PARTICLE_COUNT * 0.72);
  const handleEnd = Math.floor(PARTICLE_COUNT * 0.88);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < rimEnd) {
      const a = randomFor(i, 51) * TAU;
      const ring = 0.78 + randomFor(i, 52) * 0.22;
      const x = Math.cos(a) * 1.52 * ring - 0.18;
      const y = 0.34 + Math.sin(a) * 0.25 * ring;
      const z = (randomFor(i, 53) - 0.5) * 0.26;
      setPoint(target, i, x, y, z);
    } else if (i < bodyEnd) {
      const t = randomFor(i, 54);
      const y = 0.16 - t * 1.42;
      const topWidth = 1.40;
      const bottomWidth = 0.98;
      const halfWidth = THREE.MathUtils.lerp(topWidth, bottomWidth, Math.pow(t, 0.88));
      const xNorm = randomFor(i, 55) * 2 - 1;
      const x = xNorm * halfWidth - 0.18;
      const bottomRound = Math.pow(Math.abs(xNorm), 2.8) * (0.05 + t * 0.18);
      const z = (randomFor(i, 56) - 0.5) * (0.46 - t * 0.08);
      setPoint(target, i, x, y + bottomRound, z);
    } else if (i < handleEnd) {
      const a = randomFor(i, 57) * TAU;
      const inner = 0.46;
      const outer = 0.70;
      const radius = Math.sqrt(inner * inner + randomFor(i, 58) * (outer * outer - inner * inner));
      const x = 1.14 + Math.cos(a) * radius;
      const y = -0.36 + Math.sin(a) * radius * 0.78;
      setPoint(target, i, x, y, (randomFor(i, 59) - 0.5) * 0.22);
    } else {
      const a = randomFor(i, 60) * TAU;
      const ring = 0.62 + randomFor(i, 61) * 0.38;
      const x = Math.cos(a) * 1.88 * ring - 0.14;
      const y = -1.48 + Math.sin(a) * 0.15 * ring;
      const z = (randomFor(i, 62) - 0.5) * 0.22;
      setPoint(target, i, x, y, z);
    }
  }

  return target;
}

function buildColors(count: number, salt = 0) {
  const palette = ["#4d2412", "#6b3015", "#8c3f1a", "#aa5524", "#c87535", "#df9a55", "#efc18a"];
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
      const radius = 1.25 + Math.pow(randomFor(i, 102), 0.58) * 3.3;
      const x = Math.cos(angle) * radius - 1.45;
      const y = Math.sin(angle) * radius * 0.68 + (randomFor(i, 103) - 0.5) * 1.15;
      const z = (randomFor(i, 104) - 0.5) * 4.6;
      setPoint(data, i, x, y, z);
    }
    return data;
  }, []);
  const colors = useMemo(() => buildColors(AMBIENT_COUNT, 15), []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.z = Math.sin(state.clock.elapsedTime * 0.045) * 0.025;
    points.rotation.y = state.pointer.x * 0.012;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.18) * 0.035;
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.021}
        sizeAttenuation
        transparent
        opacity={0.42}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ParticleField({ progressRef }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => createMortar(), []);
  const shapes = useMemo(
    () => [createMortar(), createBean(), createLocationPin(), createSteam(), createCup()],
    [],
  );
  const colors = useMemo(() => buildColors(PARTICLE_COUNT), []);

  const scatterVectors = useMemo(() => {
    const vectors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = randomFor(i, 70) * TAU;
      const z = randomFor(i, 71) * 2 - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const strength = 0.48 + randomFor(i, 72) * 1.18;
      setPoint(vectors, i, Math.cos(a) * r * strength, Math.sin(a) * r * strength, z * strength);
    }
    return vectors;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const raw = THREE.MathUtils.clamp(progressRef.current, 0, 1) * (shapes.length - 1);
    const fromIndex = Math.min(Math.floor(raw), shapes.length - 1);
    const toIndex = Math.min(fromIndex + 1, shapes.length - 1);
    const local = raw - fromIndex;
    const eased = local * local * (3 - 2 * local);
    const scatter = Math.pow(Math.sin(local * Math.PI), 1.35) * 0.54;
    const from = shapes[fromIndex];
    const to = shapes[toIndex];
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < array.length; i++) {
      const desired = THREE.MathUtils.lerp(from[i], to[i], eased) + scatterVectors[i] * scatter;
      array[i] += (desired - array[i]) * 0.105;
    }

    attribute.needsUpdate = true;
    points.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.045 + state.pointer.x * 0.020;
    points.rotation.x = state.pointer.y * -0.014;

    const isMobile = state.size.width <= 900;
    const targetX = isMobile ? -0.06 : -2.28;
    const finalPresence = THREE.MathUtils.smoothstep(progressRef.current, 0.82, 1);
    const targetScale = isMobile ? 0.86 : THREE.MathUtils.lerp(0.98, 1.04, finalPresence);
    points.position.x += (targetX - points.position.x) * 0.075;
    points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, targetScale, 0.075));
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.034}
        sizeAttenuation
        transparent
        opacity={0.93}
        vertexColors
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default function ParticleNarrative() {
  const progressRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      progressRef.current = window.scrollY / max;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <style>{`
        @media (min-width: 901px) {
          .scene {
            padding-left: 7vw;
            padding-right: 3.5vw;
          }
          .scene-inner {
            width: min(1500px, 100%);
            max-width: none;
            margin-left: auto;
            margin-right: 0;
            grid-template-columns: minmax(0, 1.34fr) minmax(430px, .66fr);
            gap: clamp(96px, 8vw, 150px);
          }
          .scene-copy {
            width: min(590px, 100%);
            justify-self: end;
          }
          .hero .scene-inner {
            grid-template-columns: minmax(0, 1.30fr) minmax(500px, .70fr);
          }
          .hero .scene-copy {
            width: min(650px, 100%);
          }
          .final-scene .scene-inner {
            grid-template-columns: minmax(0, 1.30fr) minmax(470px, .70fr);
          }
          .scene-title {
            text-wrap: pretty;
          }
        }
      `}</style>
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
    </>
  );
}

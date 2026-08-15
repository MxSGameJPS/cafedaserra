"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

const PARTICLE_COUNT = 7600;
const TAU = Math.PI * 2;

type ParticleFieldProps = {
  progressRef: React.MutableRefObject<number>;
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
  const rimEnd = Math.floor(PARTICLE_COUNT * 0.26);
  const bodyEnd = Math.floor(PARTICLE_COUNT * 0.66);
  const pestleEnd = Math.floor(PARTICLE_COUNT * 0.93);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < rimEnd) {
      // Thick elliptical rim with an intentionally empty center, closer to a real mortar.
      const a = randomFor(i, 1) * TAU;
      const ring = 0.72 + randomFor(i, 2) * 0.3;
      const x = Math.cos(a) * 2.02 * ring;
      const y = -0.48 + Math.sin(a) * 0.55 * ring;
      const z = (randomFor(i, 3) - 0.5) * (0.42 + (1 - ring) * 0.8);
      setPoint(target, i, x - 0.22, y, z);
    } else if (i < bodyEnd) {
      // Dense stone body: wider at the mouth and subtly narrower toward the base.
      const t = randomFor(i, 4);
      const width = 1.82 - t * 0.34;
      const xNorm = randomFor(i, 5) * 2 - 1;
      const x = xNorm * width;
      const curvedSide = Math.pow(Math.abs(xNorm), 2.2) * 0.18;
      const y = -0.66 - t * 1.42 + curvedSide;
      const z = (randomFor(i, 6) - 0.5) * (0.86 - t * 0.2);
      setPoint(target, i, x - 0.22, y, z);
    } else if (i < pestleEnd) {
      // Cylindrical pestle entering diagonally from the upper-left.
      const t = randomFor(i, 7);
      const startX = -1.55;
      const startY = 2.88;
      const endX = -0.42;
      const endY = -0.24;
      const dx = endX - startX;
      const dy = endY - startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const px = -dy / length;
      const py = dx / length;
      const radius = 0.18 + randomFor(i, 8) * 0.18;
      const side = (randomFor(i, 9) * 2 - 1) * radius;
      const x = startX + dx * t + px * side;
      const y = startY + dy * t + py * side;
      const z = (randomFor(i, 10) - 0.5) * radius * 1.8;
      setPoint(target, i, x, y, z);
    } else {
      // Coffee dust and fragments exploding around the point of impact.
      const a = randomFor(i, 14) * TAU;
      const radial = 0.32 + Math.pow(randomFor(i, 15), 0.62) * 1.45;
      const x = -0.48 + Math.cos(a) * radial * 0.92;
      const y = -0.12 + Math.sin(a) * radial * 0.62 + randomFor(i, 16) * 0.55;
      const z = (randomFor(i, 17) - 0.5) * 1.25;
      setPoint(target, i, x, y, z);
    }
  }

  return target;
}

function createBean() {
  const target = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const a = randomFor(i, 11) * TAU;
    const r = Math.sqrt(randomFor(i, 12));
    let x = Math.cos(a) * 1.75 * r;
    let y = Math.sin(a) * 2.55 * r;

    const cleft = Math.exp(-Math.abs(x) * 4.4) * (0.22 + 0.17 * Math.sin(y * 2.2));
    x += x >= 0 ? cleft : -cleft;

    const [rx, ry] = rotate(x, y, -0.36);
    setPoint(target, i, rx, ry, (randomFor(i, 13) - 0.5) * 0.58);
  }

  return target;
}

function createLocationPin() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const headCount = Math.floor(PARTICLE_COUNT * 0.72);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < headCount) {
      const a = randomFor(i, 21) * TAU;
      const r = Math.sqrt(randomFor(i, 22));
      const innerCut = randomFor(i, 23) > 0.82;
      const radius = innerCut ? 0.48 + r * 0.12 : r * 1.52;
      const x = Math.cos(a) * radius;
      const y = 0.72 + Math.sin(a) * radius;
      setPoint(target, i, x, y, (randomFor(i, 24) - 0.5) * 0.5);
    } else {
      const t = randomFor(i, 25);
      const spread = (1 - t) * 1.18;
      const x = (randomFor(i, 26) - 0.5) * spread * 1.4;
      const y = -0.44 - t * 2.2 + Math.abs(x) * 0.23;
      setPoint(target, i, x, y, (randomFor(i, 27) - 0.5) * 0.4);
    }
  }

  return target;
}

function createSteam() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const steamCount = Math.floor(PARTICLE_COUNT * 0.76);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < steamCount) {
      const strand = i % 3;
      const t = randomFor(i, 31);
      const y = -2.35 + t * 4.9;
      const phase = strand * 1.55;
      const x = (strand - 1) * 0.7 + Math.sin(t * 9 + phase) * (0.26 + t * 0.18);
      const z = Math.cos(t * 8 + phase) * 0.2 + (randomFor(i, 32) - 0.5) * 0.18;
      setPoint(target, i, x, y, z);
    } else {
      const a = randomFor(i, 33) * TAU;
      const r = 1.2 + randomFor(i, 34) * 1.5;
      setPoint(target, i, Math.cos(a) * r, -2.1 + Math.sin(a) * 0.35, (randomFor(i, 35) - 0.5) * 0.8);
    }
  }

  return target;
}

function createCup() {
  const target = new Float32Array(PARTICLE_COUNT * 3);
  const bodyEnd = Math.floor(PARTICLE_COUNT * 0.58);
  const handleEnd = Math.floor(PARTICLE_COUNT * 0.75);
  const saucerEnd = Math.floor(PARTICLE_COUNT * 0.87);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (i < bodyEnd) {
      const t = randomFor(i, 41);
      const side = randomFor(i, 42) > 0.5 ? 1 : -1;
      const y = -1.2 + t * 1.65;
      const width = 1.4 - (t * 0.17);
      const surface = randomFor(i, 43);
      const x = surface > 0.54 ? side * width : (randomFor(i, 44) - 0.5) * width * 2;
      setPoint(target, i, x - 0.28, y, (randomFor(i, 45) - 0.5) * 0.38);
    } else if (i < handleEnd) {
      const a = -Math.PI * 0.7 + randomFor(i, 46) * Math.PI * 1.4;
      const radius = 0.7 + randomFor(i, 47) * 0.16;
      const x = 1.02 + Math.cos(a) * radius;
      const y = -0.32 + Math.sin(a) * radius * 0.72;
      setPoint(target, i, x, y, (randomFor(i, 48) - 0.5) * 0.28);
    } else if (i < saucerEnd) {
      const a = randomFor(i, 49) * TAU;
      const r = Math.sqrt(randomFor(i, 50));
      setPoint(target, i, Math.cos(a) * r * 2.0 - 0.2, -1.52 + Math.sin(a) * r * 0.19, (randomFor(i, 51) - 0.5) * 0.28);
    } else {
      const strand = i % 2;
      const t = randomFor(i, 52);
      const x = (strand ? 0.34 : -0.28) + Math.sin(t * 8 + strand) * 0.23;
      const y = 0.5 + t * 2.05;
      setPoint(target, i, x, y, Math.cos(t * 7) * 0.13);
    }
  }

  return target;
}

function ParticleField({ progressRef }: ParticleFieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const positions = useMemo(() => createMortar(), []);
  const shapes = useMemo(
    () => [createMortar(), createBean(), createLocationPin(), createSteam(), createCup()],
    [],
  );

  const scatterVectors = useMemo(() => {
    const vectors = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const a = randomFor(i, 70) * TAU;
      const z = randomFor(i, 71) * 2 - 1;
      const r = Math.sqrt(Math.max(0, 1 - z * z));
      const strength = 0.75 + randomFor(i, 72) * 1.65;
      setPoint(vectors, i, Math.cos(a) * r * strength, Math.sin(a) * r * strength, z * strength);
    }
    return vectors;
  }, []);

  const colors = useMemo(() => {
    const palette = ["#4d2412", "#713517", "#98451e", "#ba672e", "#d89753", "#e9c08b"];
    const data = new Float32Array(PARTICLE_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      color.set(palette[Math.floor(randomFor(i, 90) * palette.length)]);
      data[i * 3] = color.r;
      data[i * 3 + 1] = color.g;
      data[i * 3 + 2] = color.b;
    }
    return data;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const raw = THREE.MathUtils.clamp(progressRef.current, 0, 1) * (shapes.length - 1);
    const fromIndex = Math.min(Math.floor(raw), shapes.length - 1);
    const toIndex = Math.min(fromIndex + 1, shapes.length - 1);
    const local = raw - fromIndex;
    const eased = local * local * (3 - 2 * local);
    const scatter = Math.sin(local * Math.PI) * 0.86;
    const from = shapes[fromIndex];
    const to = shapes[toIndex];
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < array.length; i++) {
      const desired = THREE.MathUtils.lerp(from[i], to[i], eased) + scatterVectors[i] * scatter;
      array[i] += (desired - array[i]) * 0.09;
    }

    attribute.needsUpdate = true;
    points.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.055 + state.pointer.x * 0.025;
    points.rotation.x = state.pointer.y * -0.018;

    const targetX = state.size.width <= 900 ? -0.08 : -2.05;
    const targetScale = state.size.width <= 900 ? 0.88 : 0.94;
    points.position.x += (targetX - points.position.x) * 0.08;
    points.scale.x += (targetScale - points.scale.x) * 0.08;
    points.scale.y += (targetScale - points.scale.y) * 0.08;
    points.scale.z += (targetScale - points.scale.z) * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.036}
        sizeAttenuation
        transparent
        opacity={0.9}
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
    <div className="particle-canvas" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 48 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <ParticleField progressRef={progressRef} />
      </Canvas>
    </div>
  );
}

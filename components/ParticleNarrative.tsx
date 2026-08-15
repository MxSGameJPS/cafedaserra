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
    scatter: Math.pow(Math.sin(linear * Math.PI), 1.6) * 0.30,
  };
}

/*
 * The important difference from the original implementation is the dwell time.
 * A shape is allowed to fully exist on screen before the next morph begins.
 * This keeps the coffee bean readable instead of immediately dissolving.
 */
function getMorphState(progress: number): MorphState {
  if (progress < 0.12) return { from: 0, to: 0, t: 0, scatter: 0 };
  if (progress < 0.20) return transition(progress, 0.12, 0.20, 0, 1);

  // Coffee bean hold: intentionally long.
  if (progress < 0.35) return { from: 1, to: 1, t: 0, scatter: 0 };
  if (progress < 0.46) return transition(progress, 0.35, 0.46, 1, 2);

  // Location pin hold.
  if (progress < 0.58) return { from: 2, to: 2, t: 0, scatter: 0 };
  if (progress < 0.69) return transition(progress, 0.58, 0.69, 2, 3);

  if (progress < 0.80) return { from: 3, to: 3, t: 0, scatter: 0 };
  if (progress < 0.91) return transition(progress, 0.80, 0.91, 3, 4);
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
      const outer = 1.58;
      const radius = Math.sqrt(inner * inner + randomFor(i, 32) * (outer * outer - inner * inner));
      setPoint(
        target,
        i,
        Math.cos(a) * radius,
        0.74 + Math.sin(a) * radius,
        (randomFor(i, 33) - 0.5) * 0.42,
      );
    } else {
      const t = randomFor(i, 34);
      const halfWidth = (1 - t) * 1.20 + 0.06;
      const x = (randomFor(i, 35) * 2 - 1) * halfWidth;
      const edgeLift = Math.pow(Math.abs(x) / Math.max(halfWidth, 0.001), 2) * 0.18;
      setPoint(target, i, x, -0.42 - t * 2.35 + edgeLift, (randomFor(i, 36) - 0.5) * 0.38);
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
      (randomFor(i, 42) - 0.5) * 0.34;
    const z = Math.cos(t * 7.4 + lane) * 0.12 + (randomFor(i, 43) - 0.5) * 0.30;
    setPoint(target, i, x, y, z);
  }

  return target;
}

function createFinalFlow() {
  const target = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const t = randomFor(i, 51);
    const y = 3.15 - t * 6.0;
    const taper = THREE.MathUtils.lerp(0.46, 0.14, t);
    const swirl = Math.sin(t * 11.0 + (i % 4) * 1.1) * taper;
    setPoint(
      target,
      i,
      swirl + (randomFor(i, 52) - 0.5) * (0.30 + taper),
      y,
      (randomFor(i, 53) - 0.5) * (0.48 - t * 0.18),
    );
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
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const positions = useMemo(() => {
    const data = new Float32Array(AMBIENT_COUNT * 3);
    for (let i = 0; i < AMBIENT_COUNT; i++) {
      const angle = randomFor(i, 101) * TAU;
      const radius = 1.25 + Math.pow(randomFor(i, 102), 0.58) * 3.3;
      setPoint(
        data,
        i,
        Math.cos(angle) * radius - 1.45,
        Math.sin(angle) * radius * 0.68 + (randomFor(i, 103) - 0.5) * 1.15,
        (randomFor(i, 104) - 0.5) * 4.6,
      );
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
        ref={materialRef}
        size={0.021}
        sizeAttenuation
        transparent
        opacity={0.36}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ParticleField({ progressRef }: ParticleFieldProps) {
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
      const strength = 0.48 + randomFor(i, 72) * 1.18;
      setPoint(vectors, i, Math.cos(a) * r * strength, Math.sin(a) * r * strength, z * strength);
    }
    return vectors;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    if (!points) return;

    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    const morph = getMorphState(progress);
    const from = shapes[morph.from];
    const to = shapes[morph.to];
    const attribute = points.geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < array.length; i++) {
      const desired = THREE.MathUtils.lerp(from[i], to[i], morph.t) + scatterVectors[i] * morph.scatter;
      array[i] += (desired - array[i]) * 0.12;
    }

    attribute.needsUpdate = true;
    points.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.035 + state.pointer.x * 0.016;
    points.rotation.x = state.pointer.y * -0.012;

    const isMobile = state.size.width <= 900;
    const locationIn = THREE.MathUtils.smoothstep(progress, 0.39, 0.46);
    const locationOut = THREE.MathUtils.smoothstep(progress, 0.58, 0.66);
    const locationPresence = locationIn * (1 - locationOut);
    const closingPresence = THREE.MathUtils.smoothstep(progress, 0.66, 0.78);

    let targetX = -2.28;
    let targetScale = 0.98;

    if (isMobile) {
      targetX = -0.04;
      targetScale = 0.84;
    } else {
      // The pin lives in the visual corridor between photography and copy.
      targetX = THREE.MathUtils.lerp(targetX, -0.55, locationPresence);
      targetScale = THREE.MathUtils.lerp(targetScale, 0.64, locationPresence);
      targetX = THREE.MathUtils.lerp(targetX, -0.48, closingPresence);
      targetScale = THREE.MathUtils.lerp(targetScale, 0.90, closingPresence);
    }

    points.position.x += (targetX - points.position.x) * 0.085;
    points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, targetScale, 0.085));

    if (materialRef.current) {
      const locationOpacity = THREE.MathUtils.lerp(0.93, 0.88, locationPresence);
      materialRef.current.opacity = THREE.MathUtils.lerp(locationOpacity, 0.18, closingPresence);
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
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

      const locationPhase = progress >= 0.40 && progress <= 0.61;
      const closing = THREE.MathUtils.smoothstep(progress, 0.66, 0.79);
      const cupReveal = THREE.MathUtils.smoothstep(progress, 0.80, 0.93);
      const steamLift = THREE.MathUtils.lerp(54, -16, closing);
      const beanDrift = THREE.MathUtils.lerp(42, -38, closing);

      document.documentElement.classList.toggle("location-phase", locationPhase);
      document.documentElement.classList.toggle("closing-phase", progress >= 0.66);

      if (closingRef.current) {
        closingRef.current.style.opacity = String(closing);
      }
      if (smokeRef.current) {
        smokeRef.current.style.opacity = String(0.22 + closing * 0.60);
        smokeRef.current.style.transform = `translate3d(-50%, ${steamLift}px, 0) scale(${0.94 + closing * 0.06})`;
      }
      if (beansARef.current) {
        beansARef.current.style.opacity = String(0.18 + closing * 0.72);
        beansARef.current.style.transform = `translate3d(-50%, ${beanDrift}px, 0) scale(${0.92 + closing * 0.08})`;
      }
      if (beansBRef.current) {
        beansBRef.current.style.opacity = String(0.08 + closing * 0.34);
        beansBRef.current.style.transform = `translate3d(-50%, ${-beanDrift * 0.34}px, 0) scale(.86)`;
      }
      if (cupRef.current) {
        cupRef.current.style.opacity = String(cupReveal);
        cupRef.current.style.transform = `translate3d(-50%, ${THREE.MathUtils.lerp(68, 0, cupReveal)}px, 0) scale(${0.94 + cupReveal * 0.06})`;
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
      <style>{`
        .reference-smoke-layer { display: none !important; }

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
          .scene-title { text-wrap: pretty; }
        }

        .closing-visual {
          position: fixed;
          z-index: 4;
          pointer-events: none;
          left: 20vw;
          top: 0;
          width: min(31vw, 590px);
          height: 100svh;
          opacity: 0;
          overflow: visible;
          transition: opacity .12s linear;
        }

        .closing-smoke,
        .closing-beans,
        .closing-cup {
          position: absolute;
          left: 50%;
          will-change: transform, opacity;
        }

        .closing-smoke {
          bottom: min(29vh, 270px);
          width: min(19vw, 310px);
          height: 73vh;
          background: url('/fumaca.png') center 44% / 510% auto no-repeat;
          mix-blend-mode: screen;
          filter: brightness(.72) contrast(1.05) saturate(.20) blur(.6px);
          transform-origin: center bottom;
        }

        .closing-beans {
          background-image: url('/graoDeCafeCaindo.png');
          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
          transform-origin: center;
        }

        .closing-beans--a {
          top: 7vh;
          width: min(19vw, 300px);
          height: 66vh;
        }

        .closing-beans--b {
          top: 21vh;
          width: min(12vw, 190px);
          height: 53vh;
          filter: brightness(.66) blur(.6px);
        }

        .closing-cup {
          bottom: 1.5vh;
          width: min(29vw, 510px);
          height: min(39vh, 390px);
          opacity: 0;
          transform-origin: center bottom;
        }

        @media (max-width: 900px) {
          .closing-visual { left: 2vw; width: 96vw; }
          .closing-smoke { width: 42vw; height: 62vh; bottom: 31vh; }
          .closing-beans--a { width: 42vw; }
          .closing-beans--b { width: 26vw; }
          .closing-cup { width: min(76vw, 470px); bottom: 5vh; }
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

      <div className="closing-visual" ref={closingRef} aria-hidden="true">
        <div className="closing-smoke" ref={smokeRef} />
        <div className="closing-beans closing-beans--a" ref={beansARef} />
        <div className="closing-beans closing-beans--b" ref={beansBRef} />
        <div className="closing-cup" ref={cupRef} />
      </div>
    </>
  );
}

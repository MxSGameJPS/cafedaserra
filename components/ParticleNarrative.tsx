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

// Closing scenes no longer try to draw a literal steam icon or a cup with points.
// They become a loose vertical current that supports the photographic smoke/bean
// transition rendered in the DOM.
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
    const z =
      Math.cos(t * 7.4 + lane) * 0.12 +
      (randomFor(i, 43) - 0.5) * 0.30;

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
    const x = swirl + (randomFor(i, 52) - 0.5) * (0.30 + taper);
    const z = (randomFor(i, 53) - 0.5) * (0.48 - t * 0.18);
    setPoint(target, i, x, y, z);
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
    const raw = progress * (shapes.length - 1);
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
    const closingPresence = THREE.MathUtils.smoothstep(progress, 0.60, 0.76);
    const targetX = isMobile ? -0.04 : THREE.MathUtils.lerp(-2.28, -0.48, closingPresence);
    const targetScale = isMobile ? 0.84 : THREE.MathUtils.lerp(0.98, 0.90, closingPresence);
    points.position.x += (targetX - points.position.x) * 0.075;
    points.scale.setScalar(THREE.MathUtils.lerp(points.scale.x, targetScale, 0.075));

    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.lerp(0.93, 0.48, closingPresence);
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

function CoffeeCupArtwork() {
  return (
    <svg viewBox="0 0 520 360" role="presentation">
      <defs>
        <linearGradient id="cupBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2b130a" />
          <stop offset="34%" stopColor="#7a3c1c" />
          <stop offset="58%" stopColor="#b76b36" />
          <stop offset="78%" stopColor="#5a2914" />
          <stop offset="100%" stopColor="#1b0b06" />
        </linearGradient>
        <radialGradient id="coffeeSurface" cx="44%" cy="38%" r="72%">
          <stop offset="0%" stopColor="#5a2711" />
          <stop offset="48%" stopColor="#2a1008" />
          <stop offset="100%" stopColor="#100503" />
        </radialGradient>
        <linearGradient id="rimGlow" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5a2a14" />
          <stop offset="50%" stopColor="#d28a50" />
          <stop offset="100%" stopColor="#4b2110" />
        </linearGradient>
        <filter id="cupTexture" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" seed="8" result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0.42 0 0 0 0.08  0 0.23 0 0 0.03  0 0 0.12 0 0.01  0 0 0 .52 0"
            result="grain"
          />
          <feBlend in="SourceGraphic" in2="grain" mode="soft-light" />
        </filter>
        <filter id="cupShadow" x="-30%" y="-30%" width="160%" height="180%">
          <feGaussianBlur stdDeviation="13" />
        </filter>
      </defs>

      <ellipse cx="238" cy="316" rx="182" ry="24" fill="#000" opacity=".58" filter="url(#cupShadow)" />
      <ellipse cx="238" cy="292" rx="178" ry="29" fill="#3b1a0d" opacity=".95" />
      <ellipse cx="238" cy="287" rx="154" ry="18" fill="#8c4a25" opacity=".42" />

      <path
        d="M96 102 C104 170 119 247 176 274 C202 286 274 286 302 272 C355 245 367 169 375 102 Z"
        fill="url(#cupBody)"
        filter="url(#cupTexture)"
      />
      <path
        d="M369 139 C434 127 468 160 462 207 C457 248 423 266 380 250"
        fill="none"
        stroke="#6f351a"
        strokeWidth="30"
        strokeLinecap="round"
        opacity=".98"
        filter="url(#cupTexture)"
      />
      <path
        d="M374 151 C421 143 445 165 441 199 C438 226 416 238 385 231"
        fill="none"
        stroke="#160905"
        strokeWidth="15"
        strokeLinecap="round"
      />

      <ellipse cx="235" cy="103" rx="141" ry="31" fill="#231008" stroke="url(#rimGlow)" strokeWidth="13" />
      <ellipse cx="235" cy="103" rx="123" ry="22" fill="url(#coffeeSurface)" />
      <ellipse cx="222" cy="96" rx="72" ry="9" fill="#d69a62" opacity=".16" />
      <path d="M115 150 C139 236 167 262 210 272" fill="none" stroke="#d18a4c" strokeWidth="5" opacity=".18" />
      <path d="M343 132 C334 209 313 249 285 267" fill="none" stroke="#f0bb7c" strokeWidth="4" opacity=".15" />
    </svg>
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

      const closing = THREE.MathUtils.smoothstep(progress, 0.58, 0.72);
      const cupReveal = THREE.MathUtils.smoothstep(progress, 0.78, 0.93);
      const steamLift = THREE.MathUtils.lerp(42, -18, closing);
      const beanDrift = THREE.MathUtils.lerp(36, -54, closing);

      document.documentElement.classList.toggle("closing-phase", progress >= 0.60);

      if (closingRef.current) {
        closingRef.current.style.opacity = String(closing);
      }
      if (smokeRef.current) {
        smokeRef.current.style.opacity = String(0.34 + closing * 0.48);
        smokeRef.current.style.transform = `translate3d(-50%, ${steamLift}px, 0) scale(${0.92 + closing * 0.08})`;
      }
      if (beansARef.current) {
        beansARef.current.style.opacity = String(0.22 + closing * 0.46);
        beansARef.current.style.transform = `translate3d(-50%, ${beanDrift}px, 0) rotate(-7deg)`;
      }
      if (beansBRef.current) {
        beansBRef.current.style.opacity = String(0.16 + closing * 0.38);
        beansBRef.current.style.transform = `translate3d(-50%, ${-beanDrift * 0.58}px, 0) rotate(8deg) scale(.92)`;
      }
      if (cupRef.current) {
        cupRef.current.style.opacity = String(cupReveal);
        cupRef.current.style.transform = `translate3d(-50%, ${THREE.MathUtils.lerp(96, 0, cupReveal)}px, 0) scale(${0.90 + cupReveal * 0.10})`;
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
      <style>{`
        /* The old fixed smoke layer is intentionally disabled. The closing
           transition below is now the single source of smoke between 04 and 05. */
        .reference-smoke-layer { display: none !important; }

        html.closing-phase .coffee-beans-layer {
          opacity: .055 !important;
          transition: opacity .35s ease !important;
        }

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

        .closing-visual {
          position: fixed;
          z-index: 4;
          pointer-events: none;
          left: 20vw;
          top: 0;
          width: min(31vw, 590px);
          height: 100svh;
          opacity: 0;
          transition: opacity .12s linear;
          overflow: visible;
        }

        .closing-smoke {
          position: absolute;
          left: 50%;
          bottom: min(29vh, 270px);
          width: min(19vw, 310px);
          height: 73vh;
          background-image: url('/fumaca.png');
          background-repeat: no-repeat;
          background-size: 510% auto;
          background-position: center 44%;
          mix-blend-mode: screen;
          filter: brightness(.72) contrast(1.05) saturate(.20) blur(.6px);
          transform-origin: center bottom;
          -webkit-mask-image: linear-gradient(to top, #000 0%, #000 72%, rgba(0,0,0,.68) 85%, transparent 100%);
          mask-image: linear-gradient(to top, #000 0%, #000 72%, rgba(0,0,0,.68) 85%, transparent 100%);
          will-change: transform, opacity;
        }

        .closing-beans {
          position: absolute;
          left: 50%;
          width: min(13vw, 210px);
          background-image: url('/cafe.png');
          background-repeat: no-repeat;
          filter: brightness(.94) saturate(.90) contrast(1.08);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0%, #000 12%, #000 88%, transparent 100%);
          will-change: transform, opacity;
        }

        .closing-beans--a {
          top: 7vh;
          height: 58vh;
          background-size: 510px auto;
          background-position: 54% 7%;
        }

        .closing-beans--b {
          top: 31vh;
          height: 49vh;
          width: min(16vw, 250px);
          background-size: 590px auto;
          background-position: 43% 56%;
          filter: brightness(.78) saturate(.82) blur(.15px);
        }

        .closing-cup {
          position: absolute;
          z-index: 3;
          left: 50%;
          bottom: 1.5vh;
          width: min(29vw, 510px);
          opacity: 0;
          transform-origin: center bottom;
          will-change: transform, opacity;
          filter: drop-shadow(0 28px 32px rgba(0,0,0,.48));
        }

        .closing-cup svg {
          display: block;
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .closing-visual::after {
          content: "";
          position: absolute;
          z-index: 2;
          left: 50%;
          bottom: 8vh;
          width: min(28vw, 470px);
          height: 24vh;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at center, rgba(190,102,42,.20), rgba(84,38,15,.08) 44%, transparent 72%);
          filter: blur(16px);
        }

        @media (max-width: 900px) {
          .closing-visual {
            left: 2vw;
            width: 96vw;
          }
          .closing-smoke {
            width: 42vw;
            height: 62vh;
            bottom: 31vh;
            background-size: 500% auto;
          }
          .closing-beans {
            width: 31vw;
          }
          .closing-beans--b {
            width: 37vw;
          }
          .closing-cup {
            width: min(76vw, 470px);
            bottom: 5vh;
          }
          html.closing-phase .coffee-beans-layer {
            opacity: .035 !important;
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

      <div className="closing-visual" ref={closingRef} aria-hidden="true">
        <div className="closing-smoke" ref={smokeRef} />
        <div className="closing-beans closing-beans--a" ref={beansARef} />
        <div className="closing-beans closing-beans--b" ref={beansBRef} />
        <div className="closing-cup" ref={cupRef}>
          <CoffeeCupArtwork />
        </div>
      </div>
    </>
  );
}

"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";

const EXPERIENCE_PARTICLE_COUNT = 12000;
const TAU = Math.PI * 2;

type FieldProps = {
  presenceRef: MutableRefObject<number>;
};

function hash(n: number) {
  const value = Math.sin(n * 12.9898) * 43758.5453123;
  return value - Math.floor(value);
}

function randomFor(index: number, salt: number) {
  return hash(index * 19.17 + salt * 83.31);
}

function ExperienceField({ presenceRef }: FieldProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);

  const positions = useMemo(() => {
    const data = new Float32Array(EXPERIENCE_PARTICLE_COUNT * 3);

    for (let i = 0; i < EXPERIENCE_PARTICLE_COUNT; i++) {
      const band = i % 5;
      const xNorm = randomFor(i, 1) * 2 - 1;
      const depth = randomFor(i, 2);
      const width = 5.25 * (0.72 + depth * 0.28);
      const x = xNorm * width;

      const wave =
        Math.sin(xNorm * Math.PI * (1.15 + band * 0.16) + band * 0.85) *
        (0.42 + band * 0.08);
      const verticalBand = (band - 2) * 0.54;
      const spread = (randomFor(i, 3) - 0.5) * (1.0 + depth * 0.8);
      const y = verticalBand + wave + spread;

      const z = -0.5 - depth * 1.8 + (randomFor(i, 4) - 0.5) * 0.34;

      data[i * 3] = x;
      data[i * 3 + 1] = y;
      data[i * 3 + 2] = z;
    }

    return data;
  }, []);

  const colors = useMemo(() => {
    const palette = ["#4b2110", "#6f3015", "#91431b", "#b35c29", "#cb783d", "#e19d63", "#efbf90"];
    const data = new Float32Array(EXPERIENCE_PARTICLE_COUNT * 3);
    const color = new THREE.Color();

    for (let i = 0; i < EXPERIENCE_PARTICLE_COUNT; i++) {
      color.set(palette[Math.floor(randomFor(i, 8) * palette.length)]);
      data[i * 3] = color.r;
      data[i * 3 + 1] = color.g;
      data[i * 3 + 2] = color.b;
    }

    return data;
  }, []);

  useFrame((state) => {
    const points = pointsRef.current;
    const material = materialRef.current;
    if (!points || !material) return;

    const presence = THREE.MathUtils.clamp(presenceRef.current, 0, 1);
    const eased = presence * presence * (3 - 2 * presence);
    const isMobile = state.size.width <= 900;

    const targetScaleX = THREE.MathUtils.lerp(0.28, isMobile ? 0.88 : 1.06, eased);
    const targetScaleY = THREE.MathUtils.lerp(0.52, isMobile ? 0.90 : 1.0, eased);

    points.scale.x += (targetScaleX - points.scale.x) * 0.09;
    points.scale.y += (targetScaleY - points.scale.y) * 0.09;
    points.scale.z += (1 - points.scale.z) * 0.09;

    points.rotation.z = Math.sin(state.clock.elapsedTime * 0.07) * 0.012;
    points.rotation.y = state.pointer.x * 0.006;
    points.position.y = Math.sin(state.clock.elapsedTime * 0.14) * 0.045;

    material.opacity = eased * (isMobile ? 0.30 : 0.42);
    material.size = THREE.MathUtils.lerp(0.018, 0.025, eased);
    points.visible = presence > 0.008;
  });

  return (
    <points ref={pointsRef} frustumCulled={false} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.018}
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

export default function ExperienceParticleBackdrop() {
  const presenceRef = useRef(0);

  useEffect(() => {
    const update = () => {
      const section = document.getElementById("experiencia");
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const viewport = Math.max(1, window.innerHeight);
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(center - viewport / 2);
      const reach = Math.max(viewport * 0.62, rect.height * 0.56);
      const linear = THREE.MathUtils.clamp(1 - distance / reach, 0, 1);
      const presence = linear * linear * (3 - 2 * linear);

      presenceRef.current = presence;
      document.documentElement.classList.toggle("experience-phase", presence > 0.08);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      document.documentElement.classList.remove("experience-phase");
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <>
      <style>{`
        .experience-particle-backdrop {
          position: fixed;
          inset: 0;
          z-index: 3;
          pointer-events: none;
        }

        /* In act 04 the primary morph retreats and the expanded field becomes
           the atmospheric layer. The content itself stays in front. */
        html.experience-phase .particle-canvas {
          opacity: .08 !important;
        }

        .experience-scene .scene-visual {
          z-index: 7 !important;
        }

        .experience-scene .scene-copy {
          z-index: 9 !important;
        }

        .experience-scene .scene-media {
          opacity: .84;
          box-shadow: 0 0 0 1px rgba(246,239,230,.025);
        }

        @media (max-width: 900px) {
          .experience-scene .scene-visual {
            z-index: 7 !important;
          }

          .experience-scene .scene-copy {
            z-index: 9 !important;
          }
        }
      `}</style>

      <div className="experience-particle-backdrop" aria-hidden="true">
        <Canvas
          camera={{ position: [0, 0, 7.2], fov: 48 }}
          dpr={[1, 1.35]}
          gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        >
          <ExperienceField presenceRef={presenceRef} />
        </Canvas>
      </div>
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import ReservationModal from "@/components/ReservationModal";

const scenes = [
  {
    id: "01",
    eyebrow: "Café da Serra",
    title: "Um momento. Um sabor. Uma pausa.",
    body: "Entre Dois Irmãos e Ivoti, um lugar para desacelerar, encontrar pessoas e saborear um bom café.",
    start: -0.02,
    holdStart: 0,
    holdEnd: 0.135,
    end: 0.195,
  },
  {
    id: "02",
    eyebrow: "Quem somos",
    title: "Mais do que café.",
    body: "Uma pausa no caminho, uma conversa entre amigos, um encontro em família ou aquele café entre uma reunião e outra. Um espaço para aproveitar o momento, no seu ritmo.",
    start: 0.16,
    holdStart: 0.205,
    holdEnd: 0.315,
    end: 0.375,
  },
  {
    id: "03",
    eyebrow: "Onde estamos",
    title: "No caminho. Perto de você.",
    body: "Shopping Portal da Serra · BR-116, km 230 · entre Dois Irmãos e Ivoti/RS.",
    start: 0.35,
    holdStart: 0.405,
    holdEnd: 0.535,
    end: 0.595,
  },
  {
    id: "04",
    eyebrow: "Experiência",
    title: "Um lugar para ficar.",
    body: "Um lugar para estar com quem você gosta, para trabalhar, conversar, ler um livro ou simplesmente saborear um bom café.",
    start: 0.57,
    holdStart: 0.625,
    holdEnd: 0.755,
    end: 0.815,
  },
  {
    id: "05",
    eyebrow: "Sua próxima pausa",
    title: "Sua pausa começa aqui.",
    body: "Alguns caminhos merecem uma pausa. Escolha o seu momento.",
    start: 0.79,
    holdStart: 0.845,
    holdEnd: 1,
    end: 1.01,
  },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function getSceneMotion(progress: number, scene: (typeof scenes)[number]) {
  if (progress <= scene.start || progress >= scene.end) {
    return {
      opacity: 0,
      scale: 0.92,
      blur: 7,
      tracking: 0.035,
      bodyShift: 18,
    };
  }

  if (progress < scene.holdStart) {
    const t = smoothstep(
      (progress - scene.start) / Math.max(0.001, scene.holdStart - scene.start),
    );

    return {
      opacity: t,
      scale: lerp(0.92, 1, t),
      blur: lerp(7, 0, t),
      tracking: lerp(0.035, -0.045, t),
      bodyShift: lerp(18, 0, t),
    };
  }

  if (progress <= scene.holdEnd) {
    return {
      opacity: 1,
      scale: 1,
      blur: 0,
      tracking: -0.045,
      bodyShift: 0,
    };
  }

  const t = smoothstep(
    (progress - scene.holdEnd) / Math.max(0.001, scene.end - scene.holdEnd),
  );

  return {
    opacity: 1 - t,
    scale: lerp(1, 1.075, t),
    blur: lerp(0, 6, t),
    tracking: lerp(-0.045, -0.065, t),
    bodyShift: lerp(0, -8, t),
  };
}

function getActiveScene(progress: number) {
  let current = 0;
  for (let i = 0; i < scenes.length; i += 1) {
    if (progress >= scenes[i].start) current = i;
  }
  return current;
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const scrollProgressRef = useRef(0);
  const renderedProgressRef = useRef(-1);
  const animationRef = useRef<number | null>(null);
  const copyRefs = useRef<Array<HTMLElement | null>>([]);
  const progressNumberRef = useRef<HTMLElement>(null);
  const finalActionsRef = useRef<HTMLDivElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const renderOverlay = (progress: number) => {
      scenes.forEach((scene, index) => {
        const node = copyRefs.current[index];
        if (!node) return;

        const motion = getSceneMotion(progress, scene);
        const visible = motion.opacity > 0.002;

        node.style.visibility = visible ? "visible" : "hidden";
        node.style.opacity = String(motion.opacity);
        node.style.setProperty("--copy-scale", String(motion.scale));
        node.style.setProperty("--copy-blur", `${motion.blur}px`);
        node.style.setProperty("--title-tracking", `${motion.tracking}em`);
        node.style.setProperty("--body-shift", `${motion.bodyShift}px`);
        node.style.pointerEvents = motion.opacity > 0.88 ? "auto" : "none";
        node.setAttribute("aria-hidden", motion.opacity < 0.2 ? "true" : "false");
      });

      const activeScene = getActiveScene(progress);
      if (progressNumberRef.current) {
        progressNumberRef.current.textContent = scenes[activeScene].id;
      }

      const finalActionsPresence = smoothstep((progress - 0.89) / 0.055);
      if (finalActionsRef.current) {
        finalActionsRef.current.style.opacity = String(finalActionsPresence);
        finalActionsRef.current.style.transform = `translate3d(0, ${(1 - finalActionsPresence) * 16}px, 0)`;
        finalActionsRef.current.style.pointerEvents = finalActionsPresence > 0.85 ? "auto" : "none";
      }

      if (scrollCueRef.current) {
        scrollCueRef.current.style.opacity = String(Math.max(0, 1 - progress * 12));
      }
    };

    const updateTargetTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const nextProgress = clamp01(window.scrollY / maxScroll);
      scrollProgressRef.current = nextProgress;
      targetTimeRef.current = nextProgress * Math.max(0, video.duration - 0.04);
    };

    const onMetadata = () => {
      video.pause();
      video.currentTime = 0.001;
      updateTargetTime();
      renderOverlay(scrollProgressRef.current);
      renderedProgressRef.current = scrollProgressRef.current;
      setReady(true);
    };

    const animate = () => {
      if (video.readyState >= 2 && Number.isFinite(video.duration)) {
        const target = targetTimeRef.current;
        const difference = target - video.currentTime;

        if (Math.abs(difference) > 0.012) {
          const step = Math.abs(difference) > 1.25 ? 0.18 : 0.11;
          video.currentTime += difference * step;
        }
      }

      const progress = scrollProgressRef.current;
      if (Math.abs(progress - renderedProgressRef.current) > 0.00005) {
        renderOverlay(progress);
        renderedProgressRef.current = progress;
      }

      animationRef.current = window.requestAnimationFrame(animate);
    };

    if (video.readyState >= 1) onMetadata();

    video.addEventListener("loadedmetadata", onMetadata);
    window.addEventListener("scroll", updateTargetTime, { passive: true });
    window.addEventListener("resize", updateTargetTime);

    updateTargetTime();
    renderOverlay(scrollProgressRef.current);
    renderedProgressRef.current = scrollProgressRef.current;
    animationRef.current = window.requestAnimationFrame(animate);

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      window.removeEventListener("scroll", updateTargetTime);
      window.removeEventListener("resize", updateTargetTime);
      if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <main className={`video-experience${ready ? " is-ready" : ""}`}>
      <h1 className="sr-only">Café da Serra</h1>

      <video
        ref={videoRef}
        className="video-experience__film"
        src="/video.mp4"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      />

      <div className="video-experience__shade" aria-hidden="true" />

      <a className="video-brand" href="#top" aria-label="Café da Serra">
        <span>Café da</span>
        <strong>Serra</strong>
      </a>

      <div className="video-progress" aria-hidden="true">
        <strong ref={progressNumberRef}>01</strong>
        <span />
        <small>05</small>
      </div>

      <div className="video-copy-layer" id="top">
        {scenes.map((scene, index) => (
          <section
            key={scene.id}
            ref={(node) => {
              copyRefs.current[index] = node;
            }}
            className={`video-copy${scene.id === "01" ? " video-copy--hero" : ""}${scene.id === "05" ? " video-copy--final" : ""}`}
            style={{
              opacity: scene.id === "01" ? 1 : 0,
              visibility: scene.id === "01" ? "visible" : "hidden",
            }}
            aria-hidden={scene.id === "01" ? "false" : "true"}
          >
            <p className="video-copy__eyebrow">{scene.eyebrow}</p>
            <h2 className="video-copy__title">{scene.title}</h2>
            <p className="video-copy__body">{scene.body}</p>

            {scene.id === "05" && (
              <div
                ref={finalActionsRef}
                className="video-copy__actions"
                style={{ opacity: 0, pointerEvents: "none" }}
              >
                <button type="button" onClick={() => setReservationOpen(true)}>
                  Reservar uma mesa
                </button>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Portal+da+Serra+BR-116+km+230"
                  target="_blank"
                  rel="noreferrer"
                >
                  Como chegar
                </a>
              </div>
            )}
          </section>
        ))}
      </div>

      <div ref={scrollCueRef} className="video-scroll-cue" aria-hidden="true">
        <span />
        Role para explorar
      </div>

      <div className="video-experience__track" aria-hidden="true" />
      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </main>
  );
}

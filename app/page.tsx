"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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
    position: "right",
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
    position: "right",
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
    position: "left",
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
    position: "right",
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
    position: "center",
  },
] as const;

function smoothstep(value: number) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function scenePresence(
  progress: number,
  start: number,
  holdStart: number,
  holdEnd: number,
  end: number,
) {
  if (progress <= start || progress >= end) return 0;
  if (progress >= holdStart && progress <= holdEnd) return 1;

  if (progress < holdStart) {
    return smoothstep((progress - start) / Math.max(0.001, holdStart - start));
  }

  return 1 - smoothstep((progress - holdEnd) / Math.max(0.001, end - holdEnd));
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [reservationOpen, setReservationOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let scheduled = false;

    const updateTargetTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const nextProgress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      targetTimeRef.current = nextProgress * Math.max(0, video.duration - 0.04);

      if (!scheduled) {
        scheduled = true;
        window.requestAnimationFrame(() => {
          setProgress(nextProgress);
          scheduled = false;
        });
      }
    };

    const onMetadata = () => {
      video.pause();
      video.currentTime = 0.001;
      updateTargetTime();
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

      animationRef.current = window.requestAnimationFrame(animate);
    };

    if (video.readyState >= 1) onMetadata();

    video.addEventListener("loadedmetadata", onMetadata);
    window.addEventListener("scroll", updateTargetTime, { passive: true });
    window.addEventListener("resize", updateTargetTime);

    updateTargetTime();
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

      <div className="video-copy-layer" id="top">
        {scenes.map((scene) => {
          const presence = scenePresence(
            progress,
            scene.start,
            scene.holdStart,
            scene.holdEnd,
            scene.end,
          );

          const style = {
            opacity: presence,
            "--copy-lift": `${(1 - presence) * 28}px`,
            pointerEvents: presence > 0.82 ? "auto" : "none",
          } as CSSProperties;

          return (
            <section
              key={scene.id}
              className={`video-copy video-copy--${scene.position}`}
              style={style}
              aria-hidden={presence < 0.2}
            >
              <div className="video-copy__index">{scene.id}</div>
              <p className="video-copy__eyebrow">{scene.eyebrow}</p>
              <h2 className="video-copy__title">{scene.title}</h2>
              <p className="video-copy__body">{scene.body}</p>

              {scene.id === "05" && (
                <div className="video-copy__actions">
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
          );
        })}
      </div>

      <div className="video-scroll-cue" style={{ opacity: Math.max(0, 1 - progress * 12) }} aria-hidden="true">
        <span />
        Role para explorar
      </div>

      <div className="video-experience__track" aria-hidden="true" />
      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </main>
  );
}

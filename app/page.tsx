"use client";

import { useEffect, useRef, useState } from "react";
import ReservationModal from "@/components/ReservationModal";

const scenes = [
  {
    id: "01",
    eyebrow: "Café da Serra",
    title: "Um momento. Um sabor. Uma pausa.",
    body: "Entre Dois Irmãos e Ivoti, um lugar para desacelerar, encontrar pessoas e saborear um bom café.",
    start: 0,
  },
  {
    id: "02",
    eyebrow: "Quem somos",
    title: "Mais do que café.",
    body: "Uma pausa no caminho, uma conversa entre amigos, um encontro em família ou aquele café entre uma reunião e outra. Um espaço para aproveitar o momento, no seu ritmo.",
    start: 0.18,
  },
  {
    id: "03",
    eyebrow: "Onde estamos",
    title: "No caminho. Perto de você.",
    body: "Shopping Portal da Serra · BR-116, km 230 · entre Dois Irmãos e Ivoti/RS.",
    start: 0.38,
  },
  {
    id: "04",
    eyebrow: "Experiência",
    title: "Um lugar para ficar.",
    body: "Um lugar para estar com quem você gosta, para trabalhar, conversar, ler um livro ou simplesmente saborear um bom café.",
    start: 0.60,
  },
  {
    id: "05",
    eyebrow: "Sua próxima pausa",
    title: "Sua pausa começa aqui.",
    body: "Alguns caminhos merecem uma pausa. Escolha o seu momento.",
    start: 0.82,
  },
] as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function getActiveScene(progress: number) {
  let current = 0;
  for (let i = 1; i < scenes.length; i += 1) {
    if (progress >= scenes[i].start) current = i;
  }
  return current;
}

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const copyRefs = useRef<Array<HTMLElement | null>>([]);
  const activeSceneRef = useRef(-1);
  const progressNumberRef = useRef<HTMLElement>(null);
  const scrollCueRef = useRef<HTMLDivElement>(null);
  const scrollCueVisibleRef = useRef(true);
  const [ready, setReady] = useState(false);
  const [reservationOpen, setReservationOpen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const activateScene = (index: number) => {
      if (activeSceneRef.current === index) return;

      copyRefs.current.forEach((node, nodeIndex) => {
        if (!node) return;
        const active = nodeIndex === index;
        node.classList.toggle("is-active", active);
        node.setAttribute("aria-hidden", active ? "false" : "true");
      });

      if (progressNumberRef.current) {
        progressNumberRef.current.textContent = scenes[index].id;
      }

      activeSceneRef.current = index;
    };

    const updateTargetTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = clamp01(window.scrollY / maxScroll);
      targetTimeRef.current = progress * Math.max(0, video.duration - 0.04);

      activateScene(getActiveScene(progress));

      const shouldShowCue = progress < 0.012;
      if (scrollCueRef.current && scrollCueVisibleRef.current !== shouldShowCue) {
        scrollCueRef.current.style.opacity = shouldShowCue ? "1" : "0";
        scrollCueVisibleRef.current = shouldShowCue;
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
            className={`video-copy${index === 0 ? " is-active video-copy--hero" : ""}${scene.id === "05" ? " video-copy--final" : ""}`}
            aria-hidden={index === 0 ? "false" : "true"}
          >
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

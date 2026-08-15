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

    const mobileMedia = window.matchMedia("(max-width: 900px)");
    const coarsePointerMedia = window.matchMedia("(pointer: coarse)");
    const seekableVideo = video as HTMLVideoElement & {
      fastSeek?: (time: number) => void;
    };

    let lastMobileSeekAt = 0;
    let playPromisePending = false;

    const isMobileMode = () => mobileMedia.matches || coarsePointerMedia.matches;

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

    const pausePlayback = () => {
      if (!video.paused) video.pause();
    };

    const startPlayback = () => {
      if (!video.paused || playPromisePending || video.seeking) return;

      playPromisePending = true;
      const result = video.play();

      if (result && typeof result.finally === "function") {
        result
          .catch(() => undefined)
          .finally(() => {
            playPromisePending = false;
          });
      } else {
        playPromisePending = false;
      }
    };

    const seekMobile = (time: number, now: number) => {
      if (video.seeking || now - lastMobileSeekAt < 150) return false;

      const safeTime = Math.max(0.001, Math.min(time, Math.max(0.001, video.duration - 0.04)));
      pausePlayback();

      if (typeof seekableVideo.fastSeek === "function") {
        seekableVideo.fastSeek(safeTime);
      } else {
        video.currentTime = safeTime;
      }

      lastMobileSeekAt = now;
      return true;
    };

    const updateDesktopVideo = () => {
      const target = targetTimeRef.current;
      const difference = target - video.currentTime;

      if (Math.abs(difference) > 0.012) {
        const step = Math.abs(difference) > 1.25 ? 0.18 : 0.11;
        video.currentTime += difference * step;
      }
    };

    const updateMobileVideo = (now: number) => {
      const target = targetTimeRef.current;
      const difference = target - video.currentTime;
      const distance = Math.abs(difference);

      // Close enough: stop native playback and let the current decoded frame rest.
      if (distance < 0.09) {
        pausePlayback();
        video.playbackRate = 1;
        return;
      }

      // Scrolling backwards cannot be reproduced natively. Seek in controlled intervals.
      if (difference < 0) {
        if (distance > 0.12) seekMobile(target, now);
        return;
      }

      // A very fast swipe can move the target several seconds ahead. Do one coarse
      // jump instead of flooding the decoder with dozens of currentTime assignments.
      if (distance > 1.8 && now - lastMobileSeekAt >= 220 && !video.seeking) {
        const jump = video.currentTime + distance * 0.58;
        if (seekMobile(jump, now)) return;
      }

      // For forward movement, native playback is substantially cheaper on mobile
      // than repeatedly seeking to arbitrary frames.
      const desiredRate = Math.min(4, Math.max(0.75, distance * 1.65));
      if (Math.abs(video.playbackRate - desiredRate) > 0.15) {
        video.playbackRate = desiredRate;
      }
      startPlayback();
    };

    const onMetadata = () => {
      video.pause();
      video.playbackRate = 1;
      video.currentTime = 0.001;
      updateTargetTime();
      setReady(true);
    };

    const animate = (now: number) => {
      if (video.readyState >= 2 && Number.isFinite(video.duration)) {
        if (isMobileMode()) {
          updateMobileVideo(now);
        } else {
          pausePlayback();
          video.playbackRate = 1;
          updateDesktopVideo();
        }
      }

      animationRef.current = window.requestAnimationFrame(animate);
    };

    const onModeChange = () => {
      pausePlayback();
      video.playbackRate = 1;
      lastMobileSeekAt = 0;
      updateTargetTime();
    };

    if (video.readyState >= 1) onMetadata();

    video.addEventListener("loadedmetadata", onMetadata);
    window.addEventListener("scroll", updateTargetTime, { passive: true });
    window.addEventListener("resize", updateTargetTime);
    mobileMedia.addEventListener?.("change", onModeChange);
    coarsePointerMedia.addEventListener?.("change", onModeChange);

    updateTargetTime();
    animationRef.current = window.requestAnimationFrame(animate);

    return () => {
      video.removeEventListener("loadedmetadata", onMetadata);
      window.removeEventListener("scroll", updateTargetTime);
      window.removeEventListener("resize", updateTargetTime);
      mobileMedia.removeEventListener?.("change", onModeChange);
      coarsePointerMedia.removeEventListener?.("change", onModeChange);
      pausePlayback();
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

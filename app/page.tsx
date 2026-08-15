"use client";

import { useEffect, useRef, useState } from "react";

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTargetTime = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      targetTimeRef.current = progress * Math.max(0, video.duration - 0.04);
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

      <div className="video-experience__track" aria-hidden="true" />
    </main>
  );
}

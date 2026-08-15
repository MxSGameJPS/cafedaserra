"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ParticleNarrative from "@/components/ParticleNarrative";
import ReservationModal from "@/components/ReservationModal";

const scenes = ["Início", "Quem somos", "Onde estamos", "Experiência", "Final"];

export default function HomePage() {
  const [reservationOpen, setReservationOpen] = useState(false);
  const [activeScene, setActiveScene] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const normalized = Math.min(1, Math.max(0, window.scrollY / max));
      setProgress(normalized);
      setActiveScene(Math.min(4, Math.round(normalized * 4)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <main className="site-shell">
      <ParticleNarrative />
      <div className="particle-vignette" />

      <header className="site-header">
        <a href="#inicio" className="brand" aria-label="Café da Serra - início">
          Café da
          <strong>Serra</strong>
        </a>
        <div className="header-actions">
          <a className="header-link" href="#experiencia">Experiência</a>
          <a className="header-link" href="#localizacao">Localização</a>
          <button className="reserve-button" type="button" onClick={() => setReservationOpen(true)}>
            Reservar uma mesa
          </button>
        </div>
      </header>

      <aside className="progress-rail" aria-hidden="true">
        <div className="progress-index">0{activeScene + 1}</div>
        <div className="progress-label">{scenes[activeScene]}</div>
        <div className="progress-line">
          <div className="progress-fill" style={{ height: `${progress * 168}px` }} />
        </div>
      </aside>

      <div className="story">
        <section className="scene hero" id="inicio">
          <div className="scene-inner">
            <div className="scene-space" />
            <div className="scene-copy">
              <div className="scene-kicker">Portal da Serra · BR-116</div>
              <h1 className="scene-title">Café da Serra</h1>
              <div className="hero-tagline">Um momento. Um sabor. Uma pausa.</div>
              <div className="scroll-hint">
                <span className="scroll-mouse" />
                role para explorar
              </div>
            </div>
          </div>
        </section>

        <section className="scene" id="sobre">
          <div className="scene-inner">
            <div className="scene-copy">
              <div className="scene-kicker">01 · Quem somos</div>
              <h2 className="scene-title small">Mais do que café.</h2>
              <p className="scene-body">
                Uma pausa no caminho, uma conversa entre amigos, um encontro em família ou aquele
                café entre uma reunião e outra. Um espaço para desacelerar e aproveitar o momento,
                no seu ritmo.
              </p>
            </div>
            <div className="scene-space" />
          </div>
        </section>

        <section className="scene" id="localizacao">
          <div className="scene-inner">
            <div className="scene-space" />
            <div className="scene-copy">
              <div className="scene-kicker">02 · Onde estamos</div>
              <h2 className="scene-title small">No caminho. Perto de você.</h2>
              <p className="scene-body">
                Entre Dois Irmãos e Ivoti, o Café da Serra encontra quem está chegando, partindo ou
                simplesmente procurando um bom motivo para fazer uma pausa.
              </p>
              <div className="location-card">
                <span className="pin-dot" />
                <div>
                  <strong>Shopping Portal da Serra</strong>
                  <span>BR-116 · km 230 · entre Dois Irmãos e Ivoti/RS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="scene" id="experiencia">
          <div className="scene-inner">
            <div className="scene-copy">
              <div className="scene-kicker">03 · Experiência</div>
              <h2 className="scene-title small">Para conversar. Para ficar.</h2>
              <p className="scene-body">
                Um ambiente que combina com diferentes momentos: uma tarde em família, uma conversa
                tranquila, alguns minutos só para você ou uma reunião acompanhada de um bom café.
              </p>
              <div className="scene-meta">
                <span>Família</span><span>Encontros</span><span>Reuniões</span><span>Pausa</span>
              </div>
            </div>
            <div className="scene-space" />
          </div>
        </section>

        <section className="scene final-scene" id="final">
          <div className="scene-inner">
            <div className="scene-space" />
            <div className="scene-copy final-lockup">
              <div className="scene-kicker">04 · Um convite para fazer uma pausa</div>
              <h2 className="scene-title">Café da Serra</h2>
              <p className="scene-body">
                Alguns caminhos merecem uma pausa. Escolha o seu momento e solicite uma mesa.
              </p>
              <div className="final-actions">
                <button className="action-primary" type="button" onClick={() => setReservationOpen(true)}>
                  Reservar uma mesa
                </button>
                <a
                  className="action-secondary"
                  href="https://www.google.com/maps/search/?api=1&query=Portal+da+Serra+BR-116+km+230"
                  target="_blank"
                  rel="noreferrer"
                >
                  Como chegar
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="site-footer">
        <span>Café da Serra · Portal da Serra · BR-116 km 230</span>
        <Link href="/admin">Painel de reservas</Link>
      </footer>

      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </main>
  );
}

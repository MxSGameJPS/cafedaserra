"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ParticleNarrative from "@/components/ParticleNarrative";
import ReservationModal from "@/components/ReservationModal";

const scenes = ["Início", "Quem somos", "Onde estamos", "Experiência", "Final"];

export default function HomePage() {
  const [reservationOpen, setReservationOpen] = useState(false);
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const update = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const normalized = Math.min(1, Math.max(0, window.scrollY / max));
      setActiveScene(Math.min(4, Math.round(normalized * 4)));
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <main className="site-shell">
      <ParticleNarrative />
      <div className="particle-vignette" aria-hidden="true" />

      <header className="site-header">
        <a href="#inicio" className="brand" aria-label="Café da Serra - início">
          Café da <span>Serra</span>
        </a>

        <nav className="header-nav" aria-label="Navegação principal">
          <a className="header-link" href="#sobre">Quem somos</a>
          <a className="header-link" href="#localizacao">Localização</a>
          <a className="header-link" href="#experiencia">Experiência</a>
        </nav>

        <button className="reserve-button" type="button" onClick={() => setReservationOpen(true)}>
          Reservar uma mesa
        </button>
      </header>

      <aside className="story-status" aria-hidden="true">
        <strong>0{activeScene + 1}</strong>
        <span>/ 05</span>
        <small>{scenes[activeScene]}</small>
      </aside>

      <div className="story">
        <section className="scene scene--copy-left hero" id="inicio">
          <div className="scene-inner">
            <div className="scene-copy">
              <div className="scene-kicker">01 · Portal da Serra · BR-116</div>
              <h1 className="scene-title">
                Café da Serra
                <span>A pausa no caminho.</span>
              </h1>
              <p className="scene-body hero-copy">
                Entre Dois Irmãos e Ivoti, um lugar para desacelerar, encontrar pessoas e saborear um bom café.
              </p>
              <div className="scroll-hint">
                <span className="scroll-line" />
                role para explorar
              </div>
            </div>
            <div className="scene-visual" aria-hidden="true" />
          </div>
        </section>

        <section className="scene scene--copy-right" id="sobre">
          <div className="scene-inner">
            <div className="scene-visual" aria-hidden="true" />
            <div className="scene-copy">
              <div className="scene-kicker">02 · Quem somos</div>
              <h2 className="scene-title small">Mais do que café.</h2>
              <p className="scene-body">
                Uma pausa no caminho, uma conversa entre amigos, um encontro em família ou aquele café entre uma reunião e outra.
                Um espaço para desacelerar e aproveitar o momento, no seu ritmo.
              </p>
            </div>
          </div>
        </section>

        <section className="scene scene--copy-left" id="localizacao">
          <div className="scene-inner">
            <div className="scene-copy">
              <div className="scene-kicker">03 · Onde estamos</div>
              <h2 className="scene-title small">No caminho. Perto de você.</h2>
              <p className="scene-body">
                Entre Dois Irmãos e Ivoti, o Café da Serra encontra quem está chegando, partindo ou simplesmente procurando um bom motivo para fazer uma pausa.
              </p>
              <div className="location-line">
                <i aria-hidden="true" />
                <div>
                  <strong>Shopping Portal da Serra</strong>
                  BR-116 · km 230 · entre Dois Irmãos e Ivoti/RS
                </div>
              </div>
            </div>
            <div className="scene-visual" aria-hidden="true">
              <div className="scene-media scene-media--shopping" />
            </div>
          </div>
        </section>

        <section className="scene scene--copy-right" id="experiencia">
          <div className="scene-inner">
            <div className="scene-visual" aria-hidden="true">
              <div className="scene-media scene-media--interior" />
            </div>
            <div className="scene-copy">
              <div className="scene-kicker">04 · Experiência</div>
              <h2 className="scene-title small">Um lugar para ficar.</h2>
              <p className="scene-body">
                Um lugar para estar com quem você gosta, para trabalhar, conversar, ler um livro ou simplesmente saborear um bom café.
              </p>
            </div>
          </div>
        </section>

        <section className="scene scene--copy-left final-scene" id="final">
          <div className="scene-inner">
            <div className="scene-copy final-lockup">
              <div className="scene-kicker">05 · Sua próxima pausa</div>
              <h2 className="scene-title small">Sua pausa começa aqui.</h2>
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
            <div className="scene-visual" aria-hidden="true" />
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

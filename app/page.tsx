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

  const smokeProgress = Math.min(1, Math.max(0, (progress - 0.68) / 0.22));
  const beanDrift = Math.sin(progress * Math.PI * 1.4);

  return (
    <main className="site-shell">
      <ParticleNarrative />

      <div
        className="coffee-beans-layer coffee-beans-layer--near"
        aria-hidden="true"
        style={{
          opacity: 0.27 + progress * 0.035,
          transform: `translate3d(${beanDrift * -9}px, ${progress * -18}px, 0) scale(1.02)`,
        }}
      />
      <div
        className="coffee-beans-layer coffee-beans-layer--far"
        aria-hidden="true"
        style={{
          opacity: 0.12 + progress * 0.025,
          transform: `translate3d(${beanDrift * 12}px, ${progress * 12}px, 0) rotate(10deg) scale(1.08)`,
        }}
      />
      <div
        className="reference-smoke-layer"
        aria-hidden="true"
        style={{
          opacity: smokeProgress * 0.96,
          transform: `translate3d(0, ${46 - smokeProgress * 46}px, 0) scale(${0.96 + smokeProgress * 0.05})`,
        }}
      />

      <div className="particle-vignette" />

      <style>{`
        .coffee-beans-layer {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background-image: url('/cafe.png');
          background-repeat: no-repeat;
          will-change: transform, opacity;
          transition: opacity .18s linear;
        }

        .coffee-beans-layer--near {
          background-size: min(69vw, 1120px) auto;
          background-position: 4vw 5vh;
          filter: brightness(.72) saturate(.88) contrast(1.08);
        }

        .coffee-beans-layer--far {
          background-size: min(46vw, 760px) auto;
          background-position: 96% 72%;
          filter: brightness(.52) saturate(.72) blur(.45px);
          transform-origin: center;
        }

        .reference-smoke-layer {
          position: fixed;
          z-index: 2;
          pointer-events: none;
          left: 17vw;
          bottom: 31vh;
          width: min(27vw, 460px);
          height: min(59vh, 560px);
          overflow: hidden;
          background-image: url('/fumaca.png');
          background-repeat: no-repeat;
          /* fumaca.png is a 1920x1080 transparent canvas whose visible smoke
             occupies only the central portion. Zoom the source inside this
             viewport instead of fitting the entire transparent canvas. */
          background-size: 300% auto;
          background-position: center 44%;
          mix-blend-mode: screen;
          filter: brightness(.92) contrast(1.16) sepia(.08) saturate(.52);
          transform-origin: center bottom;
          will-change: opacity, transform;
          transition: opacity .1s linear;
        }

        @media (min-width: 901px) {
          .site-shell .scene {
            padding-left: 6vw;
            padding-right: 6vw;
          }

          .site-shell .scene-inner,
          .site-shell .hero .scene-inner,
          .site-shell .final-scene .scene-inner {
            width: min(1380px, 88vw);
            max-width: none;
            margin-left: auto;
            margin-right: auto;
            grid-template-columns: minmax(0, 1.12fr) minmax(430px, .88fr);
            gap: clamp(52px, 4.6vw, 86px);
          }

          .site-shell .scene-copy,
          .site-shell .hero .scene-copy,
          .site-shell .final-scene .scene-copy {
            width: min(560px, 100%);
            justify-self: start;
          }

          .site-shell .hero .scene-copy {
            width: min(620px, 100%);
          }

          .site-shell .hero .scene-title {
            font-size: clamp(52px, 5vw, 82px);
            white-space: nowrap;
            letter-spacing: -.035em;
          }

          .site-shell .scene-title.small {
            font-size: clamp(46px, 4.65vw, 76px);
          }

          .site-shell .scene-body {
            max-width: 500px;
          }

          .site-shell .final-lockup {
            width: min(570px, 100%);
          }
        }

        @media (max-width: 900px) {
          .coffee-beans-layer--near {
            background-size: 126vw auto;
            background-position: 42% 12vh;
            opacity: .16 !important;
          }

          .coffee-beans-layer--far {
            display: none;
          }

          .reference-smoke-layer {
            left: 7vw;
            bottom: 34vh;
            width: 86vw;
            height: 50vh;
            background-size: 280% auto;
            background-position: center 45%;
          }
        }
      `}</style>

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

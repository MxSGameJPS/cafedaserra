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

  const smokeProgress = Math.min(1, Math.max(0, (progress - 0.82) / 0.14));
  const beanDrift = Math.sin(progress * Math.PI * 1.4);
  const experiencePresence = Math.max(0, 1 - Math.abs(progress - 0.75) / 0.14);
  const nearBeanOpacity = (0.27 + progress * 0.035) * (1 - experiencePresence * 0.62);
  const farBeanOpacity = (0.12 + progress * 0.025) * (1 - experiencePresence * 0.72);

  return (
    <main className="site-shell">
      <ParticleNarrative />

      <div
        className="coffee-beans-layer coffee-beans-layer--near"
        aria-hidden="true"
        style={{
          opacity: nearBeanOpacity,
          transform: `translate3d(${beanDrift * -9}px, ${progress * -18}px, 0) scale(1.02)`,
        }}
      />
      <div
        className="coffee-beans-layer coffee-beans-layer--far"
        aria-hidden="true"
        style={{
          opacity: farBeanOpacity,
          transform: `translate3d(${beanDrift * 12}px, ${progress * 12}px, 0) rotate(10deg) scale(1.08)`,
        }}
      />
      <div
        className="reference-smoke-layer"
        aria-hidden="true"
        style={{
          opacity: smokeProgress * 0.78,
          transform: `translate3d(0, ${24 - smokeProgress * 24}px, 0) scale(${0.90 + smokeProgress * 0.10})`,
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
          left: 24.5vw;
          bottom: 48vh;
          width: min(13.5vw, 235px);
          height: min(35vh, 335px);
          overflow: hidden;
          background-image: url('/fumaca.png');
          background-repeat: no-repeat;
          background-size: 520% auto;
          background-position: center 47%;
          mix-blend-mode: screen;
          filter: brightness(.76) contrast(1.08) saturate(.28) blur(.35px);
          transform-origin: center bottom;
          will-change: opacity, transform;
          transition: opacity .1s linear;
          -webkit-mask-image: linear-gradient(to top, #000 0%, #000 78%, transparent 100%);
          mask-image: linear-gradient(to top, #000 0%, #000 78%, transparent 100%);
        }

        .scene-photo {
          position: relative;
          min-height: min(63vh, 610px);
          isolation: isolate;
        }

        .scene-photo::before,
        .scene-photo::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }

        .scene-photo::before {
          inset: 2% -4% 2% -8%;
          background-repeat: no-repeat;
          background-size: cover;
          background-position: center;
          opacity: .72;
          filter: brightness(.50) sepia(.34) saturate(.78) contrast(1.14);
          -webkit-mask-image: radial-gradient(ellipse at 50% 50%, #000 38%, rgba(0,0,0,.94) 58%, rgba(0,0,0,.40) 79%, transparent 97%);
          mask-image: radial-gradient(ellipse at 50% 50%, #000 38%, rgba(0,0,0,.94) 58%, rgba(0,0,0,.40) 79%, transparent 97%);
          z-index: -2;
        }

        .scene-photo::after {
          inset: 0 -6% 0 -10%;
          background:
            linear-gradient(90deg, rgba(5,3,2,.66) 0%, rgba(5,3,2,.08) 26%, rgba(5,3,2,.08) 67%, rgba(5,3,2,.74) 100%),
            radial-gradient(circle at 58% 46%, rgba(190,102,42,.14), transparent 52%);
          z-index: -1;
        }

        .scene-photo--shopping::before {
          background-image: url('/shopping.png');
          background-position: center 52%;
        }

        .scene-photo--interior::before {
          background-image: url('/cafeteriaInterno.png');
          background-position: center 52%;
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

          /* Experiência: foto sólida à esquerda, corredor central para o motion
             e copy limpa à direita, como na referência aprovada. */
          .experience-scene .scene-inner {
            width: min(1460px, 92vw);
            grid-template-columns: minmax(0, 1.20fr) minmax(110px, .23fr) minmax(360px, .57fr);
            gap: 0;
          }

          .experience-scene .scene-photo {
            grid-column: 1;
            grid-row: 1;
            min-height: min(67vh, 640px);
          }

          .experience-scene .experience-transition {
            grid-column: 2;
            grid-row: 1;
            min-height: min(67vh, 640px);
            position: relative;
          }

          .experience-scene .scene-copy {
            grid-column: 3 !important;
            grid-row: 1;
            width: min(390px, 100%);
            justify-self: start;
            padding-left: clamp(28px, 3vw, 52px);
            position: relative;
            z-index: 5;
          }

          .experience-scene .scene-copy::before {
            content: "";
            position: absolute;
            z-index: -1;
            inset: -34% -28% -34% -90px;
            background: linear-gradient(90deg, transparent 0%, rgba(5,3,2,.76) 24%, rgba(5,3,2,.96) 55%, #050302 82%);
            pointer-events: none;
          }

          .experience-scene .scene-photo--interior::before {
            inset: 0 -12% 0 -15%;
            opacity: .96;
            filter: brightness(.50) sepia(.30) saturate(.82) contrast(1.16);
            -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 65%, rgba(0,0,0,.94) 77%, rgba(0,0,0,.38) 91%, transparent 100%);
            mask-image: linear-gradient(90deg, #000 0%, #000 65%, rgba(0,0,0,.94) 77%, rgba(0,0,0,.38) 91%, transparent 100%);
          }

          .experience-scene .scene-photo--interior::after {
            inset: 0 -12% 0 -15%;
            background:
              linear-gradient(90deg, rgba(5,3,2,.20) 0%, rgba(5,3,2,.02) 52%, rgba(5,3,2,.18) 72%, rgba(5,3,2,.94) 100%),
              radial-gradient(circle at 54% 45%, rgba(184,107,50,.11), transparent 55%);
          }

          .experience-scene .scene-title.small {
            font-size: clamp(31px, 2.8vw, 44px);
            line-height: 1;
            letter-spacing: .015em;
          }

          .experience-scene .scene-body {
            max-width: 350px;
            margin-top: 18px;
            font-size: clamp(14px, 1vw, 16px);
            line-height: 1.55;
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
            left: 36vw;
            bottom: 48vh;
            width: 28vw;
            height: 31vh;
            background-size: 500% auto;
            background-position: center 47%;
          }

          .scene-photo {
            display: block !important;
            position: absolute;
            inset: 10vh 0 auto 0;
            min-height: 54vh;
            opacity: .72;
          }

          .scene-photo::before {
            inset: 0 -14vw;
            -webkit-mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 68%, transparent 100%);
            mask-image: linear-gradient(to bottom, transparent 0%, #000 18%, #000 68%, transparent 100%);
          }

          .experience-transition {
            display: none;
          }

          .experience-scene .scene-photo--interior::before {
            opacity: .80;
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
            <div className="scene-space scene-photo scene-photo--shopping" aria-hidden="true" />
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

        <section className="scene experience-scene" id="experiencia">
          <div className="scene-inner">
            <div className="scene-space scene-photo scene-photo--interior" aria-hidden="true" />
            <div className="experience-transition" aria-hidden="true" />
            <div className="scene-copy">
              <div className="scene-kicker">03 · Experiência</div>
              <h2 className="scene-title small">Experiência</h2>
              <p className="scene-body">
                Um lugar para estar com quem você gosta, para trabalhar, conversar, ler um livro ou
                simplesmente saborear um bom café.
              </p>
            </div>
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

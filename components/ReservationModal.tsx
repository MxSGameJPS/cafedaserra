"use client";

import { FormEvent, useEffect, useState } from "react";
import { createReservation } from "@/lib/reservations";

type Props = {
  open: boolean;
  onClose: () => void;
};

const initialForm = {
  name: "",
  whatsapp: "",
  date: "",
  time: "",
  guests: "2",
  notes: "",
};

export default function ReservationModal({ open, onClose }: Props) {
  const [form, setForm] = useState(initialForm);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createReservation({
      name: form.name.trim(),
      whatsapp: form.whatsapp.trim(),
      date: form.date,
      time: form.time,
      guests: Number(form.guests),
      notes: form.notes.trim(),
    });
    setSuccess(true);
  };

  const close = () => {
    setSuccess(false);
    setForm(initialForm);
    onClose();
  };

  const minDate = new Date().toISOString().slice(0, 10);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={close}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        {success ? (
          <>
            <div className="success-mark">✓</div>
            <h2 id="reservation-title">Pedido recebido.</h2>
            <p>
              Sua solicitação entrou no painel do Café da Serra. A equipe poderá entrar em contato
              pelo WhatsApp informado para confirmar a disponibilidade da mesa.
            </p>
            <button className="form-submit" type="button" onClick={close}>
              Voltar ao site
            </button>
          </>
        ) : (
          <>
            <div className="modal-top">
              <div>
                <div className="scene-kicker">Café da Serra</div>
                <h2 id="reservation-title">Reserve sua mesa.</h2>
              </div>
              <button className="close-button" type="button" aria-label="Fechar" onClick={close}>
                ×
              </button>
            </div>
            <p>
              Envie sua preferência de data e horário. A solicitação não representa confirmação
              automática: nossa equipe confirma a reserva pelo WhatsApp.
            </p>

            <form onSubmit={submit}>
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="name">Nome</label>
                  <input
                    id="name"
                    required
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="field full">
                  <label htmlFor="whatsapp">WhatsApp</label>
                  <input
                    id="whatsapp"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="(51) 99999-9999"
                  />
                </div>
                <div className="field">
                  <label htmlFor="date">Data</label>
                  <input
                    id="date"
                    required
                    type="date"
                    min={minDate}
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="time">Horário</label>
                  <input
                    id="time"
                    required
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                  />
                </div>
                <div className="field full">
                  <label htmlFor="guests">Quantidade de pessoas</label>
                  <select
                    id="guests"
                    value={form.guests}
                    onChange={(e) => setForm({ ...form, guests: e.target.value })}
                  >
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((guests) => (
                      <option value={guests} key={guests}>
                        {guests} {guests === 1 ? "pessoa" : "pessoas"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="notes">Observação</label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Ex.: reunião de trabalho, cadeira para criança, comemoração..."
                  />
                </div>
              </div>
              <p className="form-note">A equipe do Café da Serra confirmará a reserva antes do horário solicitado.</p>
              <button className="form-submit" type="submit">
                Solicitar reserva
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

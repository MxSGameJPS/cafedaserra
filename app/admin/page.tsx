"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getReservations,
  Reservation,
  ReservationStatus,
  subscribeReservations,
  updateReservationStatus,
} from "@/lib/reservations";

const statusLabels: Record<ReservationStatus, string> = {
  nova: "Nova",
  contato: "Em contato",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

function formatDate(date: string) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  const refresh = () => setReservations(getReservations());

  useEffect(() => {
    refresh();
    return subscribeReservations(refresh);
  }, []);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      new: reservations.filter((item) => item.status === "nova").length,
      confirmed: reservations.filter((item) => item.status === "confirmada").length,
      contact: reservations.filter((item) => item.status === "contato").length,
    }),
    [reservations],
  );

  const changeStatus = (id: string, status: ReservationStatus) => {
    updateReservationStatus(id, status);
    refresh();
  };

  return (
    <main className="admin-page">
      <div className="admin-top">
        <div>
          <div className="admin-eyebrow">Café da Serra · Área interna</div>
          <h1 className="admin-title">Reservas</h1>
        </div>
        <Link className="admin-back" href="/">
          Voltar ao site
        </Link>
      </div>

      <section className="admin-stats" aria-label="Resumo das reservas">
        <div className="stat-card"><span>Total</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>Novas</span><strong>{stats.new}</strong></div>
        <div className="stat-card"><span>Em contato</span><strong>{stats.contact}</strong></div>
        <div className="stat-card"><span>Confirmadas</span><strong>{stats.confirmed}</strong></div>
      </section>

      <section className="reservation-list">
        {reservations.length === 0 ? (
          <div className="empty-state">
            Nenhuma solicitação ainda. Faça uma reserva pela página inicial para testar o fluxo.
          </div>
        ) : (
          reservations.map((reservation) => {
            const whatsapp = reservation.whatsapp.replace(/\D/g, "");
            const whatsappHref = `https://wa.me/${whatsapp.startsWith("55") ? whatsapp : `55${whatsapp}`}`;

            return (
              <article className="reservation-card" key={reservation.id}>
                <div>
                  <h3>{reservation.name}</h3>
                  <p>{reservation.guests} {reservation.guests === 1 ? "pessoa" : "pessoas"}</p>
                  {reservation.notes ? <p>{reservation.notes}</p> : null}
                </div>
                <div className="reservation-time">
                  <strong>{reservation.time}</strong>
                  <p>{formatDate(reservation.date)}</p>
                </div>
                <div>
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    <h3>{reservation.whatsapp}</h3>
                    <p>Abrir WhatsApp</p>
                  </a>
                </div>
                <div>
                  <select
                    className="status-select"
                    value={reservation.status}
                    onChange={(event) =>
                      changeStatus(reservation.id, event.target.value as ReservationStatus)
                    }
                    aria-label={`Status da reserva de ${reservation.name}`}
                  >
                    {(Object.keys(statusLabels) as ReservationStatus[]).map((status) => (
                      <option value={status} key={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })
        )}
      </section>

      <p className="admin-note">
        Prévia comercial: nesta primeira versão as reservas ficam salvas no navegador para demonstrar
        o fluxo sem exigir infraestrutura externa. Para produção, a camada de dados já está isolada
        para ser substituída por banco de dados e autenticação do painel.
      </p>
    </main>
  );
}

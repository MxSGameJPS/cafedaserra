export type ReservationStatus = "nova" | "contato" | "confirmada" | "cancelada";

export type Reservation = {
  id: string;
  name: string;
  whatsapp: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status: ReservationStatus;
  createdAt: string;
};

export type ReservationInput = Omit<Reservation, "id" | "status" | "createdAt">;

const STORAGE_KEY = "cafe-da-serra-reservations-v1";
const EVENT_NAME = "cafe-da-serra-reservations-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getReservations(): Reservation[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const reservations = JSON.parse(raw) as Reservation[];
    return reservations.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  } catch {
    return [];
  }
}

function saveReservations(reservations: Reservation[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function createReservation(input: ReservationInput) {
  const reservation: Reservation = {
    ...input,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    status: "nova",
    createdAt: new Date().toISOString(),
  };

  saveReservations([reservation, ...getReservations()]);
  return reservation;
}

export function updateReservationStatus(id: string, status: ReservationStatus) {
  const reservations = getReservations().map((reservation) =>
    reservation.id === id ? { ...reservation, status } : reservation,
  );
  saveReservations(reservations);
}

export function subscribeReservations(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT_NAME, callback);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT_NAME, callback);
  };
}

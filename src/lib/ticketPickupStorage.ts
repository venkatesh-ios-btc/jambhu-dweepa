const KEY = 'jambhu_ticket_pickup_v1';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type TicketPickupStored = {
  paymentId: string;
  qrToken: string;
  ticketCode: string;
  mobile: string;
  area: string;
  exp: number;
};

export function saveTicketPickup(payload: Omit<TicketPickupStored, 'exp'>): void {
  try {
    const exp = Date.now() + TTL_MS;
    sessionStorage.setItem(KEY, JSON.stringify({ ...payload, exp }));
  } catch {
    /* private mode / quota */
  }
}

export function readTicketPickup(): TicketPickupStored | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as TicketPickupStored;
    if (!p?.qrToken || !p?.ticketCode || !p?.paymentId) return null;
    if (typeof p.exp === 'number' && p.exp < Date.now()) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

/** Match admin entry + booking: strip optional JD- prefix so `804` and `JD-804` are the same. */
export function normalizeTicketCode(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(/^\s*JD-?/i, '').trim();
}

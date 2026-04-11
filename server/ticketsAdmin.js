import crypto from 'crypto';
import Ticket from './models/Ticket.js';

function firstQuery(val) {
  if (val == null) return '';
  if (Array.isArray(val)) return String(val[0] ?? '').trim();
  return String(val).trim();
}

/**
 * @param {import('express').Express} app
 */
export function registerTicketAdminRoutes(app) {
  /**
   * Guest recovery: payment success page can reload; React Router state is lost.
   * Razorpay payment ids look like pay_xxxxx (unguessable enough for this flow).
   * Optional ticketCode disambiguates if razorpayPaymentId was not stored (legacy / race).
   */
  app.get('/tickets/pickup', async (req, res) => {
    const paymentId = firstQuery(req.query.paymentId);
    const ticketCodeHint = firstQuery(req.query.ticketCode);
    if (!paymentId || !paymentId.startsWith('pay_')) {
      return res.status(400).json({ error: 'bad_request' });
    }
    try {
      let ticket = await Ticket.findOne({ razorpayPaymentId: paymentId, isUsed: true });

      if (!ticket && ticketCodeHint) {
        const t2 = await Ticket.findOne({ code: ticketCodeHint, isUsed: true });
        if (
          t2 &&
          (!t2.razorpayPaymentId ||
            String(t2.razorpayPaymentId).trim() === paymentId ||
            String(t2.razorpayPaymentId).trim() === '')
        ) {
          ticket = t2;
          if (!ticket.razorpayPaymentId || String(ticket.razorpayPaymentId).trim() === '') {
            ticket.razorpayPaymentId = paymentId;
          }
        }
      }

      if (!ticket || !ticket.isUsed) {
        console.warn('tickets/pickup: not_found paymentId=%s codeHint=%s', paymentId, ticketCodeHint || '(none)');
        return res.status(404).json({ error: 'not_found' });
      }

      if (!ticket.qrToken) {
        ticket.qrToken = crypto.randomBytes(20).toString('hex');
      }
      await ticket.save();

      return res.json({
        paymentId: ticket.razorpayPaymentId || paymentId,
        qrToken: ticket.qrToken,
        ticketCode: ticket.code,
        mobile: ticket.customerMobile || '',
        area: ticket.customerArea || '',
      });
    } catch (err) {
      console.error('tickets/pickup:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });

  /** Customer tapped "Download PDF" — audit trail only. */
  app.post('/tickets/pdf-downloaded', async (req, res) => {
    const raw = req.body?.qrToken;
    const qrToken = typeof raw === 'string' ? raw.trim() : '';
    if (!qrToken) {
      return res.status(400).json({ error: 'qrToken_required' });
    }
    try {
      const ticket = await Ticket.findOne({ qrToken });
      if (!ticket || !ticket.isUsed) {
        return res.status(404).json({ error: 'not_found' });
      }
      ticket.pdfDownloadedAt = new Date();
      await ticket.save();
      return res.json({ ok: true });
    } catch (err) {
      console.error('pdf-downloaded:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });

  /** Admin scanner: verify gate entry (idempotent for already verified). */
  app.post('/admin/verify-scan', async (req, res) => {
    const raw = req.body?.qrToken;
    let qrToken = typeof raw === 'string' ? raw.trim() : '';
    if (!qrToken) {
      return res.status(400).json({ error: 'qrToken_required' });
    }
    // Allow scanning full URL from QR
    try {
      const u = new URL(qrToken);
      const t = u.searchParams.get('t');
      if (t) qrToken = t.trim();
    } catch {
      /* plain token */
    }

    try {
      const ticket = await Ticket.findOne({ qrToken });
      if (!ticket) {
        return res.json({ status: 'invalid' });
      }
      if (!ticket.isUsed) {
        return res.json({ status: 'not_paid' });
      }

      const already = Boolean(ticket.entryVerifiedAt);
      if (!already) {
        ticket.entryVerifiedAt = new Date();
        await ticket.save();
      }

      return res.json({
        status: already ? 'already_verified' : 'verified',
        ticket: {
          code: ticket.code,
          customerMobile: ticket.customerMobile,
          customerArea: ticket.customerArea,
          razorpayPaymentId: ticket.razorpayPaymentId,
          paidAt: ticket.paidAt,
          entryVerifiedAt: ticket.entryVerifiedAt,
          pdfDownloadedAt: ticket.pdfDownloadedAt,
        },
      });
    } catch (err) {
      console.error('verify-scan:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });

  app.get('/admin/paid-tickets', async (_req, res) => {
    try {
      const rows = await Ticket.find({ isUsed: true })
        .sort({ paidAt: -1, updatedAt: -1 })
        .limit(200)
        .lean();

      const tickets = rows.map((t) => ({
        code: t.code,
        customerMobile: t.customerMobile || '—',
        customerArea: t.customerArea || '—',
        razorpayPaymentId: t.razorpayPaymentId || '—',
        paidAt: t.paidAt,
        entryVerifiedAt: t.entryVerifiedAt,
        pdfDownloadedAt: t.pdfDownloadedAt,
        qrTokenSuffix: t.qrToken ? `…${String(t.qrToken).slice(-8)}` : '—',
        qrToken: t.qrToken || null,
      }));

      return res.json({ tickets });
    } catch (err) {
      console.error('paid-tickets:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });
}

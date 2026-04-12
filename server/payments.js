import crypto from 'crypto';
import Ticket from './models/Ticket.js';
import { normalizeTicketCode } from './ticketCode.js';
import { loadRazorpayCredentials } from './razorpayEnv.js';
import { razorpayCreateOrder, razorpayPingAuth } from './razorpayApi.js';

function razorpayErrMessage(err) {
  const d = err?.error?.description ?? err?.error?.message;
  if (typeof d === 'string' && d.trim()) return d.trim();
  if (typeof err?.error === 'string' && err.error.trim()) return err.error.trim();
  if (err?.message) return String(err.message);
  return 'Razorpay request failed';
}

/**
 * @param {import('express').Express} app
 */
export function registerPaymentRoutes(app) {
  const { keyId, keySecret } = loadRazorpayCredentials();
  const configured = Boolean(keyId && keySecret);

  app.get('/payments/health', (req, res) => {
    res.json({
      ok: true,
      razorpayConfigured: configured,
    });
  });

  if (process.env.RAZORPAY_DEBUG_AUTH === '1') {
    app.get('/payments/test-auth', async (req, res) => {
      if (!configured) {
        return res.status(503).json({ error: 'payments_unconfigured' });
      }
      try {
        const { status, ok, data } = await razorpayPingAuth(keyId, keySecret);
        return res.json({
          httpStatus: status,
          authenticated: ok,
          razorpayError: data?.error ?? null,
        });
      } catch (e) {
        return res.status(500).json({ error: String(e.message) });
      }
    });
  }

  app.post('/payments/create-order', async (req, res) => {
    if (!configured) {
      return res.status(503).json({ error: 'payments_unconfigured' });
    }

    const ticketCode = normalizeTicketCode(req.body?.ticketCode);
    if (!ticketCode) {
      return res.status(400).json({ error: 'ticket_required' });
    }

    try {
      const ticket = await Ticket.findOne({ code: ticketCode });
      if (!ticket) {
        return res.status(400).json({ error: 'ticket_not_found' });
      }
      if (ticket.isUsed) {
        return res.status(400).json({ error: 'ticket_used' });
      }

      let amountPaise = Math.round(Number(process.env.TICKET_AMOUNT_PAISE) || 10000);
      if (!Number.isFinite(amountPaise) || amountPaise < 100) {
        amountPaise = 10000;
      }

      // Receipt must be unique per order (Razorpay rejects duplicates — retries used to 502).
      const codePart = ticketCode.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 16);
      const receipt = `t_${codePart}_${Date.now()}`.slice(0, 40);

      const order = await razorpayCreateOrder(keyId, keySecret, {
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { ticketCode },
        payment_capture: 1,
      });

      return res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
      });
    } catch (err) {
      const msg = razorpayErrMessage(err);
      console.error('razorpay create order:', msg, err?.error || err);
      return res.status(502).json({ error: 'order_failed', message: msg });
    }
  });

  app.post('/payments/verify', async (req, res) => {
    if (!keySecret) {
      return res.status(503).json({ error: 'payments_unconfigured' });
    }

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      ticketCode: rawCode,
      customerMobile: rawMobile,
      customerArea: rawArea,
    } = req.body || {};

    const ticketCode = normalizeTicketCode(rawCode);
    const customerMobile = typeof rawMobile === 'string' ? rawMobile.trim().slice(0, 32) : '';
    const customerArea = typeof rawArea === 'string' ? rawArea.trim().slice(0, 120) : '';
    if (!orderId || !paymentId || !signature || !ticketCode) {
      return res.status(400).json({ error: 'bad_request' });
    }

    const body = `${orderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex');
    if (expected !== signature) {
      return res.status(400).json({ error: 'bad_signature' });
    }

    try {
      const ticket = await Ticket.findOne({ code: ticketCode });
      if (!ticket || ticket.isUsed) {
        return res.status(400).json({ error: 'invalid_ticket' });
      }

      if (!ticket.qrToken) {
        ticket.qrToken = crypto.randomBytes(20).toString('hex');
      }
      ticket.isUsed = true;
      ticket.razorpayPaymentId = paymentId;
      ticket.paidAt = new Date();
      if (customerMobile) ticket.customerMobile = customerMobile;
      if (customerArea) ticket.customerArea = customerArea;

      await ticket.save();
      return res.json({
        ok: true,
        paymentId,
        qrToken: ticket.qrToken,
        ticketCode: ticket.code,
      });
    } catch (err) {
      console.error('payments verify:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });
}

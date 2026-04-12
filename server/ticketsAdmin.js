import crypto from 'crypto';
import mongoose from 'mongoose';
import Ticket from './models/Ticket.js';

/** @returns {boolean} false if response was sent (503) */
function ensureDbConnected(res) {
  if (mongoose.connection.readyState !== 1) {
    console.error('tickets/admin: MongoDB not connected (readyState=%s)', mongoose.connection.readyState);
    res.status(503).json({ error: 'db_unavailable' });
    return false;
  }
  return true;
}

function firstQuery(val) {
  if (val == null) return '';
  if (Array.isArray(val)) return String(val[0] ?? '').trim();
  return String(val).trim();
}

function sortTicketCodes(codes) {
  const copy = [...codes];
  const allNumeric = copy.every((c) => /^\d+$/.test(String(c)));
  if (allNumeric) copy.sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10));
  else copy.sort();
  return copy;
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
    if (!ensureDbConnected(res)) return;

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
    if (!ensureDbConnected(res)) return;

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

    if (!ensureDbConnected(res)) return;

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
    if (!ensureDbConnected(res)) return;

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

  /**
   * Admin: list ticket rows entered from dashboard — same `tickets` collection used by booking `/validate`.
   */
  app.get('/admin/ticket-details', async (_req, res) => {
    if (!ensureDbConnected(res)) return;
    try {
      const individuals = await Ticket.find({ adminAllocated: true, adminKind: 'individual' })
        .sort({ createdAt: -1 })
        .limit(300)
        .lean();

      const bulkExpanded = await Ticket.aggregate([
        {
          $match: {
            adminAllocated: true,
            adminKind: 'bulk',
            adminBulkGroupId: { $ne: null },
            $or: [{ adminRangeEnd: '' }, { adminRangeEnd: { $exists: false } }],
          },
        },
        {
          $group: {
            _id: '$adminBulkGroupId',
            holderName: { $first: '$adminHolderName' },
            entryDate: { $first: '$adminEntryDate' },
            codes: { $push: '$code' },
            createdAt: { $min: '$createdAt' },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: 200 },
      ]);

      const bulkSingleRow = await Ticket.find({
        adminAllocated: true,
        adminKind: 'bulk',
        adminRangeEnd: { $nin: ['', null] },
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      const entries = [];

      for (const t of individuals) {
        entries.push({
          id: String(t._id),
          type: 'individual',
          ticketNumber: t.code,
          startTicketNumber: '',
          endTicketNumber: '',
          ticketCount: null,
          holderName: t.adminHolderName,
          entryDate: t.adminEntryDate,
          createdAt: t.createdAt,
        });
      }

      for (const row of bulkExpanded) {
        const sorted = sortTicketCodes(row.codes);
        entries.push({
          id: String(row._id),
          type: 'bulk',
          ticketNumber: '',
          startTicketNumber: sorted[0],
          endTicketNumber: sorted[sorted.length - 1],
          ticketCount: row.codes.length,
          holderName: row.holderName,
          entryDate: row.entryDate,
          createdAt: row.createdAt,
        });
      }

      for (const t of bulkSingleRow) {
        entries.push({
          id: String(t._id),
          type: 'bulk',
          ticketNumber: '',
          startTicketNumber: t.code,
          endTicketNumber: t.adminRangeEnd,
          ticketCount: t.adminBulkDeclaredCount,
          holderName: t.adminHolderName,
          entryDate: t.adminEntryDate,
          createdAt: t.createdAt,
        });
      }

      entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json({ entries: entries.slice(0, 500) });
    } catch (err) {
      console.error('ticket-details list:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });

  /** Admin: save to `tickets` so booking verify + payments see the same `code` field. */
  app.post('/admin/ticket-details', async (req, res) => {
    if (!ensureDbConnected(res)) return;
    const body = req.body || {};
    const type = body.type === 'bulk' ? 'bulk' : body.type === 'individual' ? 'individual' : '';
    const holderName = typeof body.holderName === 'string' ? body.holderName.trim() : '';
    const entryDate = typeof body.entryDate === 'string' ? body.entryDate.trim() : '';

    if (!type || !holderName || !entryDate) {
      return res.status(400).json({ error: 'missing_fields' });
    }

    if (type === 'individual') {
      const ticketNumber =
        typeof body.ticketNumber === 'string' ? body.ticketNumber.replace(/^\s*JD-?/i, '').trim() : '';
      if (!ticketNumber) {
        return res.status(400).json({ error: 'ticket_number_required' });
      }
      try {
        const exists = await Ticket.findOne({ code: ticketNumber }).select('_id').lean();
        if (exists) {
          return res.status(400).json({ error: 'duplicate_code', code: ticketNumber });
        }
        const doc = await Ticket.create({
          code: ticketNumber,
          isUsed: false,
          adminAllocated: true,
          adminHolderName: holderName,
          adminEntryDate: entryDate,
          adminKind: 'individual',
        });
        return res.json({
          ok: true,
          entry: {
            id: String(doc._id),
            type: 'individual',
            ticketNumber: doc.code,
            holderName: doc.adminHolderName,
            entryDate: doc.adminEntryDate,
            createdAt: doc.createdAt,
          },
        });
      } catch (err) {
        console.error('ticket-details create individual:', err.message);
        return res.status(500).json({ error: 'server_error' });
      }
    }

    const startTicketNumber =
      typeof body.startTicketNumber === 'string' ? body.startTicketNumber.replace(/^\s*JD-?/i, '').trim() : '';
    const endTicketNumber =
      typeof body.endTicketNumber === 'string' ? body.endTicketNumber.replace(/^\s*JD-?/i, '').trim() : '';
    let ticketCount =
      body.ticketCount != null && body.ticketCount !== ''
        ? Number.parseInt(String(body.ticketCount), 10)
        : NaN;

    if (!startTicketNumber || !endTicketNumber) {
      return res.status(400).json({ error: 'range_required' });
    }

    const startNum = Number.parseInt(startTicketNumber, 10);
    const endNum = Number.parseInt(endTicketNumber, 10);
    const numericRange =
      Number.isFinite(startNum) &&
      Number.isFinite(endNum) &&
      String(startNum) === startTicketNumber &&
      String(endNum) === endTicketNumber;

    if (numericRange) {
      if (endNum < startNum) {
        return res.status(400).json({ error: 'invalid_range' });
      }
      const computed = endNum - startNum + 1;
      if (!Number.isFinite(ticketCount) || ticketCount < 1) {
        ticketCount = computed;
      } else if (ticketCount !== computed) {
        return res.status(400).json({ error: 'count_mismatch', expected: computed });
      }
    } else {
      if (!Number.isFinite(ticketCount) || ticketCount < 1) {
        return res.status(400).json({ error: 'count_required_non_numeric' });
      }
    }

    try {
      if (numericRange) {
        const codes = [];
        for (let n = startNum; n <= endNum; n += 1) codes.push(String(n));
        const clash = await Ticket.find({ code: { $in: codes } })
          .select('code')
          .lean();
        if (clash.length) {
          return res.status(400).json({
            error: 'duplicate_codes',
            codes: clash.map((c) => c.code),
          });
        }
        const groupId = new mongoose.Types.ObjectId();
        await Ticket.insertMany(
          codes.map((code) => ({
            code,
            isUsed: false,
            adminAllocated: true,
            adminHolderName: holderName,
            adminEntryDate: entryDate,
            adminKind: 'bulk',
            adminBulkGroupId: groupId,
          })),
        );
        return res.json({
          ok: true,
          entry: {
            id: String(groupId),
            type: 'bulk',
            startTicketNumber,
            endTicketNumber,
            ticketCount: codes.length,
            holderName,
            entryDate,
            createdAt: new Date(),
          },
        });
      }

      const taken = await Ticket.findOne({ code: startTicketNumber }).select('_id').lean();
      if (taken) {
        return res.status(400).json({ error: 'duplicate_code', code: startTicketNumber });
      }
      const doc = await Ticket.create({
        code: startTicketNumber,
        isUsed: false,
        adminAllocated: true,
        adminHolderName: holderName,
        adminEntryDate: entryDate,
        adminKind: 'bulk',
        adminBulkGroupId: new mongoose.Types.ObjectId(),
        adminRangeEnd: endTicketNumber,
        adminBulkDeclaredCount: ticketCount,
      });
      return res.json({
        ok: true,
        entry: {
          id: String(doc._id),
          type: 'bulk',
          startTicketNumber: doc.code,
          endTicketNumber: doc.adminRangeEnd,
          ticketCount: doc.adminBulkDeclaredCount,
          holderName: doc.adminHolderName,
          entryDate: doc.adminEntryDate,
          createdAt: doc.createdAt,
        },
      });
    } catch (err) {
      console.error('ticket-details create bulk:', err.message);
      return res.status(500).json({ error: 'server_error' });
    }
  });
}

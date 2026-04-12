import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, index: true },
    isUsed: { type: Boolean, default: false },
    /** Opaque token embedded in entry QR (set on successful payment). */
    qrToken: { type: String, unique: true, sparse: true, index: true },
    customerMobile: { type: String, default: '' },
    customerArea: { type: String, default: '' },
    razorpayPaymentId: { type: String, default: '', index: true },
    paidAt: { type: Date, default: null },
    /** Gate scan: first successful admin verification. */
    entryVerifiedAt: { type: Date, default: null },
    pdfDownloadedAt: { type: Date, default: null },
    /** Admin dashboard: ticket allocated here (same collection as paid tickets). */
    adminAllocated: { type: Boolean, default: false, index: true },
    adminHolderName: { type: String, default: '' },
    adminEntryDate: { type: String, default: '' },
    adminKind: { type: String, enum: ['', 'individual', 'bulk'], default: '' },
    adminBulkGroupId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    /** Non-numeric bulk range: one row; verify uses `code` (start). */
    adminRangeEnd: { type: String, default: '' },
    adminBulkDeclaredCount: { type: Number, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('Ticket', ticketSchema);

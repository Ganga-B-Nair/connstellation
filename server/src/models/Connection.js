import mongoose from 'mongoose';

/**
 * A line in the sky. userA/userB are stored SORTED by string id so the unique
 * compound index below really does block duplicate pairs in both directions.
 */
const connectionSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    userA: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userB: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    method: { type: String, enum: ['qr', 'code'], default: 'code' },
    note: { type: String, default: '', maxlength: 200 },
    /** Who initiated — kept for the recap card, not for permissions. */
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

connectionSchema.index({ eventId: 1, userA: 1, userB: 1 }, { unique: true });

/** Always build pairs through this so ordering is consistent. */
export function sortPair(id1, id2) {
  const [a, b] = [String(id1), String(id2)].sort();
  return { userA: a, userB: b };
}

export default mongoose.model('Connection', connectionSchema);

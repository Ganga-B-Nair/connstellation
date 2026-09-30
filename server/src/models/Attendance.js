import mongoose from 'mongoose';

/**
 * One document per (user, event). Holds the star's fixed position, so the same
 * person can appear in several skies at different coordinates.
 */
const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    starPosition: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    /** Short human-typeable code others can enter to connect without a camera. */
    starCode: { type: String, required: true, uppercase: true },
    joinedAt: { type: Date, default: Date.now },
    connectionCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, eventId: 1 }, { unique: true });
attendanceSchema.index({ eventId: 1, starCode: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);

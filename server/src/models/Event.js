import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '', maxlength: 600 },
    venue: { type: String, default: '' },
    startsAt: { type: Date, default: Date.now },
    endsAt: { type: Date },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    joinCode: { type: String, required: true, unique: true, uppercase: true, index: true },
    theme: { type: String, enum: ['midnight', 'nebula', 'aurora'], default: 'midnight' },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    description: this.description,
    venue: this.venue,
    startsAt: this.startsAt,
    endsAt: this.endsAt,
    hostId: this.hostId,
    joinCode: this.joinCode,
    theme: this.theme,
    isOpen: this.isOpen,
  };
};

export default mongoose.model('Event', eventSchema);

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    bio: { type: String, default: '', maxlength: 280 },
    headline: { type: String, default: '', maxlength: 80 },
    skills: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    socials: {
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      website: { type: String, default: '' },
    },
    avatarUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};

userSchema.methods.verifyPassword = function verifyPassword(plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

/** Shape sent to the client — never leaks the hash. */
userSchema.methods.toPublic = function toPublic() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    bio: this.bio,
    headline: this.headline,
    skills: this.skills,
    interests: this.interests,
    socials: this.socials,
    avatarUrl: this.avatarUrl,
  };
};

export default mongoose.model('User', userSchema);

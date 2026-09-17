const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // Optional for Google users
  googleId: { type: String },
  planTier: { type: String, enum: ['free', 'pro'], default: 'free' },
  usage: {
    analysesToday: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (this.isModified('passwordHash') && this.passwordHash) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);

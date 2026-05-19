import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  label: String,
  line1: String,
  line2: String,
  city: String,
  state: String,
  postalCode: String,
  country: { type: String, default: 'India' },
  phone: String,
  isDefault: { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 6, select: false },
  phone: String,
  avatar: String,
  role: { type: String, enum: ['user', 'admin', 'eventManager'], default: 'user' },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isBanned: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);

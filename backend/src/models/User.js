const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'युझरनेम आवश्यक आहे'],
      unique: true,
      trim: true,
      minlength: [3, 'युझरनेम कमीत कमी ३ अक्षरांचे असणे आवश्यक आहे'],
    },
    password: {
      type: String,
      required: [true, 'पासवर्ड आवश्यक आहे'],
      minlength: [4, 'पासवर्ड कमीत कमी ४ अक्षरांचा असणे आवश्यक आहे'],
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: Hash password before saving if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare candidate password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

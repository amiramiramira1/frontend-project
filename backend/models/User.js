const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  country: String,
  postalCode: String,
  phone: String,
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true, // Store emails in lowercase always
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"],
    },
    password: {
      type: String,
      required: false,           // Optional — OAuth users have no password
      minlength: [6, "Password must be at least 6 characters"],
      select: false,             // Never return password in queries by default
    },
    googleId: {
      type: String,
      default: null,             // Set when user signs in via Google OAuth
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
    addresses: [addressSchema],
    dietPreferences: [
      {
        type: String,
        enum: ["vegan", "vegetarian", "keto", "paleo", "standard"],
      },
    ],
    allergens: [
      {
        type: String,
        enum: ["gluten", "dairy", "nuts", "eggs", "soy", "shellfish", "fish"],
      },
    ],
    // User preferences — stored here so the backend can read them (e.g. email opt-out)
    settings: {
      emailNotifications: { type: Boolean, default: true },
      language:           { type: String, enum: ['en', 'ar'], default: 'en' },
      defaultServings:    { type: Number, min: 1, max: 10, default: 2 },
    },

    // Favorited boxes
    favorites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Box',
    }],

    // Email verification
    isEmailVerified:    { type: Boolean, default: false },
    emailVerifyToken:   { type: String,  select: false }, // stored as sha256 hash
    emailVerifyExpires: { type: Date,    select: false },

    // Password reset
    passwordResetToken:   { type: String, select: false }, // stored as sha256 hash
    passwordResetExpires: { type: Date,   select: false },
  },
  { timestamps: true },
);

// --- Mongoose Middleware (a "hook") ---
// This runs BEFORE a user document is saved to the database.
// It hashes the password if it was just set or changed.
userSchema.pre("save", async function (next) {
  // If the password hasn't been modified or doesn't exist (OAuth user), skip hashing
  if (!this.isModified("password") || !this.password) return next();

  // Generate a salt (random data) and hash the password with it
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Instance Method ---
// This adds a custom method to every user document.
// We use it to compare a plain-text password against the stored hash at login.
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

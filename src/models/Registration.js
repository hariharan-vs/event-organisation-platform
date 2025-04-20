import mongoose from "mongoose";

const RegistrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "cancelled"],
    default: "pending",
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  additionalInfo: {
    type: Object,
    default: {},
  },
  attendanceStatus: {
    type: String,
    enum: ["not_attended", "attended", "completed"],
    default: "not_attended",
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    submittedAt: {
      type: Date,
    },
  },
});

// Compound index to ensure a user can only register once for an event
RegistrationSchema.index({ user: 1, event: 1 }, { unique: true });

export default mongoose.models.Registration ||
  mongoose.model("Registration", RegistrationSchema);

import mongoose from "mongoose"

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide an event title"],
    trim: true,
    maxlength: [100, "Title cannot be more than 100 characters"],
  },
  description: {
    type: String,
    required: [true, "Please provide a description"],
    maxlength: [2000, "Description cannot be more than 2000 characters"],
  },
  shortDescription: {
    type: String,
    maxlength: [200, "Short description cannot be more than 200 characters"],
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startDate: {
    type: Date,
    required: [true, "Please provide a start date"],
  },
  endDate: {
    type: Date,
    required: [true, "Please provide an end date"],
  },
  registrationDeadline: {
    type: Date,
    required: [true, "Please provide a registration deadline"],
  },
  location: {
    type: String,
    required: [true, "Please provide a location"],
  },
  isVirtual: {
    type: Boolean,
    default: false,
  },
  meetingLink: {
    type: String,
  },
  maxParticipants: {
    type: Number,
    default: 0, // 0 means unlimited
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
  ],
  tags: [String],
  image: {
    type: String,
  },
  requirements: {
    type: String,
  },
  status: {
    type: String,
    enum: ["draft", "published", "cancelled", "completed"],
    default: "published",
  },
  isHighlighted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Virtual for current registration count
EventSchema.virtual("registrationCount", {
  ref: "Registration",
  localField: "_id",
  foreignField: "event",
  count: true,
})

// Add a method to check if event is full
EventSchema.methods.isFull = function () {
  return this.maxParticipants > 0 && this.registrationCount >= this.maxParticipants
}

// Add a method to check if registration is still open
EventSchema.methods.isRegistrationOpen = function () {
  return new Date() <= this.registrationDeadline
}

export default mongoose.models.Event || mongoose.model("Event", EventSchema)

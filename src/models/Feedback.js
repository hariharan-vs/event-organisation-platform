import mongoose from "mongoose";


const FeedbackSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  comment: {
    type: String,
    maxlength: [500, "Comment cannot be more than 500 characters"],
  },
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

const Feedback = mongoose.model("Feedback", FeedbackSchema);

module.exports = Feedback;

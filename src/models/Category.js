import mongoose from "mongoose"

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a category name"],
    trim: true,
    maxlength: [50, "Name cannot be more than 50 characters"],
    unique: true,
  },
  description: {
    type: String,
    maxlength: [200, "Description cannot be more than 200 characters"],
  },
  icon: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.models.Category || mongoose.model("Category", CategorySchema)

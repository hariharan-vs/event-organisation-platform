import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Category from "@/models/Category"
import { isAdmin } from "@/middleware/auth"
import { validateCategory } from "@/utils/validators"

// Get all categories
export async function GET(req) {
  try {
    await connectDB()

    const categories = await Category.find()

    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Create new category
export async function POST(req) {
  try {
    const { authorized } = await isAdmin(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to create categories" }, { status: 403 })
    }

    const body = await req.json()

    // Validate category data
    const { errors, isValid } = validateCategory(body)
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    await connectDB()

    // Check if category already exists
    const categoryExists = await Category.findOne({ name: body.name })
    if (categoryExists) {
      return NextResponse.json({ success: false, error: "Category with this name already exists" }, { status: 400 })
    }

    // Create category
    const category = await Category.create(body)

    return NextResponse.json(
      {
        success: true,
        data: category,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Category from "@/models/Category"
import { isAdmin } from "@/middleware/auth"
import { validateCategory } from "@/utils/validators"

// Get single category
export async function GET(req, { params }) {
  try {
    await connectDB()

    const category = await Category.findById(params.id)

    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error("Get category error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Update category
export async function PUT(req, { params }) {
  try {
    const { authorized } = await isAdmin(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to update categories" }, { status: 403 })
    }

    const body = await req.json()

    // Validate category data
    const { errors, isValid } = validateCategory(body)
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    await connectDB()

    // Check if category exists
    let category = await Category.findById(params.id)
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    // Update category
    category = await Category.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })

    return NextResponse.json({
      success: true,
      data: category,
    })
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Delete category
export async function DELETE(req, { params }) {
  try {
    const { authorized } = await isAdmin(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to delete categories" }, { status: 403 })
    }

    await connectDB()

    // Check if category exists
    const category = await Category.findById(params.id)
    if (!category) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 })
    }

    // Delete category
    await category.deleteOne()

    return NextResponse.json({
      success: true,
      data: {},
    })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

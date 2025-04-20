import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db/connect"
import User from "@/lib/db/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import bcrypt from "bcryptjs"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    // Only admins can list all users
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const role = searchParams.get("role")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Build filter object
    const filter = {}
    if (query) {
      filter.$or = [{ name: { $regex: query, $options: "i" } }, { email: { $regex: query, $options: "i" } }]
    }
    if (role) filter.role = role

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit)

    const total = await User.countDocuments(filter)

    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const data = await request.json()
    await connectToDatabase()

    // Check if email already exists
    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    data.password = await bcrypt.hash(data.password, salt)

    // Create user
    const user = await User.create(data)

    // Don't return the password
    const userResponse = user.toObject()
    delete userResponse.password

    return NextResponse.json(userResponse, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

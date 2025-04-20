import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db/connect"
import User from "@/lib/db/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"
import bcrypt from "bcryptjs"

export async function GET(request, { params }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can only view their own profile unless they're an admin
    if (id !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()

    const user = await User.findById(id)
      .select("-password")
      .populate({
        path: "registeredEvents",
        populate: {
          path: "event",
          select: "title startDate location",
        },
      })
      .populate({
        path: "createdEvents",
        select: "title startDate location",
      })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Users can only update their own profile unless they're an admin
    if (id !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await connectToDatabase()
    const data = await request.json()

    // If updating password, hash it
    if (data.password) {
      const salt = await bcrypt.genSalt(10)
      data.password = await bcrypt.hash(data.password, salt)
    }

    // Only admins can update role
    if (data.role && session.user.role !== "admin") {
      delete data.role
    }

    const updatedUser = await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).select("-password")

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json(updatedUser)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    // Only admins can delete users
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const user = await User.findByIdAndDelete(id)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

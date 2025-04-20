import { NextResponse } from "next/server"
import { authenticate, removeTokenCookie } from "@/lib/auth"
import User from "@/models/User" // Import the User model


export async function GET(req) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        department: user.department,
        year: user.year,
        interests: user.interests,
        bio: user.bio,
        profilePicture: user.profilePicture,
      },
    })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()

    // Fields that can be updated
    const updatableFields = ["name", "college", "department", "year", "interests", "bio", "profilePicture"]

    // Update user
    const updateData = {}
    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, { new: true, runValidators: true })

    return NextResponse.json({
      success: true,
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        college: updatedUser.college,
        department: updatedUser.department,
        year: updatedUser.year,
        interests: updatedUser.interests,
        bio: updatedUser.bio,
        profilePicture: updatedUser.profilePicture,
      },
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Remove token cookie
    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    })

    removeTokenCookie(response)

    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

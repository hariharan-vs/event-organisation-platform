import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Registration from "@/models/Registration"
import { authenticate } from "@/middleware/auth"

// Get single registration
export async function GET(req, { params }) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    // Find registration
    const registration = await Registration.findById(params.id).populate({
      path: "event",
      select: "title description startDate endDate location image organizer",
      populate: {
        path: "organizer",
        select: "name email",
      },
    })

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 })
    }

    // Check if user is the registrant or the event organizer
    if (
      registration.user.toString() !== user._id.toString() &&
      registration.event.organizer._id.toString() !== user._id.toString() &&
      user.role !== "admin"
    ) {
      return NextResponse.json({ success: false, error: "Not authorized to view this registration" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error("Get registration error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Cancel registration
export async function DELETE(req, { params }) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    // Find registration
    const registration = await Registration.findById(params.id)

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 })
    }

    // Check if user is the registrant
    if (registration.user.toString() !== user._id.toString() && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Not authorized to cancel this registration" }, { status: 403 })
    }

    // Update registration status to cancelled
    registration.status = "cancelled"
    await registration.save()

    return NextResponse.json({
      success: true,
      data: {},
    })
  } catch (error) {
    console.error("Cancel registration error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Submit feedback
export async function PUT(req, { params }) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()

    // Validate feedback
    if (!body.rating || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ success: false, error: "Rating must be between 1 and 5" }, { status: 400 })
    }

    await connectDB()

    // Find registration
    const registration = await Registration.findById(params.id)

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 })
    }

    // Check if user is the registrant
    if (registration.user.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: "Not authorized to submit feedback for this registration" },
        { status: 403 },
      )
    }

    // Update feedback
    registration.feedback = {
      rating: body.rating,
      comment: body.comment || "",
      submittedAt: new Date(),
    }

    await registration.save()

    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error("Submit feedback error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

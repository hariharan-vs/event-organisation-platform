import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Registration from "@/models/Registration"
import Event from "@/models/Event"
import { isOrganizer } from "@/middleware/auth"

// Get all registrations for an event
export async function GET(req, { params }) {
  try {
    const { authorized, user } = await isOrganizer(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to view registrations" }, { status: 403 })
    }

    await connectDB()

    // Find event
    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Not authorized to view registrations for this event" },
        { status: 403 },
      )
    }

    // Get registrations
    const registrations = await Registration.find({ event: params.id }).populate(
      "user",
      "name email college department year",
    )

    return NextResponse.json({
      success: true,
      count: registrations.length,
      data: registrations,
    })
  } catch (error) {
    console.error("Get registrations error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Update registration status (approve/reject)
export async function PUT(req, { params }) {
  try {
    const { authorized, user } = await isOrganizer(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to update registrations" }, { status: 403 })
    }

    await connectDB()

    // Find event
    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Not authorized to update registrations for this event" },
        { status: 403 },
      )
    }

    const body = await req.json()

    // Validate input
    if (!body.registrationId || !body.status) {
      return NextResponse.json({ success: false, error: "Registration ID and status are required" }, { status: 400 })
    }

    // Check if status is valid
    if (!["pending", "approved", "rejected", "cancelled"].includes(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    // Update registration
    const registration = await Registration.findOneAndUpdate(
      { _id: body.registrationId, event: params.id },
      { status: body.status },
      { new: true },
    )

    if (!registration) {
      return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: registration,
    })
  } catch (error) {
    console.error("Update registration error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

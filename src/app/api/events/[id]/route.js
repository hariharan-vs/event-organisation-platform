import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Event from "@/models/Event"
import { isOrganizer } from "@/middleware/auth"
import { validateEvent } from "@/utils/validators"

// Get single event
export async function GET(req, { params }) {
  try {
    await connectDB()

    const event = await Event.findById(params.id)
      .populate("organizer", "name email")
      .populate("categories", "name description")

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error("Get event error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Update event
export async function PUT(req, { params }) {
  try {
    const { authorized, user } = await isOrganizer(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to update events" }, { status: 403 })
    }

    await connectDB()

    // Find event
    let event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Not authorized to update this event" }, { status: 403 })
    }

    const body = await req.json()

    // Validate event data
    const { errors, isValid } = validateEvent(body)
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    // Update event
    event = await Event.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    })

    return NextResponse.json({
      success: true,
      data: event,
    })
  } catch (error) {
    console.error("Update event error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Delete event
export async function DELETE(req, { params }) {
  try {
    const { authorized, user } = await isOrganizer(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to delete events" }, { status: 403 })
    }

    await connectDB()

    // Find event
    const event = await Event.findById(params.id)

    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check if user is the organizer or admin
    if (event.organizer.toString() !== user._id.toString() && user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Not authorized to delete this event" }, { status: 403 })
    }

    // Delete event
    await event.deleteOne()

    return NextResponse.json({
      success: true,
      data: {},
    })
  } catch (error) {
    console.error("Delete event error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

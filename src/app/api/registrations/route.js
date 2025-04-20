import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Registration from "@/models/Registration"
import Event from "@/models/Event"
import { authenticate } from "@/middleware/auth"
import { validateRegistration } from "@/utils/validators"

// Get user's registrations
export async function GET(req) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    await connectDB()

    // Get registrations
    const registrations = await Registration.find({ user: user._id }).populate({
      path: "event",
      select: "title description startDate endDate location image",
    })

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

// Register for an event
export async function POST(req) {
  try {
    const { authenticated, user } = await authenticate(req)

    if (!authenticated) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await req.json()

    // Set user ID from authenticated user
    body.user = user._id

    // Validate registration data
    const { errors, isValid } = validateRegistration(body)
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    await connectDB()

    // Check if event exists
    const event = await Event.findById(body.event)
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 })
    }

    // Check if registration is still open
    if (!event.isRegistrationOpen()) {
      return NextResponse.json({ success: false, error: "Registration for this event is closed" }, { status: 400 })
    }

    // Check if event is full
    if (event.isFull()) {
      return NextResponse.json({ success: false, error: "Event is full" }, { status: 400 })
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      user: user._id,
      event: body.event,
    })

    if (existingRegistration) {
      return NextResponse.json({ success: false, error: "You are already registered for this event" }, { status: 400 })
    }

    // Create registration
    const registration = await Registration.create({
      user: user._id,
      event: body.event,
    
      additionalInfo: body.additionalInfo || {},
    })

    return NextResponse.json(
      {
        success: true,
        data: registration,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create registration error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

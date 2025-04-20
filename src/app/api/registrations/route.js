import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db/connect"
import Registration from "@/lib/db/models/Registration"
import Event from "@/lib/db/models/Event"
import User from "@/lib/db/models/User"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Build filter object
    const filter = {}
    if (eventId) filter.event = eventId
    if (userId) filter.user = userId
    if (status) filter.status = status

    // If not admin, only show user's own registrations or registrations for events they organize
    if (session.user.role !== "admin") {
      const userEvents = await Event.find({ organizer: session.user.id }).select("_id")
      const userEventIds = userEvents.map((event) => event._id)

      filter.$or = [{ user: session.user.id }, { event: { $in: userEventIds } }]
    }

    const registrations = await Registration.find(filter)
      .populate("event", "title startDate location")
      .populate("user", "name email")
      .sort({ registrationDate: -1 })
      .skip(skip)
      .limit(limit)

    const total = await Registration.countDocuments(filter)

    return NextResponse.json({
      registrations,
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
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    await connectToDatabase()

    // Set the current user as the registrant
    data.user = session.user.id

    // Check if event exists and has open registration
    const event = await Event.findById(data.event)
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (new Date() > event.registrationDeadline) {
      return NextResponse.json({ error: "Registration deadline has passed" }, { status: 400 })
    }

    if (event.registrations.length >= event.capacity) {
      return NextResponse.json({ error: "Event is at full capacity" }, { status: 400 })
    }

    // Check if user is already registered
    const existingRegistration = await Registration.findOne({
      event: data.event,
      user: data.user,
    })

    if (existingRegistration) {
      return NextResponse.json({ error: "You are already registered for this event" }, { status: 400 })
    }

    // Create registration
    const registration = await Registration.create(data)

    // Update event and user with the new registration
    await Event.findByIdAndUpdate(data.event, {
      $push: { registrations: registration._id },
    })

    await User.findByIdAndUpdate(data.user, {
      $push: { registeredEvents: registration._id },
    })

    return NextResponse.json(registration, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

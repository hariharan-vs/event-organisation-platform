import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Event from "@/models/Event"
import { isOrganizer } from "@/middleware/auth"
import { validateEvent } from "@/utils/validators"

// Get all events
export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)

    // Build query
    const query = { status: "published" }

    // Pagination
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const skip = (page - 1) * limit

    // Filtering
    if (searchParams.has("category")) {
      query.categories = searchParams.get("category")
    }

    if (searchParams.has("organizer")) {
      query.organizer = searchParams.get("organizer")
    }

    // Date filtering
    if (searchParams.has("startDate")) {
      query.startDate = { $gte: new Date(searchParams.get("startDate")) }
    }

    if (searchParams.has("endDate")) {
      query.endDate = { $lte: new Date(searchParams.get("endDate")) }
    }

    // Get events
    const events = await Event.find(query)
      .populate("organizer", "name email")
      .populate("categories", "name")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)

    // Get total count
    const total = await Event.countDocuments(query)

    return NextResponse.json({
      success: true,
      count: events.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      data: events,
    })
  } catch (error) {
    console.error("Get events error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

// Create new event
export async function POST(req) {
  try {
    const { authorized, user } = await isOrganizer(req)

    if (!authorized) {
      return NextResponse.json({ success: false, error: "Not authorized to create events" }, { status: 403 })
    }

    const body = await req.json()

    // Validate event data
    const { errors, isValid } = validateEvent(body)
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 })
    }

    await connectDB()

    // Create event
    const event = await Event.create({
      ...body,
      organizer: user._id,
    })

    return NextResponse.json(
      {
        success: true,
        data: event,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Create event error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

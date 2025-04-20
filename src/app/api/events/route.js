import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db/connect"
import Event from "@/lib/db/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const query = searchParams.get("query")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    await connectToDatabase()

    // Build filter object
    const filter = { isPublished: true }
    if (category) filter.category = category
    if (query) filter.title = { $regex: query, $options: "i" }

    // Get events with pagination
    const events = await Event.find(filter)
      .populate("organizer", "name email")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)

    const total = await Event.countDocuments(filter)

    return NextResponse.json({
      events,
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

    // Add the current user as the organizer
    data.organizer = session.user.id

    const event = await Event.create(data)

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

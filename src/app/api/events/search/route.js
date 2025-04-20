import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Event from "@/models/Event"

export async function GET(req) {
  try {
    await connectDB()

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ success: false, error: "Search query is required" }, { status: 400 })
    }

    // Build search query
    const searchQuery = {
      status: "published",
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { tags: { $in: [new RegExp(query, "i")] } },
      ],
    }

    // Pagination
    const page = Number.parseInt(searchParams.get("page")) || 1
    const limit = Number.parseInt(searchParams.get("limit")) || 10
    const skip = (page - 1) * limit

    // Get events
    const events = await Event.find(searchQuery)
      .populate("organizer", "name")
      .populate("categories", "name")
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(limit)

    // Get total count
    const total = await Event.countDocuments(searchQuery)

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
    console.error("Search events error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

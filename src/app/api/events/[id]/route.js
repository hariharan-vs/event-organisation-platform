import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db/connect"
import Event from "@/lib/db/models/Event"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    const { id } = params
    await connectToDatabase()

    const event = await Event.findById(id)
      .populate("organizer", "name email")
      .populate({
        path: "registrations",
        select: "status registrationDate",
        populate: {
          path: "user",
          select: "name email",
        },
      })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json(event)
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

    await connectToDatabase()
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is the organizer or an admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await request.json()
    const updatedEvent = await Event.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })

    return NextResponse.json(updatedEvent)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()
    const event = await Event.findById(id)

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if user is the organizer or an admin
    if (event.organizer.toString() !== session.user.id && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await Event.findByIdAndDelete(id)

    return NextResponse.json({ message: "Event deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

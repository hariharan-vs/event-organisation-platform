import { NextResponse } from "next/server"
import connectToDatabase from "@/lib/db/connect"
import Registration from "@/lib/db/models/Registration"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function GET(request, { params }) {
  try {
    const { id } = params
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectToDatabase()

    const registration = await Registration.findById(id)
      .populate("event", "title startDate endDate location")
      .populate("user", "name email")

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Check if user is authorized to view this registration
    const isOwner = registration.user._id.toString() === session.user.id
    const isEventOrganizer = registration.event.organizer?.toString() === session.user.id
    const isAdmin = session.user.role === "admin"

    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(registration)
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
    const data = await request.json()

    const registration = await Registration.findById(id).populate("event", "organizer")

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Check if user is authorized to update this registration
    const isOwner = registration.user.toString() === session.user.id
    const isEventOrganizer = registration.event.organizer?.toString() === session.user.id
    const isAdmin = session.user.role === "admin"

    if (!isOwner && !isEventOrganizer && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // If user is not admin or organizer, they can only cancel their registration
    if (!isAdmin && !isEventOrganizer && data.status !== "cancelled") {
      return NextResponse.json({ error: "You can only cancel your registration" }, { status: 403 })
    }

    const updatedRegistration = await Registration.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })

    return NextResponse.json(updatedRegistration)
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
    const registration = await Registration.findById(id).populate("event", "organizer")

    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // Check if user is authorized to delete this registration
    const isAdmin = session.user.role === "admin"
    const isEventOrganizer = registration.event.organizer?.toString() === session.user.id

    if (!isAdmin && !isEventOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await Registration.findByIdAndDelete(id)

    return NextResponse.json({ message: "Registration deleted successfully" })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

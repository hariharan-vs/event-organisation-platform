import { verifyToken } from "@/lib/auth"
import User from "@/models/User"
import connectDB from "@/lib/db"

export async function authenticate(req) {
  // Get token from cookies
  const token = req.cookies.get("token")?.value

  if (!token) {
    return { authenticated: false }
  }

  // Verify token
  const decoded = verifyToken(token)
  if (!decoded) {
    return { authenticated: false }
  }

  try {
    // Connect to database
    await connectDB()

    // Find user
    const user = await User.findById(decoded.id).select("-password")
    if (!user) {
      return { authenticated: false }
    }

    return {
      authenticated: true,
      user,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return { authenticated: false }
  }
}

export async function isOrganizer(req) {
  const { authenticated, user } = await authenticate(req)

  if (!authenticated) {
    return { authorized: false }
  }

  return {
    authorized: ["organizer", "admin"].includes(user.role),
    user,
  }
}

export async function isAdmin(req) {
  const { authenticated, user } = await authenticate(req)

  if (!authenticated) {
    return { authorized: false }
  }

  return {
    authorized: user.role === "admin",
    user,
  }
}

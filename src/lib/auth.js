import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import User from "@/models/User"; // Import the User model

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE;

if (!JWT_SECRET) {
  throw new Error("Please define the JWT_SECRET environment variable");
}

// Generate JWT token
export const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authenticate = async (req) => {
  try {
    const token = getTokenFromCookies();

    if (!token) {
      return { authenticated: false, user: null };
    }

    const decoded = verifyToken(token);

    if (!decoded?.id) {
      return { authenticated: false, user: null };
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return { authenticated: false, user: null };
    }

    return { authenticated: true, user };
  } catch (error) {
    console.error("Authentication error:", error);
    return { authenticated: false, user: null };
  }
};

// Set token in HTTP-only cookie
export const setTokenCookie = (cookieStore, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
  };

  cookieStore.set("token", token, cookieOptions);
};

// Get token from cookies
export const getTokenFromCookies = () => {
  return cookies().get("token")?.value;
};

// Remove token cookie
export const removeTokenCookie = () => {
  cookies().delete("token");
};

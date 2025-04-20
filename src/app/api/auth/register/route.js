import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { validateUser } from "@/utils/validators";
import { generateToken, setTokenCookie } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req) {
  const cookieStore = cookies(); // capture before any await

  try {
    const body = await req.json();

    const { errors, isValid } = validateUser(body);
    if (!isValid) {
      return NextResponse.json({ success: false, errors }, { status: 400 });
    }

    await connectDB();

    const userExists = await User.findOne({ email: body.email });
    if (userExists) {
      return NextResponse.json(
        { success: false, error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || "student",
      college: body.college,
      department: body.department,
      year: body.year,
      interests: body.interests,
      bio: body.bio,
    });

    const token = generateToken(user._id);

    const response = NextResponse.json(
      {
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );

    setTokenCookie(cookieStore, token); // pass the cookieStore

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

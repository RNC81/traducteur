import { createServerFn } from "@tanstack/react-start";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectToDatabase from "../lib/db";
import User from "../lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Helper to get current user from token
export const getUserFromToken = async () => {
  const { getCookie } = await import("vinxi/http");
  const token = getCookie("auth_token");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };
  } catch (error) {
    return null;
  }
};

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const user = await getUserFromToken();
  return { user };
});

export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { deleteCookie } = await import("vinxi/http");
  deleteCookie("auth_token");
  return { success: true };
});

export const signUpWithEmailFn = createServerFn({ method: "POST" }).handler(async ({ data }: { data: { email: string; password?: string } }) => {
  await connectToDatabase();
  const existingUser = await User.findOne({ email: data.email });
  
  if (existingUser) {
    // If user exists, we'll try to log them in if they provided a password
    if (data.password && existingUser.password) {
      const isMatch = await bcrypt.compare(data.password, existingUser.password);
      if (isMatch) {
        const { setCookie } = await import("vinxi/http");
        const token = jwt.sign({ userId: existingUser._id }, JWT_SECRET, { expiresIn: "7d" });
        setCookie("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
        return { success: true, isNew: false };
      }
    }
    throw new Error("User already exists or invalid credentials.");
  }

  const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;
  
  const newUser = await User.create({
    email: data.email,
    password: hashedPassword,
  });

  const { setCookie } = await import("vinxi/http");
  const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: "7d" });
  setCookie("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });

  return { success: true, isNew: true };
});

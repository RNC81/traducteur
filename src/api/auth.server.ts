import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import connectToDatabase from "../lib/db";
import User from "../lib/models/User";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production. Set it as an environment variable.");
  }
  console.warn("[WARNING] JWT_SECRET is not set. Using an insecure fallback for development.");
}
export const SECRET = JWT_SECRET || "dev_fallback_only_not_for_prod";

export const getUserFromToken = async () => {
  const { getCookie } = await import("vinxi/http");
  const token = getCookie("auth_token");
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    await connectToDatabase();
    const user = await User.findById(decoded.userId).select("-password").lean();
    if (!user) return null;
    return {
      id: (user._id as any).toString(),
      email: user.email as string,
      name: (user as any).name as string | undefined,
    };
  } catch {
    return null;
  }
};

export const getSessionServer = async () => {
  const user = await getUserFromToken();
  return { user };
};

export const signOutServer = async () => {
  const { deleteCookie } = await import("vinxi/http");
  deleteCookie("auth_token");
  return { success: true };
};

export const signUpWithEmailServer = async (data: { email: string; password: string }) => {
  await connectToDatabase();
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    if (existingUser.password) {
      const isMatch = await bcrypt.compare(data.password, existingUser.password);
      if (isMatch) {
        const { setCookie } = await import("vinxi/http");
        const token = jwt.sign({ userId: existingUser._id }, SECRET, { expiresIn: "7d" });
        setCookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
        return { success: true, isNew: false };
      }
    }
    throw new Error("Identifiants invalides. Vérifiez votre email et mot de passe.");
  }

  // Nouvel utilisateur
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const newUser = await User.create({ email: data.email, password: hashedPassword });

  const { setCookie } = await import("vinxi/http");
  const token = jwt.sign({ userId: newUser._id }, SECRET, { expiresIn: "7d" });
  setCookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return { success: true, isNew: true };
};

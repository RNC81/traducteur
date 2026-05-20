import mongoose from "mongoose";

export interface IUser {
  email: string;
  password?: string;
  googleId?: string;
  name?: string;
  picture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Optional if using Google Auth
    googleId: { type: String },
    name: { type: String },
    picture: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

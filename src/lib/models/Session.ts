import mongoose from "mongoose";

export interface ISession {
  title: string;
  source_lang: string;
  target_langs: string[];
  mode: "live" | "faith";
  share_code: string;
  is_live: boolean;
  owner: mongoose.Types.ObjectId;
  started_at: Date;
  ended_at?: Date;
}

const SessionSchema = new mongoose.Schema<ISession>(
  {
    title: { type: String, required: true },
    source_lang: { type: String, required: true },
    target_langs: [{ type: String }],
    mode: { type: String, enum: ["live", "faith"], default: "live" },
    share_code: { type: String, required: true, unique: true },
    is_live: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);

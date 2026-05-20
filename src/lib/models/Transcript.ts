import mongoose from "mongoose";

export interface ITranscript {
  session_id: mongoose.Types.ObjectId;
  original_text: string;
  translations: Record<string, string>; // e.g., { "FR": "Bonjour", "AR": "مرحبا" }
  timestamp: Date;
}

const TranscriptSchema = new mongoose.Schema<ITranscript>(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    original_text: { type: String, required: true },
    translations: { type: Map, of: String, default: {} },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Transcript || mongoose.model<ITranscript>("Transcript", TranscriptSchema);

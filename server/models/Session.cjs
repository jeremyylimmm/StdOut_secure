const mongoose = require('mongoose');

const TimelineEventSchema = new mongoose.Schema({
  type: { type: String, enum: ["speech", "code", "output"], required: true },
  content: { type: String, required: true },
  elapsedSeconds: { type: Number, required: true },
  timestamp: { type: String, required: true },
  error: { type: Boolean, default: false },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  question: {
    id: String,
    title: String,
    difficulty: String,
    description: String,
  },
  finalCode: { type: String, default: "" },
  durationSeconds: { type: Number },
  timeline: [TimelineEventSchema],
  completedAt: { type: Date, default: Date.now },
});

SessionSchema.pre("save", function (next) {
  this.timeline.sort((a, b) => a.elapsedSeconds - b.elapsedSeconds);
  next();
});

module.exports = mongoose.models.Session || mongoose.model("Session", SessionSchema);
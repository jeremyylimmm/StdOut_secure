require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { runSandboxed } = require("./sandboxRunner");
const path = require("path");
const app = express();

const connectDB = require("./db");
const authRoutes = require("./routes/auth");
const interviewRoutes = require("./routes/interviews");
const questionsRoutes = require("./routes/questions");
const InterviewQuestion = require("./models/InterviewQuestion");
const transcribeRoutes = require("./routes/transcribe");
const reviewRoutes = require("./routes/review");
const realTime = require("./routes/real_time");

// Connect to DB and start server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed questions if database is empty
    const existingCount = await InterviewQuestion.countDocuments();
    if (existingCount === 0) {
      console.log("\nNo questions found. Auto-seeding from questions.json...");
      try {
        const questionsPath = path.join(__dirname, "data", "questions.json");
        const questionData = JSON.parse(
          fs.readFileSync(questionsPath, "utf-8"),
        );
        const questionsToInsert = Array.isArray(questionData)
          ? questionData
          : [questionData];

        await InterviewQuestion.insertMany(questionsToInsert);
        console.log(
          `Successfully seeded ${questionsToInsert.length} question(s)!\n`,
        );
      } catch (seedError) {
        console.warn("Could not auto-seed questions:", seedError.message);
      }
    }

    // Enable CORS for frontend
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "https://std-out.vercel.app",
    ].filter(Boolean);

    const corsOptions = {
      origin: (origin, callback) => {
        // Allow non-browser requests (curl, server-to-server)
        if (!origin) return callback(null, true);
        // Allow everything in development
        if (process.env.NODE_ENV !== "production") return callback(null, true);
        // Allow explicitly listed origins and any *.vercel.app preview URL
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
          return callback(null, true);
        }
        // Return false (not an error) so cors sends a plain 200 with no
        // Allow-Origin header rather than triggering Express's error handler
        return callback(null, false);
      },
      credentials: true,
    };

    app.use(cors(corsOptions));

    app.use(express.json()); // parses JSON request bodies

    // Health check route
    app.get("/", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });

    app.post("/api/run", async (req, res) => {
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Code is required" });
      }
      const result = await runSandboxed(code);
      res.json(result);
    });

    // Auth routes
    app.use("/api/auth", authRoutes);

    // Interview routes
    app.use("/api/interviews", interviewRoutes);

    app.use("/api/realTime", realTime);

    // Questions routes
    app.use("/api/questions", questionsRoutes);

    app.use("/api/review", reviewRoutes);

    // Transcription route
    app.use("/api/transcribe", transcribeRoutes);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

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
    // In production, this allows requests from the deployed Vercel frontend
    const allowedOrigins = [
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    app.use(
      cors({
        origin: (origin, callback) => {
          if (!origin) return callback(null, true); // allow non-browser requests
          if (process.env.NODE_ENV !== "production") return callback(null, true);
          if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            return callback(null, true);
          }
          callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
      }),
    );

    app.use(express.json()); // parses JSON request bodies

    // Health check route
    app.get("/", (req, res) => {
      res.json({ status: "ok", message: "Server is running" });
    });

    app.post("/run", async (req, res) => {
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

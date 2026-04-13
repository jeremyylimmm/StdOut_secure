const express = require("express");
const InterviewSession = require("../models/InterviewSession");

const router = express.Router();

// Save interview session
router.post("/save", async (req, res) => {
  try {
    const {
      userId,
      interview,
      transcript,
      review,
      code,
      timeLeftSeconds,
      testResults,
    } = req.body;

    if (!userId || !interview) {
      return res.status(400).json({
        error: "userId and interview data are required",
      });
    }

    const session = new InterviewSession({
      userId,
      interview,
      transcript,
      review,
      code,
      timeLeftSeconds,
      testResults,
    });

    await session.save();

    res.status(201).json({
      message: "Interview session saved successfully",
      sessionId: session._id,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to save interview",
      details: error.message,
    });
  }
});

// Get all interview sessions for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await InterviewSession.find({ userId })
      .sort({ completedAt: -1 })
      .select(
        "interview transcript review code timeLeftSeconds completedAt createdAt testResults",
      );

    res.json(sessions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch interviews",
      details: error.message,
    });
  }
});

// Get specific interview session
router.get("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Interview session not found" });
    }

    res.json(session);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch interview", details: error.message });
  }
});

// Delete interview session
router.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await InterviewSession.findByIdAndDelete(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Interview session not found" });
    }

    res.json({ message: "Interview deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to delete interview", details: error.message });
  }
});

module.exports = router;

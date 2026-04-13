const express = require("express");
const InterviewQuestion = require("../models/InterviewQuestion");
const { runSandboxed } = require("../sandboxRunner");
const router = express.Router();

// Get random question by company and optionally difficulty
router.get("/random", async (req, res) => {
  try {
    const { company, difficulty } = req.query;

    if (!company) {
      return res.status(400).json({ error: "Company is required" });
    }

    let query = { company: { $in: [company] } };

    // Add difficulty filter if company is LeetCode
    if (company === "LeetCode" && difficulty) {
      query.difficulty = difficulty;
    }

    const questions = await InterviewQuestion.find(query).select("-solution");

    if (questions.length === 0) {
      return res.status(404).json({
        error: `No questions found for company: ${company}${difficulty ? ` and difficulty: ${difficulty}` : ""}`,
      });
    }

    // Get random question
    const randomQuestion =
      questions[Math.floor(Math.random() * questions.length)];
    res.json(randomQuestion);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch question",
      details: error.message,
    });
  }
});

// Get all questions for a company
router.get("/company/:company", async (req, res) => {
  try {
    const { company } = req.params;
    const questions = await InterviewQuestion.find({
      company: { $in: [company] },
    }).select("-solution");

    if (questions.length === 0) {
      return res.status(404).json({
        error: `No questions found for company: ${company}`,
      });
    }

    res.json(questions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch questions",
      details: error.message,
    });
  }
});

// Get single question
router.get("/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;
    console.log("Fetching question with ID:", questionId);

    let question;

    // Try to find by MongoDB _id first, then by the unique id field
    if (questionId.match(/^[0-9a-fA-F]{24}$/)) {
      // Valid MongoDB ObjectId
      question = await InterviewQuestion.findById(questionId);
      console.log("Found by MongoDB _id:", question ? "YES" : "NO");
    }

    // If not found by _id, try finding by the unique id field
    if (!question) {
      question = await InterviewQuestion.findOne({ id: questionId });
      console.log("Found by id field:", question ? "YES" : "NO");
    }

    if (!question) {
      console.log("Question not found for ID:", questionId);
      return res.status(404).json({ error: "Question not found" });
    }

    console.log("Returning question with solution:", question.solution ? "YES" : "NO");
    res.json(question);
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({
      error: "Failed to fetch question",
      details: error.message,
    });
  }
});

// Get all companies
router.get("/list/companies", async (req, res) => {
  try {
    const companies = await InterviewQuestion.distinct("company");
    res.json({ companies });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch companies",
      details: error.message,
    });
  }
});

// Submit code and run against test cases
router.post("/:questionId/submit", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { code } = req.body;

    console.log("\n=== SUBMIT DEBUG ===");
    console.log("Question ID:", questionId);
    console.log("Code:", code ? `${code.length} characters` : "NO CODE");

    if (!code) {
      return res.status(400).json({ error: "Code is required" });
    }

    const question = await InterviewQuestion.findById(questionId);

    console.log("Question found:", question ? question.title : "NOT FOUND");

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const testResults = [];
    let passedCount = 0;

    // Run test cases
    for (const testCase of question.testCases) {
      const testCode = buildTestCode(
        code,
        testCase.input,
        testCase.expectedOutput,
      );

      const result = await runPython(testCode);

      const passed = result.exitCode === 0 && result.stdout.trim() === "PASS";
      testResults.push({
        testCaseId: testCase.id,
        passed,
        description: testCase.description,
        isHidden: testCase.isHidden,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: passed ? null : result.stdout + result.stderr,
      });

      if (passed) passedCount++;
    }

    const totalTests = question.testCases.length;
    const passPercentage = (passedCount / totalTests) * 100;

    res.json({
      passed: passedCount === totalTests,
      passedCount,
      totalTests,
      passPercentage: Math.round(passPercentage),
      testCases: testResults,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit code",
      details: error.message,
    });
  }
});

// Helper function to build test code
function buildTestCode(userCode, input, expectedOutput) {
  // Convert to JSON strings directly instead of escaping
  const inputArray = JSON.stringify(input);
  const expectedArray = JSON.stringify(expectedOutput);

  return `
import json

${userCode}

# Test case execution
try:
    input_data = json.loads('''${inputArray}''')
    expected = json.loads('''${expectedArray}''')

    # Call solution function
    # If input is a list, unpack it as arguments; otherwise pass as single arg
    if isinstance(input_data, list):
        result = solution(*input_data)
    else:
        result = solution(input_data)

    if result == expected:
        print("PASS")
    else:
        print(f"FAIL: expected {expected}, got {result}")
except Exception as e:
    import traceback
    print(f"ERROR: {str(e)}")
    traceback.print_exc()
`;
}

// Helper function to run Python code inside the sandbox
function runPython(code) {
  return runSandboxed(code);
}

module.exports = router;

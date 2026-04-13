const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const InterviewQuestion = require("./models/InterviewQuestion");
const connectDB = require("./db");

const seedDatabase = async () => {
  try {
    await connectDB();

    // Read questions from JSON file
    const questionsPath = path.join(__dirname, "data", "questions.json");
    const questionData = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));

    // Handle both single question and array of questions
    const questionsToInsert = Array.isArray(questionData)
      ? questionData
      : [questionData];

    console.log(
      `\n📝 Attempting to insert ${questionsToInsert.length} question(s)...`,
    );

    // Get unique companies and clear existing questions for those companies
    const companies = [...new Set(questionsToInsert.flatMap((q) => q.company))];
    await InterviewQuestion.deleteMany({ company: { $in: companies } });
    console.log(
      `🗑️  Cleared existing questions for companies: ${companies.join(", ")}`,
    );

    // Insert new questions
    const result = await InterviewQuestion.insertMany(questionsToInsert);

    console.log(`\n✅ Successfully seeded ${result.length} question(s)!`);

    result.forEach((question, index) => {
      console.log(
        `   ${index + 1}. ${question.company} - "${question.title}" (${question.difficulty})`,
      );
      console.log(
        `      Test cases: ${question.testCases.length} (all hidden)`,
      );
    });

    console.log(
      "\n💡 Tip: To add more questions, add them to server/data/questions.json",
    );
    console.log("   Format can be a single object or an array of objects.\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedDatabase();

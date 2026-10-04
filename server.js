// Load the Express library (installed with `npm install express`).
const express = require("express");

// Create the app: the object that holds all our routes and settings.
const app = express();

// Use the PORT the hosting service gives us, or 3000 when running locally.
const PORT = process.env.PORT || 3000;

// Middleware: automatically parse JSON request bodies into `req.body`.
app.use(express.json());

// Serve everything in the /public folder (our index.html) as static files.
app.use(express.static("public"));

// Our one API endpoint. It only accepts POST requests at /api/reading.
app.post("/api/reading", (req, res) => {
  // Pull the two fields we expect out of the JSON body.
  const { question, cards } = req.body;

  // Validate: question must be a non-empty string.
  if (typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Please enter a question." });
  }

  // Validate: cards must be an array of exactly 3 items.
  if (!Array.isArray(cards) || cards.length !== 3) {
    return res.status(400).json({ error: "Exactly 3 cards are required." });
  }

  // Placeholder reading. Later, this is where we'll call the AI API.
  const reading =
    `You asked: "${question.trim()}". ` +
    `Past: ${cards[0]}. Present: ${cards[1]}. Future: ${cards[2]}. ` +
    `(This is a placeholder — the AI reading comes next!)`;

  // Send the reading back to the browser as JSON.
  res.json({ reading });
});

// Start the server and print the local URL.
app.listen(PORT, () => {
  console.log(`Tarot app running at http://localhost:${PORT}`);
});

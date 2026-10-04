// Built-in Node modules for reading files and building file paths.
const fs = require("fs");
const path = require("path");

// Load the Express library (installed with `npm install`).
const express = require("express");

// Create the app: the object that holds all our routes and settings.
const app = express();

// Use the PORT the hosting service gives us, or 3000 when running locally.
const PORT = process.env.PORT || 3000;

// ---------- Load the deck once, when the server starts ----------
const CARDS_FILE = path.join(__dirname, "public", "cards.json");
if (!fs.existsSync(CARDS_FILE)) {
  console.error("public/cards.json is missing. Run: npm run download-cards");
  process.exit(1);
}
const deck = JSON.parse(fs.readFileSync(CARDS_FILE, "utf8"));

// A Map lets us look up a card's full data by its name instantly.
const cardsByName = new Map(deck.map((card) => [card.name, card]));

// ---------- Claude settings ----------
// The API key comes from an environment variable — NEVER hard-code it.
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY is not set. Add it to your .env file.");
  process.exit(1);
}
const MODEL = process.env.CLAUDE_MODEL || "claude-haiku-4-5";
const POSITIONS = ["Past", "Present", "Future"];

// Give up on Claude after this many milliseconds (20 seconds).
const CLAUDE_TIMEOUT_MS = 20000;

// Friendly messages shown to users. Real error details go to the terminal only.
const MESSAGES = {
  timeout: "The spirits are taking too long to answer. Please try again in a moment.",
  busy: "Many people are seeking answers right now. Please wait a few seconds and try again.",
  generic: "The cards are cloudy right now. Please try again."
};

// The "system prompt" sets Claude's role and rules for every reading.
// It stays the same for every user; only the question and cards change.
const SYSTEM_PROMPT = `You are a warm, thoughtful tarot reader.
Give a reading under 200 words that connects the cards to the user's question.
Be encouraging, not fatalistic.
Don't give medical, legal, or financial advice.
Base each card on the traditional meaning provided; don't invent new meanings.
Plain text only, no markdown.`;

// Middleware: automatically parse JSON request bodies into `req.body`.
app.use(express.json());

// Serve everything in the /public folder (index.html, cards.json).
app.use(express.static("public"));

// Our one API endpoint. `async` because we wait for Claude's reply.
app.post("/api/reading", async (req, res) => {
  const { question, cards } = req.body;

  // --- Validate the question ---
  if (typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Please enter a question." });
  }
  if (question.length > 300) {
    return res.status(400).json({ error: "Please keep your question under 300 characters." });
  }

  // --- Validate the cards: 3 real, different cards, each { name, reversed } ---
  if (!Array.isArray(cards) || cards.length !== 3) {
    return res.status(400).json({ error: "Exactly 3 cards are required." });
  }
  const names = cards.map((c) => c && c.name);
  if (!names.every((n) => cardsByName.has(n)) || new Set(names).size !== 3) {
    return res.status(400).json({ error: "Invalid cards." });
  }

  // --- Fill in the template: one line per card, e.g.
  //     "Past – The Tower (reversed). Traditional meaning: ..." ---
  const cardLines = cards.map((c, i) => {
    const card = cardsByName.get(c.name);
    const reversed = c.reversed === true;
    const orientation = reversed ? "reversed" : "upright";
    const meaning = reversed ? card.meaning_rev : card.meaning_up;
    return `${POSITIONS[i]} – ${card.name} (${orientation}). Traditional meaning: ${meaning}`;
  });

  const userPrompt =
    `The user asked: "${question.trim()}"\n\n` +
    `They drew:\n${cardLines.join("\n")}`;

  try {
    // Call the Claude Messages API with plain fetch (built into Node 18+).
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,        // proves who we are
        "anthropic-version": "2023-06-01",     // which API format we speak
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,                       // caps length (and cost) of the reply
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }]
      }),
      // Automatically cancel the request if Claude takes too long.
      signal: AbortSignal.timeout(CLAUDE_TIMEOUT_MS)
    });

    // .catch(() => ({})) = if the reply isn't valid JSON, use an empty object instead of crashing.
    const data = await response.json().catch(() => ({}));

    // Claude answered, but with an error. Log the details for us, show a friendly message to the user.
    if (!response.ok) {
      console.error("Claude API error:", response.status, data.error?.message);

      if (response.status === 401 || response.status === 403) {
        console.error("→ Check ANTHROPIC_API_KEY in your .env file.");
      }
      // 429 = too many requests, 529 = Claude overloaded: tell the user to wait a bit.
      if (response.status === 429 || response.status === 529) {
        return res.status(503).json({ error: MESSAGES.busy });
      }
      return res.status(502).json({ error: MESSAGES.generic });
    }

    // The reply is a list of content blocks; join the text ones together.
    const reading = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    // Rare, but possible: a successful reply with no text in it.
    if (!reading) {
      console.error("Claude returned an empty reading.");
      return res.status(502).json({ error: MESSAGES.generic });
    }

    res.json({ reading });
  } catch (err) {
    // We gave up waiting (timeout) — or couldn't reach Claude at all (no internet, DNS...).
    if (err.name === "TimeoutError") {
      console.error(`Claude did not answer within ${CLAUDE_TIMEOUT_MS / 1000}s.`);
      return res.status(504).json({ error: MESSAGES.timeout });
    }
    console.error("Request to Claude failed:", err.message);
    res.status(502).json({ error: MESSAGES.generic });
  }
});

// Catch-all error handler (e.g. someone sends broken JSON). Must come after the routes.
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ error: MESSAGES.generic });
});

// Start the server and print the local URL.
app.listen(PORT, () => {
  console.log(`Tarot app running at http://localhost:${PORT} (${deck.length} cards, model ${MODEL})`);
});

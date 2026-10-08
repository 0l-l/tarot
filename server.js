// Built-in Node modules for reading files and building file paths.
const fs = require("fs");
const path = require("path");

// Load the Express library (installed with `npm install`).
const express = require("express");

// Shared English / Traditional Chinese text (same file the web page uses).
const I18N = require("./public/translations.js");

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

// ---------- Spending protection ----------
// Once the site is public, anyone can click "Draw" as often as they like, and every
// reading costs a little API credit. These two limits keep your bill under control.
const PER_VISITOR_LIMIT = 10;                 // readings per visitor...
const PER_VISITOR_WINDOW_MS = 10 * 60 * 1000; // ...per 10 minutes
const DAILY_LIMIT = Number(process.env.DAILY_READING_LIMIT) || 300; // readings per day for the whole site

const visits = new Map();                     // visitor IP → times of their recent readings
let today = new Date().toISOString().slice(0, 10);
let readingsToday = 0;

// Returns an error code if this visitor should wait, or null if they can go ahead.
function checkLimits(ip) {
  const now = Date.now();

  // New day (UTC)? Reset the daily counter.
  const date = new Date(now).toISOString().slice(0, 10);
  if (date !== today) { today = date; readingsToday = 0; }
  if (readingsToday >= DAILY_LIMIT) return "dailyLimit";

  // Keep only this visitor's readings from the last 10 minutes.
  const recent = (visits.get(ip) || []).filter((t) => now - t < PER_VISITOR_WINDOW_MS);
  if (recent.length >= PER_VISITOR_LIMIT) {
    visits.set(ip, recent);
    return "rateLimited";
  }

  recent.push(now);
  visits.set(ip, recent);
  readingsToday++;
  return null;
}

// Every 10 minutes, forget visitors who haven't drawn recently (so memory doesn't grow forever).
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of visits) {
    if (times.every((t) => now - t >= PER_VISITOR_WINDOW_MS)) visits.delete(ip);
  }
}, PER_VISITOR_WINDOW_MS).unref();

// Errors are sent back as a short "code" (e.g. "timeout"). The page shows the
// friendly message for that code in the user's language (see public/translations.js).
// Real error details go to the terminal only.

// The "system prompt" sets Claude's role and rules for every reading.
// It stays the same for every user; only the question and cards change.
// Tip: to adjust the tone, edit the "Voice" and "Stay neutral" sections.
const SYSTEM_PROMPT = `You are a warm, thoughtful tarot reader having a quiet one-on-one conversation.

Voice:
- Write the way a kind friend talks: natural, gentle, plain words. Speak directly to the person as "you".
- Weave the three cards into one flowing reading (Past, then Present, then Future) instead of a list.
- Briefly acknowledge what the question might mean to them, without assuming facts they didn't share.
- Avoid mystical clichés ("the universe has a plan", "your destiny awaits") and avoid over-the-top praise.

Stay neutral:
- Don't take sides or tell them what to decide. Never say they should or shouldn't do something.
- Present what each card suggests as a possibility or theme to reflect on, not a prediction or a verdict.
- When a question has two paths (e.g. "should I stay or go?"), show what the cards might highlight about each, fairly.
- Hopeful but honest: don't sugarcoat challenging cards, and don't make them sound frightening either.

Rules:
- Under 200 words.
- Base each card on the traditional meaning provided; don't invent new meanings.
- Don't give medical, legal, or financial advice; if the question touches those, gently suggest talking to someone qualified.
- End with one open, reflective question they can sit with.
- Plain text only, no markdown, no headings.`;

// Extra instructions added to the system prompt for each language.
const LANGUAGE_RULES = {
  en: "Write the reading in English.",
  "zh-Hant":
    "Write the entire reading in Traditional Chinese (繁體中文) as used in Taiwan. " +
    "Keep it natural and conversational, like talking to a friend, not stiff or overly literary. " +
    "Refer to each card by the Chinese name given. " +
    "Instead of the 200-word limit, keep it under 350 Chinese characters."
};

// Middleware: automatically parse JSON request bodies into `req.body`.
app.use(express.json());

// Render (like most hosts) sits in front of your app as a proxy. This tells Express to
// read the visitor's real IP from the proxy's header, so the per-visitor limit works.
app.set("trust proxy", 1);

// Serve everything in the /public folder (index.html, cards.json).
// path.join(__dirname, ...) = the "public" folder next to this file, no matter where the server is started from.
app.use(express.static(path.join(__dirname, "public")));

// Our one API endpoint. `async` because we wait for Claude's reply.
app.post("/api/reading", async (req, res) => {
  const { question, cards } = req.body;

  // Which language? Only accept the ones we support; anything else → English.
  const lang = I18N.LANGS.includes(req.body.lang) ? req.body.lang : "en";

  // Send an error: a code for the page, plus the message in the user's language.
  const fail = (status, code) =>
    res.status(status).json({ code, error: I18N.TEXT[lang].errors[code] });

  // --- Validate the question ---
  if (typeof question !== "string" || question.trim() === "") {
    return fail(400, "emptyQuestion");
  }
  if (question.length > 300) {
    return fail(400, "tooLong");
  }

  // --- Validate the cards: 3 real, different cards, each { name, reversed } ---
  if (!Array.isArray(cards) || cards.length !== 3) {
    return fail(400, "invalid");
  }
  const names = cards.map((c) => c && c.name);
  if (!names.every((n) => cardsByName.has(n)) || new Set(names).size !== 3) {
    return fail(400, "invalid");
  }

  // --- Spending protection (only counts requests that passed the checks above) ---
  const limitCode = checkLimits(req.ip);
  if (limitCode === "rateLimited") return fail(429, "rateLimited");
  if (limitCode === "dailyLimit") {
    console.error(`Daily limit of ${DAILY_LIMIT} readings reached.`);
    return fail(503, "dailyLimit");
  }

  // --- Fill in the template: one line per card, e.g.
  //     "Past – The Tower (reversed). Traditional meaning: ..." ---
  const cardLines = cards.map((c, i) => {
    const card = cardsByName.get(c.name);
    const reversed = c.reversed === true;
    const orientation = reversed ? "reversed" : "upright";
    const meaning = reversed ? card.meaning_rev : card.meaning_up;
    // In Chinese mode, include the Chinese card name so Claude uses the same names as the page.
    const label = lang === "zh-Hant" ? `${card.name} (Chinese name: ${I18N.cardName(card, lang)})` : card.name;
    return `${POSITIONS[i]} – ${label} (${orientation}). Traditional meaning: ${meaning}`;
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
        max_tokens: 900,                       // caps length (and cost); Chinese needs a bit more room
        system: `${SYSTEM_PROMPT}\n\nLanguage:\n- ${LANGUAGE_RULES[lang]}`,
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
        return fail(503, "busy");
      }
      return fail(502, "generic");
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
      return fail(502, "generic");
    }

    res.json({ reading });
  } catch (err) {
    // We gave up waiting (timeout) — or couldn't reach Claude at all (no internet, DNS...).
    if (err.name === "TimeoutError") {
      console.error(`Claude did not answer within ${CLAUDE_TIMEOUT_MS / 1000}s.`);
      return fail(504, "timeout");
    }
    console.error("Request to Claude failed:", err.message);
    fail(502, "generic");
  }
});

// Catch-all error handler (e.g. someone sends broken JSON). Must come after the routes.
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  res.status(err.status || 500).json({ code: "generic", error: I18N.TEXT.en.errors.generic });
});

// Start the server and print the local URL.
// Listens on every network interface, which is what Render needs.
app.listen(PORT, () => {
  console.log(`Tarot app listening on port ${PORT} (${deck.length} cards, model ${MODEL})`);
  if (!process.env.RENDER) console.log(`Open http://localhost:${PORT} in your browser.`); // RENDER is set automatically on Render
});

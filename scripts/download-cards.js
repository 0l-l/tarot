// One-time script: downloads all 78 tarot cards from tarotapi.dev
// and saves them to public/cards.json so the app never depends on that server.
// Run it with:  npm run download-cards
const fs = require("fs");
const path = require("path");

const API_URL = "https://tarotapi.dev/api/v1/cards";
const OUT_FILE = path.join(__dirname, "..", "public", "cards.json");

async function main() {
  // fetch() is built into Node 18+, no library needed.
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error(`Download failed: HTTP ${response.status}`);
  }

  // The API returns { nhits: 78, cards: [ {...}, {...} ] }. We keep just the list.
  const data = await response.json();
  const cards = data.cards;

  // Save it nicely formatted (2-space indent) so it's readable in your editor.
  fs.writeFileSync(OUT_FILE, JSON.stringify(cards, null, 2));
  console.log(`Saved ${cards.length} cards to public/cards.json`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1); // non-zero exit code = "this failed"
});

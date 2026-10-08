# Tarot Reading

Live: https://tarot-kdf2.onrender.com

<!-- ============================================================================
     The course requires this top part to be WRITTEN BY YOU, in your own words.
     Replace each TODO with a few sentences. Delete these comments when done.
     ============================================================================ -->

## What it does

TODO: describe the app in your own words (ask a question → draw 3 cards → AI reading; EN / 繁中; share links).

## How to use it

TODO: steps a visitor follows on the site.

## Features I'm most proud of

TODO: pick 2–3 (e.g. original line-art for all 78 cards, flip animation, share links without a database, bilingual readings) and say why.

## How to run it locally

TODO: in your own words (you can follow the technical section below).

## How secrets are handled

TODO: explain where the API key lives (.env locally, Render environment variable), that .env is gitignored, and that the browser never sees the key.

## How I used AI

TODO: brief summary of how you used Claude (Cowork) and Claude Haiku, with citations: Claude wrote most of the initial code; card meanings from tarotapi.dev (A. E. Waite, 1910); fonts from Google Fonts. Full details in prompt_log.md.

---

## AI-generated technical documentation

*This section was written by Claude (AI) and is included as a reference.*

**Stack:** HTML/CSS/JavaScript frontend served by a Node.js + Express backend, deployed on Render (free tier). Readings come from Claude Haiku 4.5 through the Anthropic Messages API. No database.

**Files**
- `server.js`: Express server. Serves `public/` and has one endpoint, `POST /api/reading` (`{question, cards:[{name, reversed}], lang}`). It validates input, enforces rate limits (10 readings per visitor per 10 min, plus a daily site-wide cap), adds each card's traditional meaning to the prompt, calls Claude with a 20 s timeout, and returns `{reading}` or `{code, error}`.
- `public/index.html`: page, styles (theme variables in the "EDIT ME" block) and frontend logic (draw, flip animation, fetch, errors, sharing, language switch).
- `public/art.js`: original SVG line art for all 78 cards.
- `public/translations.js`: English / Traditional Chinese text and card names (used by both the page and the server).
- `public/cards.json`: 78 cards with upright and reversed meanings, from tarotapi.dev.
- `scripts/download-cards.js`: one-time script that downloads `cards.json`.

**Run locally** (Node 20.6+):
```
npm install
copy .env.example .env      # then put your Anthropic API key in .env
npm run dev                 # open http://localhost:3000
```
On Windows PowerShell, use `npm.cmd` if scripts are blocked.

**Environment variables**
| Name | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Anthropic API key |
| `DAILY_READING_LIMIT` | no | Max readings per day for the site (default 300) |
| `CLAUDE_MODEL` | no | Override the model (default `claude-haiku-4-5`) |

**Secrets:** the key is only read on the server from an environment variable (`.env` locally, Render's Environment settings in production). `.env*` files are gitignored, except `.env.example`, which holds a placeholder. The browser only talks to `/api/reading` and never sees the key.

**Sharing:** the reading is encoded into the URL after `#r=`. The part after `#` never reaches the server, so no database is needed.

**Phones:** responsive layout; uses the native share sheet on phones.

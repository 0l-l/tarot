# Prompt Log: Tarot Reading Web App

Live app: https://tarot-kdf2.onrender.com
Repo: https://github.com/0l-l/tarot

## AI tools used

- **Claude (Cowork mode in the Claude desktop app; configured model `claude-opus-5-5`):** planning, writing and explaining code, debugging, deployment help. Cowork could read and write files in my local repo folder.
- **Claude Haiku 4.5 (`claude-haiku-4-5`, through the Anthropic API):** the model *inside* the app that writes each tarot reading.
- **tarotapi.dev:** source of the 78 card meanings (A. E. Waite, 1910), saved to `public/cards.json`.

## Which tool for which job

*(Drafted with Claude's help from our conversation; reviewed by me.)*

I used **Claude in Cowork** for planning, writing code, explaining it line by line, and debugging. I chose it because it could read and write files directly in my local repo, test code before giving it to me, and check my git history for leaked keys. That made it better than copy-pasting from a chat window for a multi-file project. For the **readings inside the app**, I used **Claude Haiku 4.5** instead of a bigger model. It is fast and cheap (about $0.0024 per reading, so my $5 lasts a long time), and its writing is warm enough for tarot. I did not let the AI invent card meanings. I used the **tarotapi.dev** data (A. E. Waite's 1910 meanings) and passed those meanings into the prompt, so readings stay accurate. For debugging the deployment, the most useful tool was not AI at all: it was **Render's logs**, which showed the real error (401) that the AI could only guess at.

## Development process and prompts (verbatim, in order)

My prompts are copied exactly as I typed them, typos included. Screenshots I sent are noted in [brackets]. My API key has been removed.

### 1. Planning the architecture
> I'm building a tarot reading web app for a class project. I have about 8 hours and need to deploy it publicly. Users type a question, draw 3 cards, and get an AI-generated reading. Suggest a simple architecture (frontend, backend, database) that a beginner can understand, and explain why each part is needed. Break this project into small steps，starting with a minimal working version.

Result: plan with an HTML/JS frontend, a Node/Express backend (to hide the API key), an optional database, and step-by-step milestones.

### 2. Minimal backend and frontend
> C:\Users\olivi\Documents\GitHub\tarot, heres the github repo, Create a minimal [Flask / Express] backend with one endpoint `/api/reading` that takes a question and 3 card names, and returns a placeholder response. Explain each line.
> Write a simple HTML/JS frontend with a text input and a "Draw Cards" button that calls this endpoint with fetch and shows the result.

Result: `server.js` (Express, placeholder reading, input validation), `public/index.html`, `package.json`, `.gitignore`, plus a line-by-line explanation.

### 3. Choosing APIs
> learn with me that which APIs fit for this project and topics? API that's good for interpreting the meaning of tarot? or any AI reading API?

Result: learned the difference between a data API (tarotapi.dev, for card meanings) and an LLM API (for writing the reading), and the idea of "grounding" the AI with real card meanings.

### 4. Card data and the Claude call
> Please download tarotapi.dev data into cards.json, and add a Claude Haiku call to server.js.

Result: `scripts/download-cards.js`, a Claude Messages API call using `fetch`, the key read from `.env`, and `.env.example`.

### 5. Running it on Windows
> what i should input for dowloading Tarot API to my project

> [screenshot: PowerShell "running scripts is disabled on this system" error]

> [screenshot: "Saved 78 cards to public/cards.json"] its loaded

> i just added $5 dollar in it. waht's next

> this is the key: [API KEY REMOVED] and this is how to test the key: curl https://api.anthropic.com/v1/messages ... which one should i puti n the terminal

> [screenshot: localhost refused to connect]

Result: fixed the PowerShell execution policy (`npm.cmd`), learned to keep keys only in `.env`, and deleted and replaced the key I had pasted into chat.

### 6. My prompt for the reading
> You are a warm, thoughtful tarot reader. The user asked: "{question}". They drew: Past – {card1} ({upright/reversed}), Present – {card2}, Future – {card3}. Give a reading under 200 words that connects the cards to their question. Be encouraging, not fatalistic, and don't give medical, legal, or financial advice.

Result: split into a system prompt (the rules) and a user message (question and cards, plus the traditional meaning of each card).

> where can i try on the local website again?

### 7. Animation, phone layout, error handling
> Add a card flip animation in CSS when cards are revealed. Keep it simple enough that I can modify the timing and colors myself.
> Make this layout responsive so it works on a phone screen.
> What happens if the AI API fails or times out? Add error handling that shows a friendly message to the user.

Result: 3D CSS flip with timing and color variables, a phone layout, a 20 s server timeout and 30 s browser timeout, and friendly error messages with a "Try again" button.

### 8. Visual theme
> i would like to change the overall color theme and art style, here's the reference: https://sustainlifejournal.com/product/free-printable-tarot-cards-2/

Result: black-and-white line-art theme. The AI drew *original* SVG art for all 78 cards (`public/art.js`) instead of copying the reference artwork.

### 9. Reading tone
> adjust the tone of the AI reading, make it more warm and natural, but need to be neutral in opinion.

### 10. Share links and tab icon
> make a feature that can can let people share their result to other friends. a link. also make a icon on the website tab

Result: the AI asked whether to use a database or put the reading in the link itself. I chose the link (no database). Also added a favicon.

### 11. Two languages
> make a language change feature that can switch from traditional chinese and english

Result: `public/translations.js`, Chinese card names, and readings written in the chosen language.

### 12. Deployment to Render
> My tarot app works well on localhost. It's a Node/Express app: `server.js` serves the `public/` folder and calls an AI API using a key from `.env`. I want to deploy it publicly on Render (free tier) so I have one link that anyone can open, and so it redeploys automatically whenever I push to GitHub.
> Please:
>
> 1. Check that `server.js` uses `process.env.PORT` and is ready for Render.
> 2. Check that `package.json` has a correct `start` script and Node version.
> 3. Confirm that `.env` is in `.gitignore` and that no API key is hardcoded anywhere or in my git history, since I need to make this repo public.
> 4. Make sure the frontend calls the backend with relative URLs (like `/api/reading`), not `http://localhost:3000`.
> 5. Give me step-by-step instructions for setting up a Web Service on Render, including which environment variables to add.

Result: scanned all commits for keys (clean), bounded the Node version, made the static path robust, and added rate limiting and a daily cap.

### 13. Debugging the deploy
> [screenshot: Render repo list] i dont see the tarot repo

> waht's credentials?

> [screenshot: Render "Your service is live"]

> [screenshot: "The cards are cloudy right now"]

> i put 100 here , is it wrong

> where to find this?

> [screenshot] still

> [screenshot: Render logs "Claude API error: 401 API key is invalid."]

> [screenshot: Anthropic console key page] then what's the key

> https://tarot-kdf2.onrender.com/ wow its working

Result: gave Render access to the repo on GitHub. The 401 came from putting `100` (meant for `DAILY_READING_LIMIT`) and then the console's shortened key preview into `ANTHROPIC_API_KEY`. Fixed by creating a new key and pasting the full value.

## Code I wrote or substantially modified myself

<!-- TODO (write this yourself): list your own changes, e.g. colors/timing you changed in the
     "EDIT ME" CSS block, wording you edited in public/translations.js or SYSTEM_PROMPT, etc.
     Make at least a few real edits before submitting and describe them here. -->

## One place AI got it wrong

*(Drafted with Claude's help from our conversation; reviewed by me.)*

After deploying to Render, every reading failed with "The cards are cloudy right now." Claude confidently told me that normal Anthropic API keys start with `sk-ant-api03-`, so my `sk-ant-usr-` key was probably the wrong type. That was wrong: the prefix was fine. Instead of guessing further, I opened the Render logs and searched for "Claude". They showed `401 API key is invalid`. When I looked at my key in the Anthropic console, I realized the real problem: I had first typed `100` into the `ANTHROPIC_API_KEY` field (it was meant for `DAILY_READING_LIMIT`), and the console only shows a shortened preview like `sk-ant-usr-1Vl...IQAA`, not the full key. I created a new key, copied the full value with the Copy button, pasted it into Render, and the site worked. Claude then corrected its earlier claim. Lesson: check the real error message in the logs before trusting the AI's guess.

A second, smaller one: twice, a file Claude said it had saved to my computer was actually an older version, so the new reading-tone prompt silently never reached my `server.js`. After I noticed, Claude started checking each saved file with a checksum to confirm it actually arrived.

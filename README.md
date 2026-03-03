# ArguBot

ArguBot is a production-ready Discord bot that hosts two-person debates and uses an AI rubric judge to determine a winner.

## Features

- Slash-command based debate flow (`/debate`, `/argue`, `/judge`)
- Exactly two participants per debate session
- Structured argument format enforcement:
  - `CLAIM:`
  - `EVIDENCE:`
  - `REBUTTAL:`
  - `CONCLUSION:`
- AI judging with a 5-category rubric (0-10 each)
- Debate timeout protection after 1 hour
- MongoDB persistence for active and judged sessions

## Project Structure

```text
/argubot
 ├── package.json
 ├── index.js
 ├── commands/
 │    ├── debate.js
 │    ├── argue.js
 │    ├── judge.js
 ├── services/
 │    ├── aiJudge.js
 │    ├── debateManager.js
 ├── models/
 │    ├── DebateSession.js
 ├── config/
 │    ├── database.js
 ├── utils/
 │    ├── scoringRubric.js
 ├── .env.example
 └── README.md
```

## 1) Create a Discord Bot

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create a **New Application** (name it `ArguBot`).
3. Go to **Bot** and click **Add Bot**.
4. Under **Privileged Gateway Intents**, no extra intents are required for this bot.
5. Copy your bot token and keep it secret.
6. Go to **OAuth2 > URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Send Messages`, `Use Slash Commands`
7. Open generated URL and invite bot to your server.
8. Copy your **Application ID** from **General Information**.

## 2) Install Dependencies

```bash
npm install
```

## 3) Set Environment Variables

Copy `.env.example` to `.env` and fill values:

```bash
cp .env.example .env
```

Required variables:

- `DISCORD_TOKEN` - your bot token
- `DISCORD_CLIENT_ID` - Discord application ID
- `OPENAI_API_KEY` - OpenAI API key (or compatible key)
- `MONGO_URI` - MongoDB connection string

Optional:

- `DISCORD_GUILD_ID` - register slash commands instantly to one test guild
- `OPENAI_MODEL` - defaults to `gpt-4o-mini`

## 4) Run the Bot

Register slash commands first:

```bash
npm run register
```

Start bot:

```bash
npm start
```

## 5) Deploy to Railway or Render

### Railway

1. Create a new Node.js project from this repo.
2. Add environment variables from `.env` in Railway dashboard.
3. Set start command: `npm start`.
4. Trigger deployment.
5. Run one-time command job: `npm run register`.

### Render

1. Create a **Web Service** or **Background Worker** from this repo.
2. Set runtime to Node 20+.
3. Build command: `npm install`
4. Start command: `npm start`
5. Configure environment variables.
6. Run `npm run register` once after deployment.

## Command Usage

### Start a debate

```text
/debate topic:"Is AI good for jobs?"
```

### Submit argument

```text
/argue position:pro argument:"CLAIM: ...
EVIDENCE: ...
REBUTTAL: ...
CONCLUSION: ..."
```

### Judge debate

```text
/judge
```

Bot output:

- Winner mention
- Total scores for PRO and CON
- AI explanation

## Safety Guarantees

- Maximum two participants per session
- Blocks judging until both sides submit
- Expires active debates after one hour
- Logs each debate and judgment payload to MongoDB

## Notes

- This project uses the latest Discord.js v14 APIs.
- If using a non-OpenAI LLM endpoint, adapt `services/aiJudge.js` client initialization.

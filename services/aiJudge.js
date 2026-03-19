const OpenAI = require('openai');
const { calculateTotalScore } = require('../utils/scoringRubric');

let openaiClient;

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  return openaiClient;
}

function buildJudgePrompt({ topic, argumentA, argumentB }) {
  return `You are an impartial debate judge.

Topic:
${topic}

Argument A:
${argumentA}

Argument B:
${argumentB}

Evaluate both arguments using the rubric:

Logic
Evidence
Clarity
Rebuttal Strength
Persuasiveness

Score each category from 0–10.

Return JSON:

{
 winner: "...",
 scores: {
   A: {
     logic: 0,
     evidence: 0,
     clarity: 0,
     rebuttalStrength: 0,
     persuasiveness: 0
   },
   B: {
     logic: 0,
     evidence: 0,
     clarity: 0,
     rebuttalStrength: 0,
     persuasiveness: 0
   }
 },
 explanation: "..."
}`;
}

function extractJson(text) {
  const cleaned = text.trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    const maybeJson = cleaned.match(/\{[\s\S]*\}/);
    if (!maybeJson) {
      throw new Error('AI response did not contain valid JSON.');
    }
    return JSON.parse(maybeJson[0]);
  }
}

async function judgeDebate({ topic, proArgument, conArgument }) {
  const client = getOpenAIClient();

  const prompt = buildJudgePrompt({
    topic,
    argumentA: proArgument,
    argumentB: conArgument,
  });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You produce fair and concise debate judgments in strict JSON.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI judge returned an empty response.');
  }

  const parsed = extractJson(content);

  const proScores = parsed.scores?.A || {};
  const conScores = parsed.scores?.B || {};

  const proTotal = calculateTotalScore(proScores);
  const conTotal = calculateTotalScore(conScores);

  return {
    winnerLabel: proTotal >= conTotal ? 'pro' : 'con',
    scores: {
      pro: proTotal,
      con: conTotal,
      category: {
        pro: proScores,
        con: conScores,
      },
    },
    explanation: parsed.explanation || 'No explanation provided.',
    rawResponse: parsed,
  };
}

module.exports = {
  buildJudgePrompt,
  judgeDebate,
};

const DebateSession = require('../models/DebateSession');

const ONE_HOUR_MS = 60 * 60 * 1000;

function parseStructuredArgument(argumentText) {
  const pattern = /CLAIM:\s*([\s\S]*?)\n\s*EVIDENCE:\s*([\s\S]*?)\n\s*REBUTTAL:\s*([\s\S]*?)\n\s*CONCLUSION:\s*([\s\S]*)/i;
  const match = argumentText.match(pattern);

  if (!match) {
    throw new Error(
      'Argument must follow the format:\nCLAIM:\nEVIDENCE:\nREBUTTAL:\nCONCLUSION:'
    );
  }

  const [, claim, evidence, rebuttal, conclusion] = match.map((section) => section?.trim?.());
  if (!claim || !evidence || !rebuttal || !conclusion) {
    throw new Error('All argument sections are required (CLAIM, EVIDENCE, REBUTTAL, CONCLUSION).');
  }

  return { claim, evidence, rebuttal, conclusion };
}

async function expireStaleDebates() {
  await DebateSession.updateMany(
    {
      status: 'active',
      expiresAt: { $lte: new Date() },
    },
    { $set: { status: 'expired' } }
  );
}

async function getActiveDebate(guildId, channelId) {
  await expireStaleDebates();

  return DebateSession.findOne({
    guildId,
    channelId,
    status: 'active',
  });
}

async function createDebate({ guildId, channelId, topic, userId, username }) {
  const existing = await getActiveDebate(guildId, channelId);
  if (existing) {
    throw new Error('There is already an active debate in this channel. Judge or wait for it to expire.');
  }

  return DebateSession.create({
    guildId,
    channelId,
    topic,
    participants: [{ userId, username }],
    arguments: { pro: null, con: null },
    status: 'active',
    expiresAt: new Date(Date.now() + ONE_HOUR_MS),
  });
}

async function submitArgument({ guildId, channelId, userId, username, position, argumentText }) {
  const debate = await getActiveDebate(guildId, channelId);
  if (!debate) {
    throw new Error('No active debate found in this channel. Start one with /debate.');
  }

  if (debate.expiresAt <= new Date()) {
    debate.status = 'expired';
    await debate.save();
    throw new Error('This debate has expired. Start a new one with /debate.');
  }

  const validPosition = position.toLowerCase();
  if (!['pro', 'con'].includes(validPosition)) {
    throw new Error('Position must be either "pro" or "con".');
  }

  const existingSlot = debate.arguments[validPosition];
  if (existingSlot && existingSlot.userId !== userId) {
    throw new Error(`The ${validPosition.toUpperCase()} position is already taken.`);
  }

  if (!debate.participants.some((participant) => participant.userId === userId)) {
    if (debate.participants.length >= 2) {
      throw new Error('This debate already has two participants.');
    }

    debate.participants.push({ userId, username });
  }

  const parsed = parseStructuredArgument(argumentText);

  debate.arguments[validPosition] = {
    userId,
    username,
    position: validPosition,
    ...parsed,
    rawText: argumentText,
    submittedAt: new Date(),
  };

  await debate.save();

  return debate;
}

function ensureReadyForJudging(debate) {
  if (!debate) {
    throw new Error('No active debate found in this channel.');
  }

  if (debate.status !== 'active') {
    throw new Error('This debate is not active and cannot be judged.');
  }

  if (!debate.arguments.pro || !debate.arguments.con) {
    throw new Error('Both PRO and CON arguments must be submitted before judging.');
  }
}

async function markDebateJudged(debateId, result) {
  const debate = await DebateSession.findById(debateId);
  if (!debate) {
    throw new Error('Debate not found.');
  }

  debate.status = 'judged';
  debate.judgedResult = {
    winnerUserId: result.winnerUserId,
    winnerLabel: result.winnerLabel,
    scores: {
      pro: result.scores.pro,
      con: result.scores.con,
    },
    explanation: result.explanation,
    rawLLMResponse: result.rawResponse,
    judgedAt: new Date(),
  };

  await debate.save();

  return debate;
}

module.exports = {
  ONE_HOUR_MS,
  parseStructuredArgument,
  createDebate,
  submitArgument,
  getActiveDebate,
  ensureReadyForJudging,
  markDebateJudged,
  expireStaleDebates,
};

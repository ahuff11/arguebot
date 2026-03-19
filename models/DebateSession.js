const mongoose = require('mongoose');

const ArgumentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    position: { type: String, enum: ['pro', 'con'], required: true },
    claim: { type: String, required: true },
    evidence: { type: String, required: true },
    rebuttal: { type: String, required: true },
    conclusion: { type: String, required: true },
    rawText: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const DebateSessionSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, index: true },
    topic: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'judged', 'expired'],
      default: 'active',
      index: true,
    },
    participants: {
      type: [
        {
          userId: { type: String, required: true },
          username: { type: String, required: true },
          joinedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
      validate: {
        validator(value) {
          return value.length <= 2;
        },
        message: 'A debate can have at most 2 participants.',
      },
    },
    arguments: {
      pro: { type: ArgumentSchema, default: null },
      con: { type: ArgumentSchema, default: null },
    },
    judgedResult: {
      winnerUserId: { type: String, default: null },
      winnerLabel: { type: String, default: null },
      scores: {
        pro: { type: Number, default: null },
        con: { type: Number, default: null },
      },
      explanation: { type: String, default: null },
      rawLLMResponse: { type: mongoose.Schema.Types.Mixed, default: null },
      judgedAt: { type: Date, default: null },
    },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

DebateSessionSchema.index({ guildId: 1, channelId: 1, status: 1 });

module.exports = mongoose.model('DebateSession', DebateSessionSchema);

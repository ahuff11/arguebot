


const { SlashCommandBuilder } = require('discord.js');
const {
  ensureReadyForJudging,
  getActiveDebate,
  markDebateJudged,
} = require('../services/debateManager');
const { judgeDebate } = require('../services/aiJudge');

function formatArgument(argument) {
  return `CLAIM:\n${argument.claim}\n\nEVIDENCE:\n${argument.evidence}\n\nREBUTTAL:\n${argument.rebuttal}\n\nCONCLUSION:\n${argument.conclusion}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('judge')
    .setDescription('Ask ArguBot to judge the current debate.'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const debate = await getActiveDebate(interaction.guildId, interaction.channelId);
      ensureReadyForJudging(debate);

      const proArgument = formatArgument(debate.arguments.pro);
      const conArgument = formatArgument(debate.arguments.con);

      const aiResult = await judgeDebate({
        topic: debate.topic,
        proArgument,
        conArgument,
      });

      const winnerLabel = aiResult.winnerLabel;
      const winnerUserId = debate.arguments[winnerLabel].userId;

      await markDebateJudged(debate.id, {
        winnerUserId,
        winnerLabel,
        scores: aiResult.scores,
        explanation: aiResult.explanation,
        rawResponse: aiResult.rawResponse,
      });

      await interaction.editReply({
        content:
          '🏆 **Debate Result**\n\n' +
          `Winner: <@${winnerUserId}> (${winnerLabel.toUpperCase()})\n\n` +
          `Scores:\n` +
          `PRO: ${aiResult.scores.pro}\n` +
          `CON: ${aiResult.scores.con}\n\n` +
          `AI Explanation:\n${aiResult.explanation}`,
      });
    } catch (error) {
      await interaction.editReply({
        content: error.message,
      });
    }
  },
};




const { SlashCommandBuilder } = require('discord.js');
const { createDebate } = require('../services/debateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debate')
    .setDescription('Start a new debate in this channel.')
    .addStringOption((option) =>
      option
        .setName('topic')
        .setDescription('Debate topic, e.g. "Is AI good for jobs?"')
        .setRequired(true)
    ),

  async execute(interaction) {
    const topic = interaction.options.getString('topic', true).trim();

    try {
      const debate = await createDebate({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        topic,
        userId: interaction.user.id,
        username: interaction.user.username,
      });

      await interaction.reply({
        content:
          `🗣️ Debate started: **${debate.topic}**\n` +
          `Participants: <@${interaction.user.id}> (joined)\n` +
          'Use `/argue position:<pro|con> argument:<text>` to submit your argument.\n' +
          'Debate timeout: **1 hour**.',
      });
    } catch (error) {
      await interaction.reply({
        content:  error.message,
        ephemeral: true,
      });
    }
  },
};

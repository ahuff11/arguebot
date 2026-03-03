


const { SlashCommandBuilder } = require('discord.js');
const { submitArgument } = require('../services/debateManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('argue')
    .setDescription('Submit your argument for the active debate.')
    .addStringOption((option) =>
      option
        .setName('position')
        .setDescription('Choose your side in the debate.')
        .setRequired(true)
        .addChoices(
          { name: 'Pro', value: 'pro' },
          { name: 'Con', value: 'con' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('argument')
        .setDescription('Structured argument with CLAIM, EVIDENCE, REBUTTAL, CONCLUSION.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const position = interaction.options.getString('position', true);
    const argumentText = interaction.options.getString('argument', true);

    try {
      const debate = await submitArgument({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        userId: inteSraction.user.id,
        username: interaction.user.username,
        position,
        argumentText,
      });

      const proSubmitted = debate.arguments.pro ? '✅' : '⌛';
      const conSubmitted = debate.arguments.con ? '✅' : '⌛';

      await interaction.reply({
        content:
          `Argument submitted for **${position.toUpperCase()}** by <@${interaction.user.id}>.\n` +
          `Progress: PRO ${proSubmitted} | CON ${conSubmitted}`,
      });
    } catch (error) {
      await interaction.reply({
        content:error.message,
        ephemeral: true,
      });
    }
  },
};

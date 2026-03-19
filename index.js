require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require('discord.js');
const { connectDatabase } = require('./config/database');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN) {
  throw new Error('DISCORD_TOKEN is required.');
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] Command at ${filePath} is missing required properties.`);
  }
}

async function registerCommands() {
  if (!CLIENT_ID) {
    throw new Error('DISCORD_CLIENT_ID is required to register slash commands.');
  }

  const rest = new REST().setToken(TOKEN);
  const payload = [...client.commands.values()].map((command) => command.data.toJSON());

  if (GUILD_ID) {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: payload,
    });
    console.log(`Registered ${payload.length} guild commands to guild ${GUILD_ID}.`);
    return;
  }

  await rest.put(Routes.applicationCommands(CLIENT_ID), {
    body: payload,
  });
  console.log(`Registered ${payload.length} global commands.`);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true,
      });
    }
  }
});

(async () => {
  try {
    await connectDatabase(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    if (process.argv.includes('--register-commands')) {
      await registerCommands();
      process.exit(0);
    }

    await client.login(TOKEN);
  } catch (error) {
    console.error('Startup failure:', error);
    process.exit(1);
  }
})();

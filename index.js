// Import necessary modules
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const yahooFinance = require('yahoo-finance2').default;

DISCORD_TOKEN = 'MTI4NDE1MTI0Mjc5NjU2NDUxMQ.GWm_Hd.TuEjVZdyGXeZMCytlODt_ddCP64urkILWFuBGs'
DISCORD_CHANNEL_ID= '1284152053966307469'
DISCORD_GUILD_ID= '1195098222591479890'

// Create a new Discord client with Guilds and Interactions intent
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Configuration
const STOCK_SYMBOL = 'RYDE';  // The stock symbol to track periodically
let lastPrice = null;         // To store the last known price
const THRESHOLD = 0.05;       // Alert if price drops by more than $0.5
const CHECK_INTERVAL = 60000; // Check stock price every minute (60000 ms)

// Function to periodically check the stock price for the default STOCK_SYMBOL
async function checkStockPrice() {
    try {
        const quote = await yahooFinance.quote(STOCK_SYMBOL);
        const currentPrice = quote.regularMarketPrice;

        // Compare current price with the last known price
        if (lastPrice && (lastPrice - currentPrice) >= THRESHOLD) {
            // Send a message to Discord if the price drops below the threshold
            const message = `🚨 ${STOCK_SYMBOL} price dropped! Current price: $${currentPrice.toFixed(2)}, Previous price: $${lastPrice.toFixed(2)}`;
            client.channels.cache.get(DISCORD_CHANNEL_ID).send(message);
        }

        lastPrice = currentPrice;  // Update last known price
    } catch (error) {
        console.error('Error fetching stock price:', error);
    }
}

// Register slash commands (such as /check with a symbol option)
const commands = [
    {
        name: 'check',
        description: 'Check the current price of a stock',
        options: [
            {
                name: 'symbol',
                description: 'The stock symbol to check (e.g., AAPL)',
                type: 3,  // STRING type for the symbol
                required: true
            }
        ]
    }
];

// Register commands when the bot starts
client.once('ready', async () => {
    console.log('Stock Price Bot is online!');

    // Register the /check command with the Discord API
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, DISCORD_GUILD_ID),
            { body: commands }
        );
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    // Periodic stock price checking for the default STOCK_SYMBOL
    setInterval(checkStockPrice, CHECK_INTERVAL);
});

// Event listener for slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'check') {
        const symbol = options.getString('symbol');  // Get the symbol option from the command
        try {
            const quote = await yahooFinance.quote(symbol);
            const currentPrice = quote.regularMarketPrice;
            await interaction.reply(`The current price of ${symbol} is $${currentPrice.toFixed(2)}.`);
        } catch (error) {
            await interaction.reply(`Error fetching stock price for ${symbol}.`);
        }
    }
});

// Log the bot in using the token from the code
client.login(DISCORD_TOKEN);

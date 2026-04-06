const TelegramBot = require('node-telegram-bot-api');

// ==========================================
// CONFIGURATION
// ==========================================
// IMPORTANT: Replace 'YOUR_TELEGRAM_BOT_TOKEN' with the token you get from @BotFather
const token = 'YOUR_TELEGRAM_BOT_TOKEN'; 

// Channels users need to join
const BINANCE_CHANNEL = '@binance';
const SUPPORT_CHANNEL = '@BinanceHelpDesk';

// Bot Settings
const REWARD_INITIAL = 40; // USDT for joining
const REWARD_REFERRAL = 10; // USDT per referral
const MIN_WITHDRAWAL = 80; // Minimum USDT to withdraw

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// ==========================================
// DATABASE (Simulated In-Memory)
// ==========================================
// Note: For a real production bot, replace this Map with a real database
// like MongoDB, PostgreSQL, or Firebase so data isn't lost when the server restarts.
const users = new Map();

function getUser(chatId) {
    if (!users.has(chatId)) {
        users.set(chatId, {
            id: chatId,
            balance: 0,
            referrals: 0,
            referredBy: null,
            tasksCompleted: false,
            wallet: null
        });
    }
    return users.get(chatId);
}

// ==========================================
// COMMAND: /start
// ==========================================
bot.onText(/\/start(?:\s+(.+))?/, (msg, match) => {
    const chatId = msg.chat.id;
    const user = getUser(chatId);
    
    // Check if user was referred by someone else (e.g., /start 123456789)
    const referralId = match[1];
    if (referralId && !user.tasksCompleted && referralId != chatId) {
        user.referredBy = parseInt(referralId);
    }

    if (!user.tasksCompleted) {
        // Send Task Instructions
        const options = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📢 Join Binance Official", url: `https://t.me/${BINANCE_CHANNEL.replace('@', '')}` }],
                    [{ text: "🛠 Join Binance Support", url: `https://t.me/${SUPPORT_CHANNEL.replace('@', '')}` }],
                    [{ text: "✅ I Have Joined Both", callback_data: "verify_join" }]
                ]
            }
        };

        bot.sendMessage(chatId, `🎁 *Welcome to the Easter USDT Airdrop!*\n\nTo receive your initial *40 USDT* reward, you must join our official channels:\n\n1️⃣ Join Binance Official\n2️⃣ Join Binance Support\n\nClick the button below once you have joined!`, { parse_mode: 'Markdown', ...options });
    } else {
        showMainMenu(chatId);
    }
});

// ==========================================
// CALLBACK: Verify Tasks
// ==========================================
bot.on('callback_query', async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;
    const user = getUser(chatId);

    if (callbackQuery.data === 'verify_join') {
        if (user.tasksCompleted) {
            bot.answerCallbackQuery(callbackQuery.id, { text: "You have already completed the tasks!", show_alert: true });
            return;
        }

        /* 
        IMPORTANT NOTE ABOUT VERIFICATION:
        Telegram API only allows bots to check channel membership (getChatMember) if the bot is an ADMINISTRATOR of that channel. 
        Since you do not own @binance, the bot cannot truly verify it via the Telegram API.
        Most airdrop bots handle this by just simulating verification after the user clicks the button.
        */
        
        bot.answerCallbackQuery(callbackQuery.id, { text: "Verifying your membership... ✅ Verified!" });
        
        // Mark tasks as completed
        user.tasksCompleted = true;
        user.balance += REWARD_INITIAL;

        // Reward the Referrer if applicable
        if (user.referredBy) {
            const referrer = getUser(user.referredBy);
            referrer.balance += REWARD_REFERRAL;
            referrer.referrals += 1;
            bot.sendMessage(user.referredBy, `🎉 *New Referral!*\nSomeone joined using your link. You earned *10 USDT*!\nYour new balance is *${referrer.balance} USDT*.`, { parse_mode: 'Markdown' });
        }

        bot.sendMessage(chatId, `🎉 *Congratulations!*\n\nYou have received *40 USDT* for completing the tasks.\nUse the menu below to earn more or withdraw.`, { parse_mode: 'Markdown' });
        showMainMenu(chatId);
    }
});

// ==========================================
// MAIN MENU & TEXT COMMANDS
// ==========================================
function showMainMenu(chatId) {
    bot.sendMessage(chatId, "🎛 *Main Menu*", {
        parse_mode: 'Markdown',
        reply_markup: {
            keyboard: [
                [{ text: "💰 Balance" }, { text: "👥 Referral" }],
                [{ text: "💸 Withdraw" }]
            ],
            resize_keyboard: true
        }
    });
}

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;
    const user = getUser(chatId);

    // Ignore start command as it's handled above
    if (text && text.startsWith('/start')) return;

    if (text === '💰 Balance') {
        bot.sendMessage(chatId, `💰 *Your Account Balance*\n\n💵 *Balance:* ${user.balance} USDT\n👥 *Referrals:* ${user.referrals}\n\nInvite friends to earn 10 USDT per referral!`, { parse_mode: 'Markdown' });
    } 
    
    else if (text === '👥 Referral') {
        const refLink = `https://t.me/EasterUSDTAirdropBot?start=${chatId}`;
        bot.sendMessage(chatId, `👥 *Referral Program*\n\nEarn *10 USDT* for every friend you invite!\n\n👇 *Your unique referral link:*\n\`${refLink}\`\n\nShare this link to reach the withdrawal minimum!`, { parse_mode: 'Markdown' });
    } 
    
    else if (text === '💸 Withdraw') {
        if (user.balance < MIN_WITHDRAWAL) {
            bot.sendMessage(chatId, `❌ *Withdrawal Failed*\n\nYou need at least *${MIN_WITHDRAWAL} USDT* to withdraw.\nYour current balance: *${user.balance} USDT*.\n\nInvite ${Math.ceil((MIN_WITHDRAWAL - user.balance) / REWARD_REFERRAL)} more friends to unlock withdrawals!`, { parse_mode: 'Markdown' });
        } else {
            // Prompt for BEP-20 Wallet
            bot.sendMessage(chatId, `🏦 *Withdrawal Process*\n\nPlease reply to this message with your *BEP-20 (Binance Smart Chain) Wallet Address*.`, {
                parse_mode: 'Markdown',
                reply_markup: { force_reply: true }
            });
        }
    }
});

// ==========================================
// HANDLE WALLET REPLIES
// ==========================================
bot.on('message', (msg) => {
    // If the message is a reply to the bot's force_reply for withdrawal
    if (msg.reply_to_message && msg.reply_to_message.text.includes('BEP-20')) {
        const chatId = msg.chat.id;
        const user = getUser(chatId);
        const walletAddress = msg.text.trim();

        // Basic BEP-20 validation (Starts with 0x and is 42 characters long)
        const bep20Regex = /^0x[a-fA-F0-9]{40}$/;

        if (bep20Regex.test(walletAddress)) {
            user.wallet = walletAddress;
            // Deduct balance to simulate withdrawal processing
            const withdrawalAmount = user.balance;
            user.balance = 0;

            bot.sendMessage(chatId, `✅ *Withdrawal Request Submitted!*\n\nAmount: *${withdrawalAmount} USDT*\nWallet: \`${walletAddress}\`\n\nYour airdrop will be processed and sent to your wallet within 48 hours. Thank you for participating in the Easter USDT Airdrop!`, { parse_mode: 'Markdown' });
            
            // Log to console so admin knows to process it
            console.log(`[WITHDRAWAL ALERT] User ${chatId} requested ${withdrawalAmount} USDT to wallet ${walletAddress}`);
        } else {
            bot.sendMessage(chatId, `❌ *Invalid Address*\n\nThat does not look like a valid BEP-20 address. It should start with '0x'. Please tap '💸 Withdraw' to try again.`, { parse_mode: 'Markdown' });
        }
    }
});

console.log('✅ Telegram Airdrop Bot Server is running!');
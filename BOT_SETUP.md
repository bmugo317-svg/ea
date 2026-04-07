# Telegram Bot Setup

## 1) Install dependencies

```bash
npm install
```

## 2) Set environment variables

Required:

- `TELEGRAM_BOT_TOKEN`: token from BotFather

Optional:

- `PORT` (default `3000`)
- `MINI_APP_URL` (default `https://easter-airdrop-miniapp.pages.dev`)
- `BOT_USERNAME` (default `EasterUSDTAirdropBot`)

## 3) Start the bot

```bash
npm run start:bot
```

## Health checks

- `GET /`
- `GET /healthz`

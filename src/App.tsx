import { useMemo, useState } from "react";

const defaultEndpoint = "https://eagfd.bmugo317.workers.dev/";

export default function App() {
  const [endpoint, setEndpoint] = useState(defaultEndpoint);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const workerCode = useMemo(() => {
    return `// src/index.js
// Cloudflare Worker Telegram bot with withdrawal flow:
// - asks for BEP20 wallet
// - asks for email
// - sends + verifies email code
// - enforces minimum withdrawal 80 USDT
// - saves user email + wallet pair

const MIN_WITHDRAWAL_USDT = 80;
const CODE_TTL_SECONDS = 600;

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    const update = await request.json();
    const message = update?.message;
    const chatId = message?.chat?.id;
    const userId = message?.from?.id;
    const text = String(message?.text || "").trim();

    if (!chatId || !userId || !text) {
      return new Response("ignored", { status: 200 });
    }

    const session = await getSession(env, userId);

    if (text === "/start") {
      await sendTelegram(env, chatId, "Welcome. Use /withdraw to request a BEP20 withdrawal.");
      return new Response("ok", { status: 200 });
    }

    if (text === "/withdraw") {
      session.step = "awaiting_wallet";
      delete session.wallet;
      delete session.email;
      await setSession(env, userId, session);
      await sendTelegram(env, chatId, "Send your BEP20 wallet address (0x...).");
      return new Response("ok", { status: 200 });
    }

    if (session.step === "awaiting_wallet") {
      if (!/^0x[a-fA-F0-9]{40}$/.test(text)) {
        await sendTelegram(env, chatId, "Invalid BEP20 wallet. Please send a valid 0x address.");
        return new Response("ok", { status: 200 });
      }

      session.wallet = text;
      session.step = "awaiting_email";
      await setSession(env, userId, session);
      await sendTelegram(env, chatId, "Wallet saved. Send your email address.");
      return new Response("ok", { status: 200 });
    }

    if (session.step === "awaiting_email") {
      const email = text.toLowerCase();
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
        await sendTelegram(env, chatId, "Invalid email format. Send a valid email address.");
        return new Response("ok", { status: 200 });
      }

      const code = String(Math.floor(100000 + Math.random() * 900000));
      await env.BOT_KV.put(
        keyCode(userId),
        JSON.stringify({
          code,
          email,
          wallet: session.wallet,
          expiresAt: Date.now() + CODE_TTL_SECONDS * 1000,
        }),
        { expirationTtl: CODE_TTL_SECONDS },
      );

      await sendEmailCode(env, email, code);
      session.step = "awaiting_code";
      await setSession(env, userId, session);
      await sendTelegram(env, chatId, "A 6-digit code was sent to your email. Enter the code.");
      return new Response("ok", { status: 200 });
    }

    if (session.step === "awaiting_code") {
      const raw = await env.BOT_KV.get(keyCode(userId));
      if (!raw) {
        session.step = null;
        await setSession(env, userId, session);
        await sendTelegram(env, chatId, "Code expired. Start again with /withdraw.");
        return new Response("ok", { status: 200 });
      }

      const data = JSON.parse(raw);
      if (Date.now() > data.expiresAt || text !== data.code) {
        await sendTelegram(env, chatId, "Invalid code. Please try again.");
        return new Response("ok", { status: 200 });
      }

      session.email = data.email;
      session.wallet = data.wallet;
      session.step = "awaiting_amount";
      await setSession(env, userId, session);
      await env.BOT_KV.delete(keyCode(userId));

      await env.BOT_KV.put(
        keyProfile(userId),
        JSON.stringify({
          userId,
          email: data.email,
          wallet: data.wallet,
          updatedAt: new Date().toISOString(),
        }),
      );

      await sendTelegram(env, chatId, "Email verified. Enter amount (minimum 80 USDT).");
      return new Response("ok", { status: 200 });
    }

    if (session.step === "awaiting_amount") {
      const amount = Number(text);
      if (!Number.isFinite(amount) || amount < MIN_WITHDRAWAL_USDT) {
        await sendTelegram(env, chatId, "Minimum withdrawal is 80 USDT.");
        return new Response("ok", { status: 200 });
      }

      const requestId = crypto.randomUUID();
      await env.BOT_KV.put(
        keyWithdrawal(userId, requestId),
        JSON.stringify({
          requestId,
          userId,
          email: session.email,
          wallet: session.wallet,
          network: "BEP20",
          amount,
          status: "pending",
          createdAt: new Date().toISOString(),
        }),
      );

      session.step = null;
      await setSession(env, userId, session);
      await sendTelegram(env, chatId, "Withdrawal submitted successfully.");
      return new Response("ok", { status: 200 });
    }

    await sendTelegram(env, chatId, "Use /withdraw to start a withdrawal request.");
    return new Response("ok", { status: 200 });
  },
};

function keySession(userId) {
  return \`session:\${userId}\`;
}

function keyCode(userId) {
  return \`withdraw_code:\${userId}\`;
}

function keyProfile(userId) {
  return \`user_profile:\${userId}\`;
}

function keyWithdrawal(userId, requestId) {
  return \`withdrawal:\${userId}:\${requestId}\`;
}

async function getSession(env, userId) {
  const raw = await env.BOT_KV.get(keySession(userId));
  if (!raw) return { step: null };
  return JSON.parse(raw);
}

async function setSession(env, userId, session) {
  await env.BOT_KV.put(keySession(userId), JSON.stringify(session));
}

async function sendTelegram(env, chatId, text) {
  const url = \`https://api.telegram.org/bot\${env.TELEGRAM_BOT_TOKEN}/sendMessage\`;
  await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function sendEmailCode(env, toEmail, code) {
  // Uses Resend API. You can swap this with Mailgun, SendGrid, SMTP API, etc.
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${env.RESEND_API_KEY}\`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [toEmail],
      subject: "Your withdrawal verification code",
      text: \`Your verification code is \${code}. It expires in 10 minutes.\`,
    }),
  });
}
`;
  }, []);

  const wranglerSnippet = useMemo(() => {
    return `# wrangler.toml
name = "telegram-withdraw-bot"
main = "src/index.js"
compatibility_date = "2026-01-01"

[[kv_namespaces]]
binding = "BOT_KV"
id = "PUT_YOUR_KV_NAMESPACE_ID_HERE"
`;
  }, []);

  const webhookCommand = useMemo(() => {
    return `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=${endpoint}`;
  }, [endpoint]);

  const copyWorkerCode = async () => {
    await navigator.clipboard.writeText(workerCode);
    setCopyState("copied");
    window.setTimeout(() => setCopyState("idle"), 1400);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <section className="space-y-6 border-b border-zinc-800 pb-8">
          <p className="inline-block bg-zinc-900 px-3 py-1 text-xs tracking-[0.2em] text-zinc-300">
            TELEGRAM WITHDRAWAL PATCH
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Full restart code from scratch for BEP20 withdrawals with email verification and 80 USDT minimum.
          </h1>
          <p className="max-w-3xl text-zinc-300">
            Copy the worker file, deploy, set webhook, and your current bot will require BEP20 wallet, email code
            confirmation, then amount. User email and wallet are saved together in KV.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
            <span className="border border-zinc-700 px-3 py-1 transition-colors duration-300 hover:border-zinc-500">
              Withdrawal enabled
            </span>
            <span className="border border-zinc-700 px-3 py-1 transition-colors duration-300 hover:border-zinc-500">
              Min withdrawal: 80 USDT
            </span>
            <span className="border border-zinc-700 px-3 py-1 transition-colors duration-300 hover:border-zinc-500">
              Network: BEP20
            </span>
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">1. Worker Code (src/index.js)</h2>
            <button
              type="button"
              onClick={copyWorkerCode}
              className="border border-zinc-700 px-4 py-2 text-sm transition-all duration-300 hover:border-zinc-400 hover:bg-zinc-900 active:scale-[0.98]"
            >
              {copyState === "copied" ? "Copied" : "Copy code"}
            </button>
          </div>
          <textarea
            value={workerCode}
            readOnly
            className="h-[460px] w-full border border-zinc-800 bg-black/40 p-4 font-mono text-xs text-zinc-200 outline-none"
          />
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold">2. Wrangler Config</h2>
          <textarea
            value={wranglerSnippet}
            readOnly
            className="h-32 w-full border border-zinc-800 bg-black/40 p-4 font-mono text-xs text-zinc-200 outline-none"
          />
        </section>

        <section className="mt-8 space-y-4 border-t border-zinc-800 pt-8">
          <h2 className="text-xl font-semibold">3. Deploy Steps</h2>
          <ol className="list-decimal space-y-2 pl-5 text-zinc-300">
            <li>Create KV namespace: <code className="text-zinc-100">wrangler kv namespace create BOT_KV</code></li>
            <li>Add returned namespace id to <code className="text-zinc-100">wrangler.toml</code></li>
            <li>Set secrets: <code className="text-zinc-100">wrangler secret put TELEGRAM_BOT_TOKEN</code></li>
            <li>Set secrets: <code className="text-zinc-100">wrangler secret put RESEND_API_KEY</code></li>
            <li>Set secrets: <code className="text-zinc-100">wrangler secret put EMAIL_FROM</code></li>
            <li>Deploy: <code className="text-zinc-100">wrangler deploy</code></li>
          </ol>
        </section>

        <section className="mt-8 space-y-3 border-t border-zinc-800 pt-8">
          <h2 className="text-xl font-semibold">4. Set Webhook</h2>
          <label className="block space-y-2 text-sm text-zinc-300">
            <span>Worker URL</span>
            <input
              value={endpoint}
              onChange={(event) => setEndpoint(event.target.value)}
              className="w-full border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none transition-colors duration-300 focus:border-zinc-400"
            />
          </label>
          <textarea
            value={webhookCommand}
            readOnly
            className="h-16 w-full border border-zinc-800 bg-black/40 p-3 font-mono text-xs text-zinc-200 outline-none"
          />
          <p className="text-sm text-zinc-400">Open this URL in browser after deploy, then test /withdraw in Telegram.</p>
        </section>
      </div>
    </main>
  );
}

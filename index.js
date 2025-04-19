import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

const supabaseUrl = "https://rwywcmylrgsyhvdtfcbe.supabase.co";
const supabaseKey = "sbp_d7d9caed6743308cd4939612c5f919c174f860c4";

const saveMessage = async (role, content, session_id) => {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/chat_history`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify([
        {
          session_id,
          role,
          content,
          timestamp: new Date().toISOString(),
        },
      ]),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Ошибка Supabase:", text);
    }
  } catch (err) {
    console.error("Ошибка при сохранении в Supabase:", err.message);
  }
};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  const session_id = `tg_${chatId}`;

  if (!text) return;

  await saveMessage("user", text, session_id);

  const messages = [
    {
      role: "system",
      content: `Ты — виртуальный помощник Booking Hub в Сочи.

Отвечай кратко, по делу и дружелюбно. 
❌ Не добавляй размышления, инструкции или теги <think>. 
✅ Пиши готовый ответ.`,
    },
    { role: "user", content: text },
  ];

  // Тайпинг
  bot.sendChatAction(chatId, "typing");

  try {
    const res = await fetch("https://api.novita.ai/v3/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOVITA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-turbo",
        messages,
        temperature: 1,
        max_tokens: 1024,
      }),
    });

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "Что-то пошло не так...";
    const clean = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    await bot.sendMessage(chatId, clean);
    await saveMessage("assistant", clean, session_id);
  } catch (err) {
    console.error("Ошибка запроса:", err.message);
    await bot.sendMessage(chatId, "Произошла ошибка. Попробуйте позже.");
  }
});

import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: {
    autoStart: false,
  },
});

// Старт polling вручную после настройки
bot.startPolling();

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const messages = [
    {
      role: "system",
      content: "Ты — виртуальный помощник Booking Hub в Сочи. Отвечай кратко, по делу и дружелюбно.",
    },
    { role: "user", content: text },
  ];

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
        response_format: { type: "text" },
      }),
    });

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Ошибка получения ответа.";
    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error("Ошибка:", err);
    bot.sendMessage(chatId, "Произошла ошибка при обращении к ассистенту.");
  }
});

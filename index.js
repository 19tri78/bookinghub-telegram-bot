import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  // Показать "бот печатает..."
  await bot.sendChatAction(chatId, "typing");

  const messages = [
    {
      role: "system",
      content: `Ты — виртуальный помощник Booking Hub в Сочи.

Отвечай кратко, дружелюбно, по делу, от лица команды Booking Hub.

❌ Не добавляй размышления, пояснения, внутренние мысли или инструкции.
❌ Никогда не используй теги <think> или подобные.
✅ Давай только готовый, дружелюбный ответ. Пример: "Кондиционеры работают на полную! 😎 Хотите помощь с жильём?"`,
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
        temperature: 0.9,
        max_tokens: 1000,
        response_format: { type: "text" },
      }),
    });

    const data = await res.json();
    let reply = data?.choices?.[0]?.message?.content || "Извините, не удалось получить ответ.";

    // Удаляем размышления, если остались
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error("Ошибка:", err);
    bot.sendMessage(chatId, "Произошла ошибка. Попробуйте позже.");
  }
});

import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  const messages = [
    {
      role: "system",
      content: `Ты — виртуальный помощник Booking Hub в Сочи.

Отвечай кратко, чётко, дружелюбно, по существу.

❌ Не пиши размышления, объяснения, внутренние мысли или инструкции.
❌ Не используй теги <think> и не описывай процесс ответа.
✅ Дай только готовый ответ от лица команды Booking Hub.`,
    },
    { role: "user", content: text },
  ];

  try {
    // ⌨️ Показываем, что бот печатает
    await bot.sendChatAction(chatId, "typing");

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
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        response_format: { type: "text" },
      }),
    });

    const data = await res.json();
    let reply = data?.choices?.[0]?.message?.content || "Не удалось получить ответ.";

    // 🧹 Удаляем размышления (теги <think>)
    reply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    await bot.sendMessage(chatId, reply);
  } catch (err) {
    console.error("Ошибка:", err);
    await bot.sendMessage(chatId, "Произошла ошибка. Попробуй позже.");
  }
});

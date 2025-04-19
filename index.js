import TelegramBot from "node-telegram-bot-api";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  try {
    // Показываем, что бот "печатает"
    await bot.sendChatAction(chatId, "typing");
    await new Promise(resolve => setTimeout(resolve, 1000)); // задержка 1 сек

    const messages = [
      {
        role: "system",
        content: `Ты — Telegram-бот Booking Hub в Сочи.
Отвечай кратко, чётко, дружелюбно, по существу.

❌ Не пиши размышления, объяснения, внутренние мысли или инструкции.
❌ Не используй теги <think> и не описывай процесс ответа.
✅ Дай только готовый ответ от лица команды Booking Hub.`,
      },
      { role: "user", content: text },
    ];

    const response = await fetch("https://api.novita.ai/v3/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NOVITA_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-turbo",
        messages,
        response_format: { type: "text" },
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      }),
    });

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content || "Не удалось получить ответ.";
    const cleanReply = reply.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    await bot.sendMessage(chatId, cleanReply);
  } catch (err) {
    console.error("Ошибка:", err);
    await bot.sendMessage(chatId, "Произошла ошибка при обращении к ассистенту.");
  }
});

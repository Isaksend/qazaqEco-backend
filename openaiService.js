import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Никогда не хардкодьте ключ в коде!
});

export async function generateText(prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("Ошибка при запросе к OpenAI API:", error);
        return null;
    }
}

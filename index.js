import { generateText } from "./openaiService.js";
import axios from "axios";

async function main() {
    try {
        const response = await axios.get("http://localhost:5000/api/water", {
            params: {
                iin: "010101123456",
                start: "2025-02-02T00:00:00",
                end: "2025-02-02T23:59:59",
            },
        });

        const data = response.data;

        console.log("Данные из локального API:", data);

        const prompt = `Проанализируй данные об использовании воды в формате JSON: "Не говори про формат данных, анализируй только данные"\n${JSON.stringify(data, null, 2)}\nДай краткий вывод и полезные рекомендации.`;
        const analysis = await generateText(prompt);

        console.log("Анализ данных от OpenAI:", analysis);
    } catch (error) {
        console.error("Ошибка в процессе выполнения:", error.message);
    }
}

main();

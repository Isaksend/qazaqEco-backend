import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import axios from "axios";
import waterRoutes from "./routes/waterRoutes.js";
import connectDb from "./db/database.js";
import { generateText } from "./openaiService.js";
import userRoutes from "./routes/userRoutes.js";
import { authenticateToken } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Подключение к базе данных
(async () => {
    const db = await connectDb();
    app.set("db", db);

    // Маршруты для пользователей
    app.use("/auth", userRoutes);

    // Маршруты
    app.use("/", waterRoutes);

    // Интеграция анализа данных с OpenAI
    app.get("/analyze", async (req, res) => {
        const { iin, start, end } = req.query;

        if (!iin || !start || !end) {
            return res.status(400).json({ error: "Параметры iin, start и end обязательны." });
        }

        try {
            // Получение данных из API
            const response = await axios.get("http://localhost:5000/api/water", {
                params: { iin, start, end },
            });

            const data = response.data;

            // Генерация анализа через OpenAI
            const prompt = `Проанализируй данные об использовании воды в формате JSON: "Не говори про формат данных, анализируй только данные"\n${JSON.stringify(data, null, 2)}\nДай краткий вывод и полезные рекомендации.`;
            const analysis = await generateText(prompt);

            res.json({ data, analysis });
        } catch (error) {
            console.error("Ошибка анализа данных:", error.message);
            res.status(500).json({ error: "Ошибка анализа данных." });
        }
    });

    // Запуск сервера
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
})();

app.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: `Добро пожаловать, ${req.user.username}!` });
});
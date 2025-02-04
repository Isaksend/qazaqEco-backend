import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import dotenv from "dotenv";

dotenv.config();

// Инициализация базы данных
const db = await open({
    filename: "./database.sqlite",
    driver: sqlite3.Database,
});

// Создание новой таблицы с обновлённой структурой
await db.exec(`
  CREATE TABLE IF NOT EXISTS water_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    iin TEXT NOT NULL,
    family_size INTEGER NOT NULL,
    task TEXT NOT NULL,
    water_liters REAL NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL
  )
`);

const app = express();
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());


// // Эндпоинт: Получить все данные
// app.get("/api/water", async (req, res) => {
//     try {
//         const rows = await db.all("SELECT * FROM water_usage ORDER BY start_time ASC");
//         res.json(rows);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Ошибка сервера" });
//     }
// });


// Эндпоинт: Массовая вставка данных
app.post("/api/water/bulk", async (req, res) => {
    const records = req.body;

    if (!Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "Некорректные данные. Ожидается массив записей." });
    }

    const insertQuery = `
    INSERT INTO water_usage (iin, family_size, task, water_liters, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

    try {
        await db.run("BEGIN TRANSACTION");
        for (const record of records) {
            const { iin, family_size, task, water_liters, start_time, end_time } = record;

            if (!iin || !family_size || !task || !water_liters || !start_time || !end_time) {
                throw new Error("Все поля записи обязательны.");
            }

            await db.run(insertQuery, [iin, family_size, task, water_liters, start_time, end_time]);
        }
        await db.run("COMMIT");
        res.status(201).json({ message: "Данные успешно добавлены!" });
    } catch (error) {
        await db.run("ROLLBACK");
        console.error(error);
        res.status(500).json({ error: "Ошибка при добавлении данных." });
    }
});

// Эндпоинт: Удалить запись по ID
app.delete("/api/water/:id", async (req, res) => {
    const { id } = req.params;
    try {
        await db.run("DELETE FROM water_usage WHERE id = ?", [id]);
        res.json({ message: "Запись успешно удалена" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Ошибка при удалении" });
    }
});

app.get("/api/water", async (req, res) => {
    const { iin, start, end } = req.query;

    try {

        if ((start && isNaN(Date.parse(start))) || (end && isNaN(Date.parse(end)))) {
            return res.status(400).json({ error: "Некорректный формат даты" });
        }

        const startDate = start ? new Date(start).toISOString() : null;
        const endDate = end ? new Date(end).toISOString() : null;

        let query = "SELECT * FROM water_usage WHERE 1=1";
        const params = [];

        if (iin) {
            query += " AND iin = ?";
            params.push(iin);
        }
        if (startDate && endDate) {
            query += " AND start_time BETWEEN ? AND ?";
            params.push(startDate, endDate);
        } else if (startDate) {
            query += " AND start_time >= ?";
            params.push(startDate);
        } else if (endDate) {
            query += " AND start_time <= ?";
            params.push(endDate);
        }

        query += " ORDER BY start_time ASC";

        const rows = await db.all(query, params);

        res.json(rows);
    } catch (err) {
        console.error("Ошибка выполнения запроса:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});



// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));

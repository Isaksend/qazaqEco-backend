import sqlite3 from "sqlite3";
import { open } from "sqlite";

const connectDb = async () => {
    try {
        // Используем библиотеку `sqlite` для открытия базы данных с промисами
        const db = await open({
            filename: './water_usage.db',
            driver: sqlite3.Database,
        });

        console.log('✅ Подключение к базе данных water_usage выполнено.');

        // Создание таблицы water_usage, если её нет
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

        // Создание таблицы users, если её нет
        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT NOT NULL
            )
        `);

        console.log("✅ Таблицы проверены или успешно созданы!");
        return db;
    } catch (error) {
        console.error("❌ Ошибка подключения к базе данных:", error.message);
        throw error;
    }
};

export default connectDb;

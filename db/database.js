import sqlite3 from "sqlite3";
import { open } from "sqlite";

const connectDb = async () => {
    const db = await open({
        filename: "./water_usage.db",
        driver: sqlite3.Database,
    });

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

    console.log("✅ База данных успешно загружена!");
    return db;
};

export default connectDb;

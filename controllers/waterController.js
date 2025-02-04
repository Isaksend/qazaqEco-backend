import { bulkInsertWaterUsage } from "../models/waterModel.js";

const getWaterData = async (req, res) => {
    const { iin, start, end, task, minWater, maxWater } = req.query;

    try {
        if ((start && isNaN(Date.parse(start))) || (end && isNaN(Date.parse(end)))) {
            return res.status(400).json({ error: "Некорректный формат даты" });
        }

        const startDate = start ? new Date(start).toISOString() : null;
        const endDate = end ? new Date(end).toISOString() : null;

        let query = " SELECT * FROM water_usage WHERE 1=1 ";
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
        if (task) {
            query += " AND task = ?";
            params.push(task);
        }
        if (minWater) {
            query += " AND water_liters >= ?";
            params.push(minWater);
        }
        if (maxWater) {
            query += " AND water_liters <= ?";
            params.push(maxWater);
        }

        query += " ORDER BY start_time ASC";

        // Логирование
        console.log("SQL-запрос:", query, "Параметры:", params);

        const db = req.app.get("db");
        const rows = await db.all(query, params);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Данные не найдены." });
        }

        res.json(rows);
    } catch (error) {
        console.error("Ошибка получения данных:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};

const bulkInsertData = async (req, res) => {
    try {
        const db = req.app.get("db");
        const records = req.body;

        if (!Array.isArray(records) || records.length === 0) {
            return res.status(400).json({ error: "Некорректные данные. Ожидается массив записей." });
        }

        await bulkInsertWaterUsage(db, records);
        res.status(201).json({ message: "Данные успешно добавлены!" });
    } catch (error) {
        console.error("Ошибка при добавлении данных:", error);
        res.status(500).json({ error: "Ошибка сервера" });
    }
};


const getWaterStats = async (req, res) => {
    const { start, end } = req.query;

    try {
        const db = req.app.get("db");

        if ((start && isNaN(Date.parse(start))) || (end && isNaN(Date.parse(end)))) {
            return res.status(400).json({ error: "Некорректный формат даты." });
        }

        const startDate = start ? new Date(start).toISOString() : null;
        const endDate = end ? new Date(end).toISOString() : null;

        let query = `
            SELECT 
                SUM(water_liters) AS total_water, 
                AVG(water_liters) AS avg_water 
            FROM 
                water_usage 
            WHERE 1=1
        `;
        const params = [];

        if (startDate) {
            query += " AND start_time >= ?";
            params.push(startDate);
        }
        if (endDate) {
            query += " AND end_time <= ?";
            params.push(endDate);
        }

        console.log("SQL-запрос для статистики:", query, "Параметры:", params);

        const stats = await db.get(query, params);

        if (!stats.total_water) {
            return res.status(404).json({ message: "Данные за указанный период отсутствуют." });
        }

        res.json({
            total_water: stats.total_water.toFixed(2), // Суммарное потребление воды
            avg_water: stats.avg_water.toFixed(2),    // Среднее потребление на человека
        });
    } catch (error) {
        console.error("Ошибка получения статистики:", error);
        res.status(500).json({ error: "Ошибка сервера." });
    }
};



export { getWaterData, bulkInsertData, getWaterStats };

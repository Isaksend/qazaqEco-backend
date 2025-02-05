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
    const { start, end, groupBy, iin } = req.query;

    try {
        const db = req.app.get("db");

        if (!["daily", "weekly"].includes(groupBy)) {
            return res.status(400).json({ error: "Некорректное значение для параметра groupBy. Ожидается 'daily' или 'weekly'." });
        }

        if ((start && isNaN(Date.parse(start))) || (end && isNaN(Date.parse(end)))) {
            return res.status(400).json({ error: "Некорректный формат даты." });
        }

        const startDate = start ? new Date(start).toISOString() : null;
        const endDate = end ? new Date(end).toISOString() : null;

        let query = "";
        const params = [];

        if (groupBy === "daily") {
            query = `
                SELECT 
                    DATE(start_time) AS day, 
                    SUM(water_liters) AS total_water, 
                    AVG(water_liters) AS avg_water 
                FROM 
                    water_usage 
                WHERE 1=1
            `;
        } else if (groupBy === "weekly") {
            query = `
                SELECT 
                    STRFTIME('%Y-%W', start_time) AS week, 
                    SUM(water_liters) AS total_water, 
                    AVG(water_liters) AS avg_water 
                FROM 
                    water_usage 
                WHERE 1=1
            `;
        }

        if (iin) {
            query += " AND iin = ?";
            params.push(iin);
        }

        if (startDate) {
            query += " AND start_time >= ?";
            params.push(startDate);
        }
        if (endDate) {
            query += " AND end_time <= ?";
            params.push(endDate);
        }

        // Добавляем GROUP BY и ORDER BY после условий WHERE
        if (groupBy === "daily") {
            query += " GROUP BY day ORDER BY day ASC";
        } else if (groupBy === "weekly") {
            query += " GROUP BY week ORDER BY week ASC";
        }

        console.log("SQL-запрос для статистики:", query, "Параметры:", params);

        const stats = await db.all(query, params);

        if (stats.length === 0) {
            return res.status(404).json({ message: "Данные за указанный период отсутствуют." });
        }

        res.json(stats.map(row => ({
            ...(groupBy === "daily" ? { day: row.day } : { week: row.week }),
            total_water: row.total_water.toFixed(2),
            avg_water: row.avg_water.toFixed(2),
        })));
    } catch (error) {
        console.error("Ошибка получения статистики:", error);
        res.status(500).json({ error: "Ошибка сервера." });
    }
};

const calculateWaterCost = (totalLiters, familySize) => {
    // Перевод литров в кубометры
    const totalWaterCubicMeters = totalLiters / 1000;

    const tier1Limit = familySize * 3; // До 3 кубов на человека
    const tier2Limit = familySize * 5; // От 3 до 5 кубов на человека
    const tier3Limit = familySize * 10; // От 5 до 10 кубов на человека

    const tier1Rate = 100.66; // Тариф для уровня 1
    const tier2Rate = 120.79; // Тариф для уровня 2
    const tier3Rate = 150.99; // Тариф для уровня 3
    const tier4Rate = 201.31; // Тариф для уровня 4

    let remainingWater = totalWaterCubicMeters;
    let totalCost = 0;

    // Уровень 1: До 3 кубов на человека
    if (remainingWater > 0) {
        const tier1Usage = Math.min(remainingWater, tier1Limit);
        totalCost += tier1Usage * tier1Rate;
        remainingWater -= tier1Usage;
    }

    // Уровень 2: От 3 до 5 кубов на человека
    if (remainingWater > 0) {
        const tier2Usage = Math.min(remainingWater, tier2Limit - tier1Limit);
        totalCost += tier2Usage * tier2Rate;
        remainingWater -= tier2Usage;
    }

    // Уровень 3: От 5 до 10 кубов на человека
    if (remainingWater > 0) {
        const tier3Usage = Math.min(remainingWater, tier3Limit - tier2Limit);
        totalCost += tier3Usage * tier3Rate;
        remainingWater -= tier3Usage;
    }

    // Уровень 4: Свыше 10 кубов на человека
    if (remainingWater > 0) {
        totalCost += remainingWater * tier4Rate;
    }

    return { totalWaterCubicMeters, totalCost: totalCost.toFixed(2) };
};

const getWaterCost = async (req, res) => {
    const { iin, start, end } = req.query;

    try {
        const db = req.app.get("db");
        const query = `
            SELECT SUM(water_liters) AS total_water, family_size
            FROM water_usage
            WHERE iin = ? AND start_time >= ? AND end_time <= ?
        `;
        const params = [iin, start, end];
        const result = await db.get(query, params);

        if (!result || !result.total_water) {
            return res.status(404).json({ message: "Данные не найдены." });
        }

        const { total_water, family_size } = result;

        // Расчет стоимости воды
        const { totalWaterCubicMeters, totalCost } = calculateWaterCost(total_water, family_size);

        res.json({
            iin,
            start,
            end,
            totalWaterCubicMeters: totalWaterCubicMeters.toFixed(6), // Округлить до 2 знаков
            totalCost: totalCost,
        });
    } catch (error) {
        console.error("Ошибка расчета стоимости воды:", error);
        res.status(500).json({ error: "Ошибка сервера." });
    }
};


export { getWaterData, bulkInsertData, getWaterStats, getWaterCost };

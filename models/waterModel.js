
const bulkInsertWaterUsage = async (db, records) => {
    const insertQuery = `
    INSERT INTO water_usage (iin, family_size, task, water_liters, start_time, end_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
    await db.run("BEGIN TRANSACTION");
    for (const record of records) {
        const { iin, family_size, task, water_liters, start_time, end_time } = record;
        await db.run(insertQuery, [iin, family_size, task, water_liters, start_time, end_time]);
    }
    await db.run("COMMIT");
};

export { bulkInsertWaterUsage };

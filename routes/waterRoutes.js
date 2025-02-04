import express from "express";
import { getWaterData, bulkInsertData, getWaterStats  } from "../controllers/waterController.js";

const router = express.Router();

router.get("/api/water", getWaterData);
router.post("/api/water/bulk", bulkInsertData);
router.get("/api/water/stats", getWaterStats);

export default router;

import express from "express";
import { getWaterData, bulkInsertData, getWaterStats, getWaterCost} from "../controllers/waterController.js";

const router = express.Router();

router.get("/", getWaterData);
router.post("/bulk", bulkInsertData);
router.get("/stats", getWaterStats);
router.get("/cost", getWaterCost);
export default router;

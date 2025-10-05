// routes/orderRoutes.js
import express from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
} from "../controllers/orderController.js";

const router = express.Router();

router.post("/api/orders", createOrder);
router.get("/api/orders", getOrders);
router.get("/api/orders/stats", getOrderStats);
router.get("/api/orders/:id", getOrderById);
router.put("/api/orders/:id", updateOrder);
router.delete("/api/orders/:id", deleteOrder);

export default router;

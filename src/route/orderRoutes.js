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

router.post("/orders/create-order", createOrder);
router.get("/orders/get-orders", getOrders);
router.get("/orders/get-orders/stats", getOrderStats);
router.get("/orders/get-order/:id", getOrderById);
router.put("/orders/update-order/:id", updateOrder);
router.delete("/orders/delete-order/:id", deleteOrder);

export default router;
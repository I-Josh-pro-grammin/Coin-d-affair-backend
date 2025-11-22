// src/routes/adminRoutes.js
import express from "express";
import protectedRoutes from "../middlewares/authMiddleware.js"; // must ensure it supports admin
import adminLogger from "../middlewares/adminLogger.js";
import * as Admin from "../controllers/AdminController.js";

const router = express.Router();

// All routes below require admin role
router.use(protectedRoutes("admin"));

// dashboard
router.get("/admin/stats", adminLogger("view_admin_stats"), Admin.getAdminStats);

// businesses
router.get("/admin/businesses", adminLogger("list_businesses"), Admin.getAllBusinesses);
router.get("/admin/business/:userId", adminLogger("get_business"), Admin.getBusinessProfile);
router.delete("/admin/business/:userId", adminLogger("delete_business"), Admin.deleteBusiness);
router.post("/admin/business/:businessId/suspend", adminLogger("suspend_business"), Admin.suspendBusiness);
router.post("/admin/business/:businessId/activate", adminLogger("activate_business"), Admin.activateBusiness);

// users
router.get("/admin/users", adminLogger("list_users"), Admin.getAllUsers);
router.get("/admin/user/:userId", adminLogger("get_user"), Admin.getUserDetails);
router.post("/admin/user/:userId/ban", adminLogger("ban_user"), Admin.banUser);
router.post("/admin/user/:userId/unban", adminLogger("unban_user"), Admin.unbanUser);

// listings
router.get("/admin/listings", adminLogger("list_listings"), Admin.getAllListings);
router.post("/admin/listing/:listingId/status", adminLogger("update_listing_status"), Admin.updateListingStatus);
router.delete("/admin/listing/:listingId", adminLogger("delete_listing"), Admin.deleteListing);

// orders
router.get("/admin/orders", adminLogger("list_orders"), Admin.getAllOrders);
router.get("/admin/order/:orderId", adminLogger("get_order"), Admin.getOrderDetails);
router.post("/admin/order/:orderId/status", adminLogger("update_order_status"), Admin.updateOrderStatus);

// subscriptions
router.get("/admin/subscriptions/stats", adminLogger("get_subscription_stats"), Admin.getSubscriptionStats);
router.get("/admin/subscriptions", adminLogger("list_subscriptions"), Admin.getSubscriptionsList);

// admin logs + notifications
router.get("/admin/logs", adminLogger("view_logs"), Admin.listAdminLogs);
router.post("/admin/notifications", adminLogger("create_notification"), Admin.createNotification);
router.get("/admin/notifications", adminLogger("list_notifications"), Admin.listNotifications);
router.post("/admin/notification/:notificationId/read", adminLogger("read_notification"), Admin.markNotificationRead);

export default router;
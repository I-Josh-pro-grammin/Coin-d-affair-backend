// src/routes/adminRoutes.js
import express from "express";
import protectedRoutes from "../middlewares/authMiddleware.js"; // must ensure it supports admin
import adminLogger from "../middlewares/adminLogger.js";
import * as Admin from "../controllers/AdminController.js";

const router = express.Router();
/**
 * @swagger
 * tags:
 *   - name: Admin
 *     description: All admin routes
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin stats
 *
 * /admin/businesses:
 *   get:
 *     summary: List all businesses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of businesses
 *
 * /admin/business/{userId}:
 *   get:
 *     summary: Get a business profile
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business details
 *
 *   delete:
 *     summary: Delete a business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business deleted
 *
 * /admin/business/{businessId}/suspend:
 *   post:
 *     summary: Suspend a business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Business suspended
 *
 * /admin/business/{businessId}/activate:
 *   post:
 *     summary: Activate a business
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Business activated
 *
 * /admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of users
 *
 * /admin/user/{userId}:
 *   get:
 *     summary: Get user details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *
 * /admin/user/{userId}/ban:
 *   post:
 *     summary: Ban a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User banned
 *
 * /admin/user/{userId}/unban:
 *   post:
 *     summary: Unban a user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User unbanned
 *
 * /admin/listings:
 *   get:
 *     summary: List all listings
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of listings
 *
 * /admin/listing/{listingId}/status:
 *   post:
 *     summary: Update listing status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject, hide, unhide]
 *             required: [action]
 *           example:
 *             action: "approve"
 *     responses:
 *       200:
 *         description: Listing updated
 *
 * /admin/listing/{listingId}:
 *   delete:
 *     summary: Delete a listing
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listingId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Listing deleted
 *
 * /admin/orders:
 *   get:
 *     summary: List all orders
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of orders
 *
 * /admin/order/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Order details
 *
 * /admin/order/{orderId}/status:
 *   post:
 *     summary: Update order status
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, shipped, delivered, cancelled]
 *             required: [status]
 *           example:
 *             status: "shipped"
 *     responses:
 *       200:
 *         description: Order status updated
 *
 * /admin/subscriptions:
 *   get:
 *     summary: List all subscriptions
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription list
 *
 * /admin/subscriptions/stats:
 *   get:
 *     summary: Get subscription statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription stats
 *
 * /admin/logs:
 *   get:
 *     summary: List admin logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logs list
 *
 * /admin/notifications:
 *   get:
 *     summary: List admin notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications
 *
 *   post:
 *     summary: Create notification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               body: { type: string }
 *               target_user_id: { type: string }
 *               data: { type: object }
 *           example:
 *             title: "System Update"
 *             body: "Your order has been approved."
 *             target_user_id: "98df1b7e-12aa-4c78"
 *             data:
 *               type: "order"
 *               orderId: "12345"
 *     responses:
 *       201:
 *         description: Notification created
 *
 * /admin/notification/{notificationId}/read:
 *   post:
 *     summary: Mark a notification as read
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
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
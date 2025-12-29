import pool from "../config/database.js";
const paginate = (reqQuery = {}, defaultLimit = 20, maxLimit = 200) => {
  const page = Math.max(parseInt(reqQuery.page || 1, 10), 1);
  const limit = Math.min(Math.max(parseInt(reqQuery.limit || defaultLimit, 10), 1), maxLimit);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

// ------------------- 1. DASHBOARD STATS -------------------
const getAdminStats = async (req, res) => {
  try {
    const [
      usersQ,
      businessesQ,
      listingsQ,
      ordersQ,
      revenueQ,
      todayUsersQ,
      todayOrdersQ,
      monthlySalesQ,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_users FROM users`),
      pool.query(`SELECT COUNT(*)::int AS total_businesses FROM businesses`),
      pool.query(`SELECT COUNT(*)::int AS total_listings FROM listings`),
      pool.query(`SELECT COUNT(*)::int AS total_orders FROM orders`),
      pool.query(`SELECT COALESCE(SUM(amount),0)::numeric AS total_revenue FROM payments WHERE status IN ('success','succeeded','completed')`),
      pool.query(`SELECT COUNT(*)::int AS today_signups FROM users WHERE DATE(created_at) = CURRENT_DATE`),
      pool.query(`SELECT COUNT(*)::int AS today_orders FROM orders WHERE DATE(created_at) = CURRENT_DATE`),
      pool.query(`
        SELECT to_char(month, 'YYYY-MM') AS month, COALESCE(total_sales,0)::numeric AS total_sales
        FROM (
          SELECT DATE_TRUNC('month', created_at) AS month, SUM(total_amount) AS total_sales
          FROM orders WHERE status = 'delivered'
          GROUP BY month
        ) m
        ORDER BY month
      `),
    ]);

    return res.status(200).json({
      stats: {
        totalUsers: +usersQ.rows[0].total_users,
        totalBusinesses: +businessesQ.rows[0].total_businesses,
        totalListings: +listingsQ.rows[0].total_listings,
        totalOrders: +ordersQ.rows[0].total_orders,
        totalRevenue: revenueQ.rows[0].total_revenue,
        todaySignups: +todayUsersQ.rows[0].today_signups,
        todayOrders: +todayOrdersQ.rows[0].today_orders,
        monthlySales: monthlySalesQ.rows,
      },
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- 2. BUSINESSES -------------------
const getAllBusinesses = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 20);
    // allow search by name or owner email
    const { q } = req.query;
    const params = [];
    let where = "WHERE 1=1";
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (LOWER(b.business_name) LIKE $${params.length - 1} OR LOWER(u.email) LIKE $${params.length})`;
    }

    params.push(limit, offset);
    const query = `
      SELECT
        b.business_id, b.business_name, b.subscription_plan, b.is_paid, b.total_orders, b.rating,
        u.user_id AS owner_user_id, u.full_name AS owner_name, u.email AS owner_email, b.created_at
      FROM businesses b
      JOIN users u ON b.user_id = u.user_id
      ${where}
      ORDER BY b.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await pool.query(query, params);

    // count for pagination
    let countRes;
    if (!q) {
      countRes = await pool.query(`SELECT COUNT(*)::int as count FROM businesses`);
    } else {
      // simple count with same where
      const countParams = [`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`];
      countRes = await pool.query(`SELECT COUNT(*)::int as count FROM businesses b JOIN users u ON b.user_id = u.user_id WHERE LOWER(b.business_name) LIKE $1 OR LOWER(u.email) LIKE $2`, countParams);
    }

    return res.status(200).json({
      businesses: result.rows,
      pagination: { page, limit, total: countRes.rows[0].count },
    });
  } catch (err) {
    console.error("getAllBusinesses error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getBusinessProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.userId;
    const q = await pool.query(
      `SELECT business_id, business_name, subscription_plan, is_paid, created_at FROM businesses WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    if (q.rowCount === 0) return res.status(404).json({ message: "Business not found" });
    return res.status(200).json({ business: q.rows[0] });
  } catch (err) {
    console.error("getBusinessProfile error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteBusiness = async (req, res) => {
  try {
    const { userId } = req.params;
    // ensure exist
    const bq = await pool.query(`SELECT business_id FROM businesses WHERE user_id = $1 LIMIT 1`, [userId]);
    if (bq.rowCount === 0) return res.status(404).json({ message: "Business not found" });
    const businessId = bq.rows[0].business_id;

    // safe delete: remove media, listings, related data
    await pool.query(`DELETE FROM listing_media WHERE listing_id IN (SELECT listings_id FROM listings WHERE business_id = $1)`, [businessId]);
    await pool.query(`DELETE FROM listings WHERE business_id = $1`, [businessId]);
    // delete payments where recipient is business (optional)
    await pool.query(`DELETE FROM payments WHERE recipient_type = 'business' AND recipient_id = $1`, [businessId]);
    // finally delete business
    await pool.query(`DELETE FROM businesses WHERE business_id = $1`, [businessId]);

    // log admin action (if middleware attached helper)
    if (req.adminLog) await req.adminLog("delete_business", { resourceType: "business", resourceId: businessId });

    return res.status(200).json({ message: "Business deleted successfully" });
  } catch (err) {
    console.error("deleteBusiness error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const suspendBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    await pool.query(`UPDATE businesses SET is_paid = false WHERE business_id = $1`, [businessId]);
    if (req.adminLog) await req.adminLog("suspend_business", { resourceType: "business", resourceId: businessId });
    return res.status(200).json({ message: "Business suspended" });
  } catch (err) {
    console.error("suspendBusiness error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const activateBusiness = async (req, res) => {
  try {
    const { businessId } = req.params;
    await pool.query(`UPDATE businesses SET is_paid = true WHERE business_id = $1`, [businessId]);
    if (req.adminLog) await req.adminLog("activate_business", { resourceType: "business", resourceId: businessId });
    return res.status(200).json({ message: "Business activated" });
  } catch (err) {
    console.error("activateBusiness error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- 3. USERS -------------------
const getAllUsers = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 20);
    const q = req.query.q;
    const params = [];
    let where = "WHERE 1=1";
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (LOWER(email) LIKE $${params.length - 1} OR LOWER(full_name) LIKE $${params.length})`;
    }
    params.push(limit, offset);
    const users = await pool.query(`
      SELECT user_id, email, full_name, is_verified, account_type, is_active, created_at
      FROM users
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    // count
    let countRes;
    if (!q) countRes = await pool.query(`SELECT COUNT(*)::int as count FROM users`);
    else countRes = await pool.query(`SELECT COUNT(*)::int as count FROM users WHERE LOWER(email) LIKE $1 OR LOWER(full_name) LIKE $2`, [`%${q.toLowerCase()}%`, `%${q.toLowerCase()}%`]);

    return res.status(200).json({ users: users.rows, pagination: { page, limit, total: countRes.rows[0].count } });
  } catch (err) {
    console.error("getAllUsers error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await pool.query(`SELECT user_id, email, full_name, phone, account_type, is_active, created_at FROM users WHERE user_id = $1`, [userId]);
    if (user.rowCount === 0) return res.status(404).json({ message: "User not found" });

    // fetch orders and listings summary
    const [orders, listings] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int as total_orders, COALESCE(SUM(total_amount)::numeric,0) as total_spent FROM orders WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*)::int as total_listings FROM listings WHERE seller_id = $1`, [userId]),
    ]);

    return res.status(200).json({ user: user.rows[0], stats: { orders: orders.rows[0], listings: listings.rows[0] } });
  } catch (err) {
    console.error("getUserDetails error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query(`UPDATE users SET is_active = false WHERE user_id = $1`, [userId]);
    if (req.adminLog) await req.adminLog("ban_user", { resourceType: "user", resourceId: userId });
    return res.status(200).json({ message: "User banned" });
  } catch (err) {
    console.error("banUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await pool.query(`UPDATE users SET is_active = true WHERE user_id = $1`, [userId]);
    if (req.adminLog) await req.adminLog("unban_user", { resourceType: "user", resourceId: userId });
    return res.status(200).json({ message: "User unbanned" });
  } catch (err) {
    console.error("unbanUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await pool.query(`SELECT user_id FROM users WHERE user_id = $1`, [userId]);
    if (user.rowCount === 0) return res.status(404).json({ message: "User not found" });

    // Delete related data first (Manual Cascade or rely on DB - safer to do manual if constraints aren't cascade)
    // Deleting businesses owned by user
    const userBusinesses = await pool.query(`SELECT business_id FROM businesses WHERE user_id = $1`, [userId]);
    for (const business of userBusinesses.rows) {
      // This logic duplicates deleteBusiness roughly
      await pool.query(`DELETE FROM listing_media WHERE listing_id IN (SELECT listings_id FROM listings WHERE business_id = $1)`, [business.business_id]);
      await pool.query(`DELETE FROM listings WHERE business_id = $1`, [business.business_id]);
      await pool.query(`DELETE FROM businesses WHERE business_id = $1`, [business.business_id]);
    }

    // Delete user
    await pool.query(`DELETE FROM users WHERE user_id = $1`, [userId]);

    if (req.adminLog) await req.adminLog("delete_user", { resourceType: "user", resourceId: userId });
    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- 4. LISTINGS MANAGEMENT -------------------
const getAllListings = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 30);
    const q = req.query.q;
    const params = [];
    let where = "WHERE 1=1";
    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where += ` AND (LOWER(l.title) LIKE $${params.length} OR LOWER(l.description) LIKE $${params.length})`;
    }
    // add pagination params
    params.push(limit, offset);
    const query = `
      SELECT l.*, b.business_name, u.email AS seller_email,
        COALESCE(json_agg(jsonb_build_object('id', lm.listing_media_id,'type',lm.media_type,'url',lm.url) ORDER BY lm.sort_order) FILTER (WHERE lm.listing_media_id IS NOT NULL), '[]') as media
      FROM listings l
      LEFT JOIN businesses b ON l.business_id = b.business_id
      LEFT JOIN users u ON l.seller_id = u.user_id
      LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id
      ${where}
      GROUP BY l.listings_id, b.business_name, u.email
      ORDER BY l.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;
    const result = await pool.query(query, params);

    // count
    let countRes;
    if (!q) countRes = await pool.query(`SELECT COUNT(*)::int as count FROM listings`);
    else countRes = await pool.query(`SELECT COUNT(*)::int as count FROM listings WHERE LOWER(title) LIKE $1 OR LOWER(description) LIKE $1`, [`%${q.toLowerCase()}%`]);

    return res.status(200).json({ listings: result.rows, pagination: { page, limit, total: countRes.rows[0].count } });
  } catch (err) {
    console.error("getAllListings error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateListingStatus = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { action } = req.body;
    console.log("updateListingStatus called with:", { listingId, action });
    let statusSQL;
    switch ((action || "").toLowerCase()) {
      case "approve":
        statusSQL = `UPDATE listings SET is_approved = true WHERE listings_id = $1`;
        break;
      case "reject":
        statusSQL = `UPDATE listings SET is_approved = false WHERE listings_id = $1`;
        break;
      case "hide":
        statusSQL = `UPDATE listings SET is_visible = false WHERE listings_id = $1`;
        break;
      case "unhide":
        statusSQL = `UPDATE listings SET is_visible = true WHERE listings_id = $1`;
        break;
      default:
        return res.status(400).json({ message: "Invalid action" });
    }
    await pool.query(statusSQL, [listingId]);

    try {
      if (req.adminLog) await req.adminLog("update_listing_status", { resourceType: "listing", resourceId: listingId, meta: { action } });
    } catch (logErr) {
      console.error("Admin log failed:", logErr);
    }

    return res.status(200).json({ message: `Listing ${action}d` });
  } catch (err) {
    console.error("updateListingStatus error:", err);
    return res.status(500).json({ message: err.message || "Internal server error" });
  }
};

const deleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    // delete media then listing
    await pool.query(`DELETE FROM listing_media WHERE listing_id = $1`, [listingId]);
    await pool.query(`DELETE FROM listings WHERE listings_id = $1`, [listingId]);
    if (req.adminLog) await req.adminLog("delete_listing", { resourceType: "listing", resourceId: listingId });
    return res.status(200).json({ message: "Listing deleted" });
  } catch (err) {
    console.error("deleteListing error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- 5. ORDERS -------------------
const getAllOrders = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 30);
    const status = req.query.status;
    const params = [];
    let where = "WHERE 1=1";
    if (status) {
      params.push(status);
      where += ` AND o.status = $${params.length}`;
    }
    params.push(limit, offset);
    const q = `
      SELECT o.*, u.full_name as buyer_name, s.full_name as seller_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN users s ON o.seller_id = s.user_id
      ${where}
      ${req.query.q ? `AND (o.order_id::text LIKE $${params.length + 1} OR LOWER(u.full_name) LIKE $${params.length + 1} OR LOWER(u.email) LIKE $${params.length + 1})` : ''}
      ORDER BY o.created_at DESC
      LIMIT $${params.length - (req.query.q ? 0 : 1)} OFFSET $${params.length + (req.query.q ? 1 : 0)}
    `;
    if (req.query.q) params.push(`%${req.query.q.toLowerCase()}%`);
    const result = await pool.query(q, params);
    const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM orders ${status ? "WHERE status = $1" : ""}`, status ? [status] : []);
    return res.status(200).json({ orders: result.rows, pagination: { page, limit, total: countRes.rows[0].count } });
  } catch (err) {
    console.error("getAllOrders error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const q = `
      SELECT o.*, u.full_name as buyer_name, s.full_name as seller_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN users s ON o.seller_id = s.user_id
      WHERE o.order_id = $1
      LIMIT 1
    `;
    const order = await pool.query(q, [orderId]);
    if (order.rowCount === 0) return res.status(404).json({ message: "Order not found" });

    const items = await pool.query(`
      SELECT oi.*, l.title as product_title, lm.url as product_image
      FROM order_items oi
      LEFT JOIN listings l ON oi.listing_id = l.listings_id
      LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id AND lm.media_type = 'image'
      WHERE oi.order_id = $1
    `, [orderId]);

    return res.status(200).json({ order: order.rows[0], items: items.rows });
  } catch (err) {
    console.error("getOrderDetails error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // 'pending','shipped','delivered','cancelled', etc.
    if (!status) return res.status(400).json({ message: "Status is required" });

    await pool.query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE order_id = $2`, [status, orderId]);
    if (req.adminLog) await req.adminLog("update_order_status", { resourceType: "order", resourceId: orderId, meta: { status } });

    return res.status(200).json({ message: "Order status updated" });
  } catch (err) {
    console.error("updateOrderStatus error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- 6. SUBSCRIPTION DASHBOARD -------------------
const getSubscriptionStats = async (req, res) => {
  try {
    const [plans, activeCount, expiredCount] = await Promise.all([
      pool.query(`SELECT subscription_plan, COUNT(*)::int as count FROM businesses GROUP BY subscription_plan`),
      pool.query(`SELECT COUNT(*)::int as active_subscriptions FROM businesses WHERE subscription_period_end > NOW()`),
      pool.query(`SELECT COUNT(*)::int as expired_subscriptions FROM businesses WHERE subscription_period_end <= NOW()`),
    ]);
    return res.status(200).json({ plans: plans.rows, active: activeCount.rows[0].active_subscriptions, expired: expiredCount.rows[0].expired_subscriptions });
  } catch (err) {
    console.error("getSubscriptionStats error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getSubscriptionsList = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 20);
    const result = await pool.query(`SELECT business_id, business_name, subscription_plan, subscription_start, subscription_period_end FROM businesses ORDER BY subscription_period_end DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.status(200).json({ subscriptions: result.rows, pagination: { page, limit } });
  } catch (err) {
    console.error("getSubscriptionsList error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- 7. ADMIN LOGS & NOTIFICATIONS -------------------
const listAdminLogs = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 30);
    const result = await pool.query(`SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.status(200).json({ logs: result.rows, pagination: { page, limit } });
  } catch (err) {
    console.error("listAdminLogs error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Notifications CRUD
const createNotification = async (req, res) => {
  try {
    const { title, body, target_user_id, data } = req.body;
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }
    await pool.query(`INSERT INTO admin_notifications (title, body, target_user_id, data) VALUES ($1,$2,$3,$4)`, [title, body || "", target_user_id || null, data ? JSON.stringify(data) : {}]);
    return res.status(201).json({ message: "Notification created" });
  } catch (err) {
    console.error("createNotification error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const listNotifications = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query, 30);
    const result = await pool.query(`SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]);
    return res.status(200).json({ notifications: result.rows, pagination: { page, limit } });
  } catch (err) {
    console.error("listNotifications error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await pool.query(`UPDATE admin_notifications SET is_read = true WHERE notification_id = $1`, [notificationId]);
    return res.status(200).json({ message: "Notification marked read" });
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- Export -------------------
export {
  getAdminStats,
  getAllBusinesses,
  getBusinessProfile,
  deleteBusiness,
  suspendBusiness,
  activateBusiness,
  getAllUsers,
  getUserDetails,
  banUser,
  unbanUser,
  deleteUser,
  getAllListings,
  updateListingStatus,
  deleteListing,
  getAllOrders,
  getOrderDetails,
  updateOrderStatus,
  getSubscriptionStats,
  getSubscriptionsList,
  listAdminLogs,
  createNotification,
  listNotifications,
  markNotificationRead,
};

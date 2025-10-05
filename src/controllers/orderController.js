import pool from "../config/database.js";

const validateOrderData = (data) => {
  const errors = [];

  if (!data.totalAmount || data.totalAmount <= 0) {
    errors.push("totalAmount is required and must be greater than 0");
  }

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push("items must be a non-empty array");
  } else {
    data.items.forEach((item, index) => {
      if (!item.listingId) errors.push(`Item ${index + 1}: listingId is required`);
      if (!item.quantity || item.quantity <= 0) errors.push(`Item ${index + 1}: quantity must be greater than 0`);
      if (!item.unit_price || item.unit_price <= 0) errors.push(`Item ${index + 1}: unit_price must be greater than 0`);
    });
  }

  return errors;
};

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      userId,
      sellerId,
      totalAmount,
      currency = "USD",
      status = "pending",
      isGuest = false,
      shippingAddressId,
      billingAddressId,
      items,
    } = req.body;


    const validationErrors = validateOrderData({ totalAmount, items });
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: validationErrors
      });
    }

    await client.query("BEGIN");

    const orderQuery = `
      INSERT INTO orders 
      (user_id, seller_id, total_amount, currency, status, shipping_address_id, billing_address_id, is_guest)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;

    const { rows: orderRows } = await client.query(orderQuery, [
      userId || null,
      sellerId || null,
      totalAmount,
      currency,
      status,
      shippingAddressId || null,
      billingAddressId || null,
      isGuest,
    ]);

    const order = orderRows[0];

    const orderItemsQuery = `
      INSERT INTO order_items (order_id, listing_id, sku_item_id, quantity, unit_price, total_price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const orderItems = [];
    for (const item of items) {
      const total_price = item.quantity * item.unit_price;
      const { rows } = await client.query(orderItemsQuery, [
        order.order_id,
        item.listingId,
        item.sku_item_id || null,
        item.quantity,
        item.unit_price,
        item.total_price,
        total_price
      ]);
      orderItems.push(rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({ order, orderItems });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export const getOrders = async (req, res) => {
  try {
    const { userId, sellerId, status } = req.query;
    let query = `
      SELECT o.*, u.username AS buyer, s.username AS seller
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN users s ON o.seller_id = s.user_id
    `;
    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push("o.user_id = $" + (params.length + 1));
      params.push(userId);
    }

    if (sellerId) {
      conditions.push("o.seller_id = $" + (params.length + 1));
      params.push(sellerId);
    }

    if (status) {
      conditions.push("o.status = $" + (params.length + 1));
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY o.created_at DESC";

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const orderQuery = `
      SELECT o.*, u.username AS buyer, s.username AS seller
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN users s ON o.seller_id = s.user_id
      WHERE o.order_id = $1
    `;
    const { rows: orderRows } = await pool.query(orderQuery, [id]);
    if (orderRows.length === 0) return res.status(404).json({ error: "Order not found" });

    const itemsQuery = `
      SELECT oi.*, l.title as listing_title
      FROM order_items oi
      LEFT JOIN listings l ON oi.listing_id = l.listing_id
      WHERE oi.order_id = $1
    `;
    const { rows: items } = await pool.query(itemsQuery, [id]);

    res.json({ ...orderRows[0], items });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { totalAmount, shippingAddressId, billingAddressId, status } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const query = `
      UPDATE orders
      SET total_amount = COALESCE($1, total_amount),
          shipping_address_id = COALESCE($2, shipping_address_id),
          billing_address_id = COALESCE($3, billing_address_id),
          status = COALESCE($4, status),
          updated_at = NOW()
      WHERE order_id = $5
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      totalAmount || null,
      shippingAddressId || null,
      billingAddressId || null,
      status || null,
      id,
    ]);

    if (rows.length === 0) return res.status(404).json({ error: "Order not found" });

    res.json(rows[0]);
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    const { rowCount } = await pool.query("DELETE FROM orders WHERE order_id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Order not found" });

    res.json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getOrderStats = async (req, res) => {
  try {
    const { userId, sellerId } = req.query;
    let whereClause = "";
    const params = [];

    if (userId) {
      whereClause = "WHERE user_id = $1";
      params.push(userId);
    } else if (sellerId) {
      whereClause = "WHERE seller_id = $1";
      params.push(sellerId);
    }

    const statsQuery = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_order_value
      FROM orders 
      ${whereClause}
    `;

    const { rows } = await pool.query(statsQuery, params);
    res.json(rows[0]);
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

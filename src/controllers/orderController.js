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
      if (!item.listingId)
        errors.push(`Item ${index + 1}: listingId is required`);
      if (!item.quantity || item.quantity <= 0)
        errors.push(`Item ${index + 1}: quantity must be greater than 0`);
      if (!item.unit_price || item.unit_price <= 0)
        errors.push(`Item ${index + 1}: unit_price must be greater than 0`);
    });
  }

  return errors;
};

export const createOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      userId,
      totalAmount,
      currency = "USD",
      shippingAddressId,
      items,
    } = req.body;
    const isGuest = !userId;

    //validation

    if (!totalAmount || Number(totalAmount) <= 0) {
      return res
        .status(400)
        .json({ error: "The total amount should not be less than 0" });
    }

    if (!shippingAddressId) {
      return res.status(400).json({ error: "No shipping address" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items are required" });
    }

    // validate items

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.listingId)
        return res
          .status(400)
          .json({ error: `The item ${i + 1} have no listing Id` });
      if (!item.quantity || item.quantity <= 0)
        return res
          .status(400)
          .json({ error: `The item ${i + 1} have no quantity` });
      if (!item.unit_price || item.unit_price <= 0)
        return res
          .status(400)
          .json({ error: `The item ${i + 1} have no unit price` });
    }

    const shippingAddressCheck = await client.query(
      `SELECT address_id from addresses where address_id = $1`,
      [shippingAddressId]
    );
    if (shippingAddressCheck.rows.length === 0){
      return res
        .status(400)
        .json({ message: "Shipping address not found" })
    }
      await client.query("BEGIN");
    const insertOrderQuery = await client.query(
      `INSERT INTO orders (user_id,total_amount,currency,status,shipping_address_id,is_guest) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [
        userId || null,
        totalAmount,
        currency,
        "pending",
        shippingAddressId,
        isGuest,
      ]
    );

    const orderQueryResults = insertOrderQuery.rows[0];
    const insertOrderItemQuery = `INSERT INTO order_items (order_id,listing_id,quantity,unit_price,total_price) VALUES($1,$2,$3,$4,$5) RETURNING *`;
    const businessMapping = {};
    for (const item of items) {
      const listingQuery = `SELECT listings_id,title,business_id,price,stock from listings where listings_id = $1 FOR UPDATE`;
      const listingQueryResult = (await client).query(listingQuery, [
        item.listingId,
      ]);

      if (listingQueryResult.rows.length === 0) {
        (await client).query("ROLLBACK");
        return res.status(400).json({ error: "No such product" });
      }

      const listing = listingQueryResult.rows[0];
      if (listing.stock < item.quantity) {
        (await client).query("ROLLBACK");
        return res.status(400).json({ error: "Insufficient products" });
      }

      const realProductPrice = Number(listing.price);
      if (Math.abs(realProductPrice - Number(item.unit_price)) > 0.01) {
        (await client).query("ROLLBACK");
        return res.status(400).json({ error: "Price mismatch" });
      }

      // insert order Items
      const totalPrice = realProductPrice * item.quantity;
      const orderItems = await client.query(insertOrderItemQuery, [
        orderQueryResults.order_id,
        item.listingId,
        item.quantity,
        item.unit_price,
        totalPrice,
      ]);

      // deduct some products
      (await client).query(
        `UPDATE listings SET stock = stock - $1 WHERE listings_id = $2`,
        [item.quantity, item.listingId]
      );

      // bussinessMapping
      const businessId = listing.business_id

      if(!businessMapping[businessId]){
        businessMapping[businessId] = {totalAmount: 0, items: []}
      }

      businessMapping[businessId].items.push({
        orderItemId: orderItems.rows[0].order_item_id,
        listingId: listing.listings_id,
        quantity: item.quantity,
        unitPrice: realProductPrice,
        totalPrice: totalPrice,
        listingTitle: listing.title
      })
      businessMapping[businessId].totalAmount += totalPrice
    }

    await client.query("COMMIT")
    return res.status(201).json({
      message: "Order created successfully. Proceed to payment",
      orderId: orderQueryResults.order_id,
      orderQueryResults,
      businessMapping
    })
  } catch (error) {
    await client.query("ROLLBACK")
    res.status(500).json({message: "Internal server error"})
  }finally{
    client.release()
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
    if (orderRows.length === 0)
      return res.status(404).json({ error: "Order not found" });

    const itemsQuery = `
      SELECT oi.*, l.title as listing_title
      FROM order_items oi
      LEFT JOIN listings l ON oi.listing_id = l.listings_id
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
    const { totalAmount, shippingAddressId, billingAddressId, status } =
      req.body;

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

    if (rows.length === 0)
      return res.status(404).json({ error: "Order not found" });

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

    const { rowCount } = await pool.query(
      "DELETE FROM orders WHERE order_id = $1",
      [id]
    );
    if (rowCount === 0)
      return res.status(404).json({ error: "Order not found" });

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

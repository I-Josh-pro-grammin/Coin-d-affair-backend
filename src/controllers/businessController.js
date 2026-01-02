import pool from "../config/database.js";
import { validateVideoLength } from "../utils/cloudinaryHelper.js";


const createBusiness = async (req, res) => {
  const user = req.user
  const { business_name, vat_number, subscription_plan, is_paid } =
    req.body;

  const values = [
    user.userId,
    business_name,
    vat_number,
    subscription_plan,
    is_paid,
  ];

  try {

    await pool.query(
      `INSERT INTO businesses(user_id, business_name, vat_number, subscription_plan, is_paid) VALUES ($1, $2, $3, $4, $5);`,
      values
    );
    return res.status(201).json({
      message: "Business created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Failed to create business");
  }
};

const updateBusiness = async (req, res) => {
  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const updates = [];
  const values = [];
  let index = 1;

  if (req.body.business_name) {
    updates.push(`business_name = $${index++}`);
    values.push(req.body.business_name);
  }

  if (req.body.vat_number) {
    updates.push(`vat_number = $${index++}`);
    values.push(req.body.vat_number);
  }

  if (req.body.subscription_plan) {
    updates.push(`subscription_plan = $${index++}`);
    values.push(req.body.subscription_plan);
  }

  if (typeof req.body.is_paid !== "undefined") {
    updates.push(`is_paid = $${index++}`);
    values.push(req.body.is_paid);
  }

  if (req.body.website) {
    updates.push(`website = $${index++}`);
    values.push(req.body.website);
  }

  if (req.body.contact_email) {
    updates.push(`contact_email = $${index++}`);
    values.push(req.body.contact_email);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: "No fields provided to update" });
  }

  values.push(userId);

  const sql = `
    UPDATE businesses
    SET ${updates.join(", ")}
    WHERE user_id = $${index}
    RETURNING *;
  `;

  try {
    const result = await pool.query(sql, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Business not found" });
    }
    res.status(200).json({ message: "Business updated successfully", business: result.rows[0] });
  } catch (error) {
    console.error("updateBusiness error:", error);
    res.status(500).json({ message: "Failed to update business" });
  }
};

const getBusinessProductsPost = async (req, res) => {
  try {
    const user = req.user;
    const query = `
      SELECT
        l.*,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'media_id', lm.listing_media_id,
              'type', lm.media_type,
              'url', lm.url,
              'order', lm.sort_order
            ) ORDER BY lm.sort_order
          ) FILTER (WHERE lm.listing_media_id IS NOT NULL),
          '[]'
        ) AS media
      FROM listings l
      LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id
      WHERE l.seller_id = $1
      GROUP BY l.listings_id
      ORDER BY l.created_at DESC
    `;

    const allProducts = await pool.query(query, [user.userId]);

    if (!allProducts.rows.length) {
      return res.status(200).json({ message: "You have no product on market" });
    }

    res.status(200).json({ allProducts });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const addProductPost = async (req, res) => {
  const user = req.user;
  try {
    let {
      categoryId,
      subcategoryId,
      title,
      description,
      price,
      currency,
      condition,
      isNegotiable,
      canDeliver,
      stock,
      attributes,
      locationId,
    } = req.body;

    // Convert string booleans/numbers to proper types
    isNegotiable = isNegotiable === 'true' || isNegotiable === true;
    canDeliver = canDeliver === 'true' || canDeliver === true;

    const cleanCategoryId = (categoryId && categoryId !== "") ? categoryId : null;
    const cleanSubcategoryId = (subcategoryId && subcategoryId !== "") ? subcategoryId : null;
    const cleanLocationId = (locationId && locationId !== "") ? locationId : null;

    let cleanPrice = parseFloat(price);
    if (isNaN(cleanPrice)) cleanPrice = 0;

    let cleanStock = parseInt(stock);
    if (isNaN(cleanStock)) cleanStock = 0;

    // OPTIONAL: Try to find a business ID if it exists, but don't fail if not found.
    // This supports both "Business" and "Individual" sellers.
    let businessId = null;
    const businessSearch = await pool.query(
      `SELECT business_id FROM businesses WHERE user_id = $1`,
      [user.userId]
    );

    if (businessSearch.rowCount > 0) {
      businessId = businessSearch.rows[0].business_id;
    }

    // handle file uploads
    const files = req.files || [];
    const images = files.filter((f) => f.mimetype.startsWith("image/"));
    const videos = files.filter((f) => f.mimetype.startsWith("video/"));

    if (images.length === 0) {
      return res.status(400).json({ message: "Atleast one image is required" });
    }

    if (images.length > 4) {
      return res
        .status(400)
        .json({ message: "Maximum of 4 images is allowed" });
    }

    if (videos.length > 1) {
      return res.status(400).json({ message: "Only one video is allowed" });
    }

    const insertQuery = `
      INSERT INTO listings
        (seller_id, business_id, category_id, subcategory_id, title, description, price, currency, condition, is_negotiable, can_deliver, stock, attributes, location_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING listings_id
    `;
    const results = await pool.query(insertQuery, [
      user.userId,
      businessId,
      cleanCategoryId,
      cleanSubcategoryId,
      title,
      description,
      cleanPrice,
      currency,
      condition,
      isNegotiable,
      canDeliver,
      cleanStock,
      attributes ? JSON.stringify(attributes) : "{}",
      cleanLocationId,
    ]);
    const listingId = results.rows[0].listings_id;

    for (let i = 0; i < images.length; i++) {
      await pool.query(
        `INSERT INTO listing_media (listing_id,media_type,url,sort_order,metadata) VALUES ($1,$2,$3,$4,$5)`,
        [
          listingId,
          "image",
          images[i].path,
          i,
          JSON.stringify({ public_id: images[i].filename }),
        ]
      );
    }

    if (videos.length === 1) {
      await validateVideoLength(videos[0].filename, 60);
      await pool.query(
        `INSERT INTO listing_media (listing_id,media_type,url,sort_order,metadata) VALUES ($1,$2,$3,$4,$5)`,
        [
          listingId,
          "video",
          videos[0].path,
          images.length,
          JSON.stringify({ public_id: videos[0].filename }),
        ]
      );
    }

    const productWithMedia = await pool.query(
      `
      SELECT l.*,
        COALESCE(json_agg(jsonb_build_object(
          'media_id', lm.listing_media_id,
          'type', lm.media_type,
          'url', lm.url,
          'order', lm.sort_order
        ) ORDER BY lm.sort_order) FILTER (WHERE lm.listing_media_id IS NOT NULL), '[]') as media
      FROM listings l
      LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id
      WHERE l.listings_id = $1
      GROUP BY l.listings_id
      LIMIT 1
    `,
      [listingId]
    );

    res.json({
      message: "Product added successfully",
      product: productWithMedia.rows[0],
    });
  } catch (error) {
    console.error("❌ addProductPost error:", error);
    // Ensure we always return a response and don't hang
    if (!res.headersSent) {
      return res.status(500).json({
        message: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

const updateProductPost = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = req.user;
    const {
      categoryId,
      subcategoryId,
      title,
      description,
      price,
      currency,
      condition,
      isNegotiable,
      canDeliver,
      stock,
      attributes,
    } = req.body;

    // Check ownership using seller_id (User ID) instead of business_id
    const productCheck = await pool.query(
      `SELECT listings_id FROM listings WHERE listings_id=$1 AND seller_id=$2`,
      [productId, user.userId]
    );

    if (productCheck.rowCount === 0) {
      return res
        .status(403)
        .json({ message: "You are not the owner of the product" });
    }

    const orderCheck = await pool.query(
      `SELECT ord.status as orderStatus, oi.order_id as orderId from orders ord join order_items oi on ord.order_id = oi.order_id where oi.listing_id = $1`,
      [productId]
    );

    if (orderCheck.rowCount > 0) {
      const checkOrderStatus = orderCheck.rows.some(
        (order) =>
          order.orderStatus !== "delivered" && order.orderStatus !== "cancelled"
      );

      if (checkOrderStatus) {
        return res.status(400).json({
          message: "Cannot update product. It has active or pending orders.",
        });
      }
    }

    const files = req.files || [];
    const images = files.filter((f) => f.mimetype.startsWith("image/"));
    const videos = files.filter((f) => f.mimetype.startsWith("video/"));

    if (files.length > 0) {
      if (images.length === 0) {
        return res
          .status(400)
          .json({ message: "Atleast one image is required" });
      }

      if (images.length > 4) {
        return res
          .status(400)
          .json({ message: "Maximum of 4 images have reached" });
      }

      if (videos.length > 1) {
        return res
          .status(400)
          .json({ message: "Maximum of one video have reached" });
      }
    }

    await pool.query(
      `UPDATE listings SET 
        category_id = COALESCE($1, category_id),
        subcategory_id = COALESCE($2, subcategory_id),
        title = COALESCE($3, title),
        description = COALESCE($4, description),
        price = COALESCE($5, price),
        currency = COALESCE($6, currency),
        condition = COALESCE($7, condition),
        is_negotiable = COALESCE($8, is_negotiable),
        can_deliver = COALESCE($9, can_deliver),
        stock = COALESCE($10, stock),
        attributes = COALESCE($11, attributes),
        updated_at = NOW()
      WHERE listings_id = $12`,
      [
        categoryId || null,
        subcategoryId || null,
        title || null,
        description || null,
        !isNaN(parseFloat(price)) ? parseFloat(price) : null,
        currency || null,
        condition || null,
        typeof isNegotiable === "undefined" ? null : isNegotiable,
        typeof canDeliver === "undefined" ? null : canDeliver,
        !isNaN(parseInt(stock)) ? parseInt(stock) : null,
        attributes ? JSON.stringify(attributes) : null,
        productId,
      ]
    );

    if (files.length > 0) {
      await pool.query(`DELETE FROM listing_media WHERE listing_id = $1`, [
        productId,
      ]);

      const updateMediaQuery = `INSERT INTO listing_media (listing_id, media_type, url, sort_order, metadata) VALUES ($1,$2,$3,$4,$5)`;

      for (let i = 0; i < images.length; i++) {
        await pool.query(updateMediaQuery, [
          productId,
          "image",
          images[i].path,
          i,
          JSON.stringify({ public_id: images[i].filename })
        ]);
      }

      if (videos.length === 1) {
        await pool.query(updateMediaQuery, [
          productId,
          "video",
          videos[0].path,
          images.length,
          JSON.stringify({ public_id: videos[0].filename })
        ]);
      }
    }

    const updated = await pool.query(
      `
      SELECT l.*,
        COALESCE(json_agg(jsonb_build_object(
          'media_id', lm.listing_media_id,
          'type', lm.media_type,
          'url', lm.url,
          'order', lm.sort_order
        ) ORDER BY lm.sort_order) FILTER (WHERE lm.listing_media_id IS NOT NULL), '[]') as media
      FROM listings l
      LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id
      WHERE l.listings_id = $1
      GROUP BY l.listings_id
      LIMIT 1
    `,
      [productId]
    );

    res.status(200).json({
      message: "Product updated successfully",
      product: updated.rows[0],
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteProductPost = async (req, res) => {
  try {
    const user = req.user;
    const productId = req.params.productId;

    // Check ownership using seller_id
    const productSearch = await pool.query(
      `SELECT listings_id FROM listings WHERE listings_id=$1 AND seller_id = $2`,
      [productId, user.userId]
    );

    if (productSearch.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Product does not belong to you" });
    }

    const checkProduct = await pool.query(
      `SELECT ord.status as orderStatus, oi.order_id as orderId from orders ord join order_items oi on  oi.order_id = ord.order_id where oi.listing_id = $1 `,
      [productId]
    );

    if (checkProduct.rowCount > 0) {
      const hasActiveOrders = checkProduct.rows.some(
        (order) =>
          order.orderStatus !== "delivered" && order.orderStatus !== "cancelled"
      );

      if (hasActiveOrders) {
        return res
          .status(400)
          .json({ message: "Cannot delete product. It is in active orders" });
      }
    }

    // Delete associated media first to avoid foreign key constraints
    await pool.query(`DELETE FROM listing_media WHERE listing_id = $1`, [productId]);

    // Now delete the listing
    await pool.query(`DELETE FROM listings WHERE listings_id = $1`, [productId]);

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBusinessOrders = async (req, res) => {
  try {
    const user = req.user;
    const businessSearch = await pool.query(
      `SELECT business_id from businesses where user_id=$1`,
      [user.userId]
    );

    if (businessSearch.rows.length === 0) {
      return res.status(400).json({ message: "Business not found" });
    }

    const businessId = businessSearch.rows[0].business_id;

    const query = `
    SELECT ord.order_id,
    ord.status,
    ord.seller_id,
    ord.user_id,
    ord.total_amount,
    ord.currency,
    ord.created_at,
    oi.unit_price,
    oi.quantity,
    l.title,
    l.listings_id AS product_id FROM orders ord JOIN order_items oi ON ord.order_id = oi.order_id
    JOIN listings l ON oi.listing_id = l.listings_id WHERE l.business_id = $1 ORDER BY ord.created_at DESC
    `;


    const orders = await pool.query(query, [businessId]);
    const users = await pool.query('SELECT o.order_id, u.user_id, u.full_name, u.email FROM orders o JOIN users u ON o.user_id = u.user_id WHERE o.order_id = ANY($1)', [orders.rows.map(r => r.order_id)]);
    res.status(200).json({ orders: orders.rows, users: users.rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBusinessTransactions = async (req, res) => {
  try {
    const user = req.user;

    const businessSearch = await pool.query(
      `SELECT business_id FROM businesses where user_id= $1`,
      [user.userId]
    );

    if (businessSearch.rowCount === 0) {
      return res.status(404).json({ message: "Business not found" });
    }

    const businessId = businessSearch.rows[0].business_id;
    const query = `SELECT payment_id,order_id,provider,provider_payment_id,amount,currency,status,created_at FROM payments where recipient_type= 'business' AND recipient_id= $1 ORDER BY created_at DESC`;
    const result = await pool.query(query, [businessId]);
    res.status(200).json({
      transactions: result.rows,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getLocations = async (req, res) => {
  try {
    const result = await pool.query(`SELECT location_id AS id, name FROM locations ORDER BY name ASC`);
    res.status(200).json({ locations: result.rows });
  } catch (error) {
    console.error("getLocations error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  createBusiness,
  updateBusiness,
  getBusinessProductsPost,
  getBusinessOrders,
  addProductPost,
  updateProductPost,
  deleteProductPost,
  getBusinessTransactions,
  getLocations,
};
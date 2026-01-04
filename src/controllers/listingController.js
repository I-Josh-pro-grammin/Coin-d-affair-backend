import pool from "../config/database.js";


const baseListingSelect = `
SELECT
l.*,
  loc.name as location,
  c.category_name,
  c.slug as category_slug,
  sc.subcategory_name,
  sc.slug as subcategory_slug,
  b.business_name,
  b.whatsapp as business_whatsapp,
  b.website as business_website,
  b.contact_email as business_email,
  u.phone as seller_phone,
  u.email as seller_email,
  COALESCE(AVG(pr.rating), 0)::FLOAT as rating,
  COUNT(pr.rating)::INT as review_count,
  COALESCE(
    json_agg(
      jsonb_build_object(
        'media_id', lm.listing_media_id,
        'type', lm.media_type,
        'url', lm.url,
        'order', lm.sort_order
      ) ORDER BY lm.sort_order
    ) FILTER(WHERE lm.listing_media_id IS NOT NULL),
    '[]'
  ) AS media
    FROM listings l 
    LEFT JOIN locations loc ON l.location_id = loc.location_id 
    LEFT JOIN categories c ON l.category_id = c.category_id
    LEFT JOIN subcategories sc ON l.subcategory_id = sc.subcategory_id
    LEFT JOIN businesses b ON l.business_id = b.business_id
    LEFT JOIN users u ON l.seller_id = u.user_id
    LEFT JOIN product_ratings pr ON l.listings_id = pr.listing_id
    LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id
  `;

const getListing = async (req, res) => {
  const {
    categoryId,
    subcategoryId,
    lat,
    lon,
    radius = 1000,
    maxPrice,
    minPrice,
    sortBy,
    search,
    listingId,
    limit = 30,
    page = 1,
  } = req.query;
  try {
    let params = [];
    let idx = 1;

    let ratingJoin = sortBy === 'rating' ? 'LEFT JOIN product_ratings pr ON l.listings_id = pr.listing_id' : '';

    let idQuery = `
        SELECT l.listings_id
        FROM listings l
        LEFT JOIN locations loc ON l.location_id = loc.location_id
        ${ratingJoin}
        WHERE 1 = 1
  `;

    if (categoryId) {
      idQuery += ` AND l.category_id = $${idx++} `;
      params.push(categoryId);
    }

    if (subcategoryId) {
      idQuery += ` AND l.subcategory_id = $${idx++} `;
      params.push(subcategoryId);
    }

    if (listingId) {
      idQuery += ` AND l.listings_id = $${idx++} `;
      params.push(listingId);
    }

    if (search) {
      idQuery += ` AND(LOWER(l.title) LIKE $${idx} OR LOWER(l.description) LIKE $${idx + 1})`;
      const likeSearch = `%${search.toLowerCase()}%`;
      params.push(likeSearch, likeSearch);
      idx += 2;
    }

    if (minPrice) {
      idQuery += ` AND l.price >= $${idx++} `;
      params.push(minPrice);
    }

    if (maxPrice) {
      idQuery += ` AND l.price <= $${idx++} `;
      params.push(maxPrice);
    }

    if (sortBy == "price_asc") {
      idQuery += ` ORDER BY l.price ASC`;
    } else if (sortBy == "price_desc") {
      idQuery += ` ORDER BY l.price DESC`;
    } else if (sortBy == "rating") {
      idQuery += ` GROUP BY l.listings_id HAVING COUNT(pr.rating) > 0 ORDER BY AVG(pr.rating) DESC`;
    } else {
      idQuery += ` ORDER BY l.created_at DESC`;
    }

    const normalizedLimit = Math.min(Number(limit) || 30, 60);
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * normalizedLimit;

    idQuery += ` LIMIT $${idx++} OFFSET $${idx++} `;
    params.push(normalizedLimit, offset);

    const idResults = await pool.query(idQuery, params);
    const ids = idResults.rows.map((r) => r.listings_id);

    if (ids.length === 0) {
      return res.status(200).json({
        listings: [],
        pagination: { page: currentPage, limit: normalizedLimit, count: 0 },
      });
    }

    const finalQuery = `
        ${baseListingSelect}
        WHERE l.listings_id = ANY($1)
        GROUP BY l.listings_id, loc.name, c.category_name, c.slug, sc.subcategory_name, sc.slug, b.business_name, b.whatsapp, b.website, b.contact_email, u.phone, u.email
        ORDER BY array_position($1, l.listings_id)
  `;

    const listings = await pool.query(finalQuery, [ids]);
    res.status(200).json({
      listings: listings.rows,
      pagination: {
        page: currentPage,
        limit: normalizedLimit,
        count: listings.rowCount,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getListingById = async (req, res) => {
  try {
    const { listingId } = req.params;
    const query = `
      SELECT
      l.*,
        loc.name as location,
        c.category_name,
        c.slug as category_slug,
        sc.subcategory_name,
        sc.slug as subcategory_slug,
        b.business_name,
        b.whatsapp as business_whatsapp,
        b.website as business_website,
        b.contact_email as business_email,
        u.phone as seller_phone,
        u.email as seller_email,
        COALESCE(AVG(pr.rating), 0)::FLOAT as rating,
        (
          SELECT COALESCE(AVG(pr2.rating), 0)::FLOAT
          FROM product_ratings pr2
          JOIN listings l2 ON pr2.listing_id = l2.listings_id
          WHERE l2.seller_id = l.seller_id
        ) as seller_rating,
        COUNT(pr.rating)::INT as review_count,
        COALESCE(
          json_agg(
            jsonb_build_object(
              'media_id', lm.listing_media_id,
              'type', lm.media_type,
              'url', lm.url,
              'order', lm.sort_order
            ) ORDER BY lm.sort_order
          ) FILTER(WHERE lm.listing_media_id IS NOT NULL),
          '[]'
        ) AS media
          FROM listings l 
          LEFT JOIN locations loc ON l.location_id = loc.location_id 
          LEFT JOIN categories c ON l.category_id = c.category_id
          LEFT JOIN subcategories sc ON l.subcategory_id = sc.subcategory_id
          LEFT JOIN businesses b ON l.business_id = b.business_id
          LEFT JOIN users u ON l.seller_id = u.user_id
          LEFT JOIN product_ratings pr ON l.listings_id = pr.listing_id
          LEFT JOIN listing_media lm ON lm.listing_id = l.listings_id
      WHERE l.listings_id = $1
      GROUP BY l.listings_id, loc.name, c.category_name, c.slug, sc.subcategory_name, sc.slug, b.business_name, b.whatsapp, b.website, b.contact_email, u.phone, u.email
      LIMIT 1
  `;
    const result = await pool.query(query, [listingId]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.status(200).json({ listing: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllListings = async (req, res) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const normalizedLimit = Math.min(Number(limit) || 30, 100);
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * normalizedLimit;

    const query = `
      ${baseListingSelect}
      GROUP BY l.listings_id, loc.name, c.category_name, c.slug, sc.subcategory_name, sc.slug, b.business_name, b.whatsapp, b.website, b.contact_email, u.phone, u.email
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2
  `;
    const result = await pool.query(query, [normalizedLimit, offset]);

    res.status(200).json({
      listings: result.rows,
      pagination: {
        page: currentPage,
        limit: normalizedLimit,
        count: result.rowCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

const submitRating = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { rating, comment } = req.body;
    // Assuming backend auth middleware populates req.user
    const userId = req.user?.user_id || req.user?.id || req.user?.userId;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating (1-5)" });
    }

    const query = `
      INSERT INTO product_ratings (user_id, listing_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, listing_id) DO UPDATE
      SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;

    await pool.query(query, [userId, listingId, rating, comment]);

    res.status(200).json({ message: "Rating submitted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export { getListing, getListingById, getAllListings, submitRating };

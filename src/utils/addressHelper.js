import pool from "../config/database.js";

/**
 * Get or create an address from a simple city name
 * This is a simplified approach for product listings
 */
export const getOrCreateAddress = async (cityName) => {
  if (!cityName) {
    throw new Error("City name is required");
  }

  // First, try to find existing address with this city
  const existing = await pool.query(
    `SELECT address_id FROM addresses WHERE LOWER(city) = LOWER($1) LIMIT 1`,
    [cityName]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].address_id;
  }

  // Create new address with minimal data
  const result = await pool.query(
    `INSERT INTO addresses (city, country, location) 
     VALUES ($1, $2, ST_MakePoint(0, 0)::geography) 
     RETURNING address_id`,
    [cityName, "Rwanda"]
  );

  return result.rows[0].address_id;
};

export default { getOrCreateAddress };

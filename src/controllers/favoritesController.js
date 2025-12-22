import pool from '../config/database.js';

const addFavorite = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { listing_id } = req.body;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!listing_id) return res.status(400).json({ message: 'listing_id is required' });

    const { rows: exists } = await pool.query(
      'SELECT favorite_id FROM favorites WHERE user_id = $1 AND listing_id = $2',
      [userId, listing_id]
    );

    if (exists.length > 0) {
      return res.status(200).json({ message: 'Already favorited' });
    }

    const insert = await pool.query(
      'INSERT INTO favorites (user_id, listing_id) VALUES ($1, $2) RETURNING favorite_id',
      [userId, listing_id]
    );

    res.status(201).json({ favorite_id: insert.rows[0].favorite_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const removeFavorite = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { listingId } = req.params;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!listingId) return res.status(400).json({ message: 'listingId is required' });

    await pool.query('DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2', [userId, listingId]);

    res.status(200).json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getFavorites = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const results = await pool.query(
      `SELECT l.* FROM favorites f
       JOIN listings l ON f.listing_id = l.listings_id
       WHERE f.user_id = $1 ORDER BY f.favorite_id DESC`,
      [userId]
    );

    res.status(200).json({ listings: results.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export { addFavorite, removeFavorite, getFavorites };

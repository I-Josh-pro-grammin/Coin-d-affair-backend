
import pool from "../config/database.js";

/**
 * Submit verification documents
 * Route: POST /api/verification/submit
 */
export const submitVerification = async (req, res) => {
    const userId = req.user.userId;
    const { id_type, id_number, whatsapp_number, location_city } = req.body;

    // req.files is handled by multer-storage-cloudinary, so files are already uploaded
    // Structure: { document_front: [file], document_back: [file], selfie: [file] }
    // or array if using upload.any() or upload.fields()

    // We expect upload.fields([{ name: 'document_front' }, { name: 'document_back' }, { name: 'selfie' }])
    const files = req.files || {};

    try {
        const document_front_url = files["document_front"]?.[0]?.path;
        const document_back_url = files["document_back"]?.[0]?.path;
        const selfie_url = files["selfie"]?.[0]?.path;

        if (!document_front_url || !selfie_url) {
            return res.status(400).json({ message: "Front ID document and Selfie are required." });
        }

        // Check if pending verification exists
        const existing = await pool.query(
            `SELECT status FROM seller_verifications WHERE user_id = $1 AND status = 'pending'`,
            [userId]
        );

        if (existing.rowCount > 0) {
            return res.status(400).json({ message: "You already have a pending verification request." });
        }

        // Insert verification request
        await pool.query(
            `INSERT INTO seller_verifications 
       (user_id, status, id_type, id_number, document_front_url, document_back_url, selfie_url, whatsapp_number, location_city)
       VALUES ($1, 'pending', $2, $3, $4, $5, $6, $7, $8)`,
            [userId, id_type, id_number, document_front_url, document_back_url, selfie_url, whatsapp_number, location_city]
        );

        // Update user status
        await pool.query(
            `UPDATE users SET seller_verification_status = 'pending' WHERE user_id = $1`,
            [userId]
        );

        res.status(201).json({ message: "Verification submitted successfully." });

    } catch (error) {
        console.error("submitVerification error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get current verification status
 * Route: GET /api/verification/status
 */
export const getVerificationStatus = async (req, res) => {
    const userId = req.user.userId;
    try {
        // Get latest verification
        const result = await pool.query(
            `SELECT status, rejection_reason, created_at FROM seller_verifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        const userResult = await pool.query(
            `SELECT seller_verification_status FROM users WHERE user_id = $1`,
            [userId]
        );

        res.json({
            verification: result.rows[0] || null,
            userStatus: userResult.rows[0]?.seller_verification_status || 'none'
        });
    } catch (error) {
        console.error("getVerificationStatus error:", error);
        res.status(500).json({ message: "Internal server error", error: error.message, stack: error.stack });
    }
};

/**
 * Admin: Get all pending verifications
 * Route: GET /api/admin/verifications
 */
export const getAllVerifications = async (req, res) => {
    try {
        const { status = 'pending' } = req.query;

        const query = `
      SELECT 
        v.*, 
        u.full_name, u.email, u.phone, u.account_type, u.created_at as user_created_at 
      FROM seller_verifications v
      JOIN users u ON v.user_id = u.user_id
      WHERE v.status = $1
      ORDER BY v.created_at DESC
    `;

        const result = await pool.query(query, [status]);

        res.json(result.rows);
    } catch (error) {
        console.error("getAllVerifications error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Admin: Update verification status
 * Route: POST /api/admin/verification/:id/action
 */
export const updateVerificationStatus = async (req, res) => {
    const adminId = req.user.userId;
    const { id } = req.params; // verification_id
    const { action, reason } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
    }

    try {
        const status = action === 'approve' ? 'approved' : 'rejected';

        // Get the verification record to find the user_id
        const verif = await pool.query(`SELECT user_id FROM seller_verifications WHERE verification_id = $1`, [id]);
        if (verif.rowCount === 0) return res.status(404).json({ message: "Request not found" });

        const targetUserId = verif.rows[0].user_id;

        // Update verification table
        await pool.query(
            `UPDATE seller_verifications SET status = $1, rejection_reason = $2, reviewed_by = $3, updated_at = NOW() WHERE verification_id = $4`,
            [status, reason || null, adminId, id]
        );

        // Update user table status
        await pool.query(
            `UPDATE users SET seller_verification_status = $1 WHERE user_id = $2`,
            [status, targetUserId]
        );

        res.json({ message: `Verification ${status}` });

    } catch (error) {
        console.error("updateVerificationStatus error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

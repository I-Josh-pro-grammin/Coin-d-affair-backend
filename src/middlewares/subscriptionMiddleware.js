import pool from '../config/database.js'

const checkSubscription = async (req, res, next) => {
    const user = req.user

    // Allow admin and individual users to bypass subscription checks
    if (user.accountType === 'admin' || user.accountType === 'user') {
        return next()
    }

    // For business accounts, we still want to check, but be lenient if the record is missing to avoid "zombie" states
    try {
        const result = await pool.query(`SELECT subscription_period_end from businesses where user_id = $1`, [user.userId])

        // If business record is missing but account type is business, just let them proceed as individual/fallback
        // instead of blocking them.
        if (result.rowCount === 0) {
            return next();
        }

        const business = result.rows[0];
        // Optional: Enforce subscription expiry? For now, let's keep it open or strictly check expiry if needed.
        // If you want to enforce strict paid subscriptions, uncomment the logic below.
        // if (!business.subscription_period_end || new Date(business.subscription_period_end) < new Date()) {
        //     return res.status(403).json({ message: "Your subscription have ended. Upgrade to Pro" })
        // }
        next()
    } catch (error) {
        console.error("❌ checkSubscription error:", error);
        // Don't block the request on system error, just log and proceed (fail open) or fail closed. 
        // Fail closed is safer for permissions, but fail open might be better for UX if DB is flaky.
        // Let's fail closed with 500 for now.
        res.status(500).json({ message: "Internal server error", details: error.message })
    }
}

export default checkSubscription;
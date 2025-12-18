import pool from '../config/database.js'

const checkSubscription = async (req, res, next) => {
    const user = req.user
    if (user.accountType == 'admin') {
        return next()
    }

    if (user.accountType !== 'business') {
        return res.status(403).json({ message: "Only businesses are allowed to post products" })
    }

    try {
        const result = await pool.query(`SELECT subscription_period_end from businesses where user_id = $1`, [user.userId])

        if (result.rowCount === 0) {
            return res.status(403).json({ message: "Register as a business to post products" })
        }

        const business = result.rows[0];
        if (!business.subscription_period_end || new Date(business.subscription_period_end) < new Date()) {
            return res.status(403).json({ message: "Your subscription have ended. Upgrade to Pro" })
        }
        next()
    } catch (error) {
        console.error("❌ checkSubscription error:", error);
        res.status(500).json({ message: "Internal server error", details: error.message })
    }
}

export default checkSubscription;
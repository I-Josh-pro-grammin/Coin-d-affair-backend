// src/middlewares/adminLogger.js
import pool from "../config/database.js";
const adminLogger = (action) => {
  return async (req, res, next) => {
    try {
      const adminUser = req.user; // protectedRoutes must set req.user
      // ensure adminUser exists (protectedRoutes should enforce accountType='admin')
      if (!adminUser) return next();

      // insert basic log
      const { rows } = await pool.query(
        `INSERT INTO admin_logs (admin_user_id, action, resource_type, resource_id, meta) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [adminUser.userId, action, req.params.resourceType || null, req.params.resourceId || null, JSON.stringify({ ip: req.ip, path: req.path })]
      );

      // attach helper to req to allow controllers to append more logs
      req.adminLog = async (subAction, opts = {}) => {
        await pool.query(
          `INSERT INTO admin_logs (admin_user_id, action, resource_type, resource_id, meta) VALUES ($1,$2,$3,$4,$5)`,
          [adminUser.userId, subAction, opts.resourceType || null, opts.resourceId || null, JSON.stringify(opts.meta || {})]
        );
      };

      next();
    } catch (err) {
      console.error("adminLogger error:", err);
      next();
    }
  };
};

export default adminLogger;

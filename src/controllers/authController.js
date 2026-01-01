import pool from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import crypto from "crypto";
import { transporter } from "../config/emailSender.js";

const toSafeUser = (user) => ({
  userId: user.user_id,
  name: user.full_name,
  email: user.email,
  phone: user.phone,
  account_type: user.account_type,
  isVerified: user.is_verified,
  verification_status: user.verification_status || null,
  location: user.location
});

const register = async (req, res) => {
  const { fullName, email, password, accountType, phone, idType, idNumber, whatsapp, locationCity, businessName } = req.body;
  try {
    const existingEmail = await pool.query(
      `SELECT user_id FROM users where email = $1`,
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ message: "Account already exist" });
    }
    const emailVerifyToken = crypto.randomUUID();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const verifyUrl = `${frontendUrl}/auth/verify/${emailVerifyToken}`;
    const hashedPassword = await hashPassword(password);

    // New column `verification_status` will be set to 'pending' for seller/business accounts
    const verificationStatus = (accountType && accountType !== 'user') ? 'pending' : 'approved';

    const userResult = await pool.query(
      `INSERT INTO users (email,phone,password,full_name,account_type,verifyToken,verification_status) values ($1,$2,$3,$4,$5,$6,$7) RETURNING user_id, verification_status`,
      [
        email,
        phone,
        hashedPassword,
        fullName,
        accountType,
        emailVerifyToken,
        verificationStatus
      ]
    );

    const userId = userResult.rows[0].user_id;

    if (accountType === 'business') {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      await pool.query(
        `INSERT INTO businesses (user_id, business_name, subscription_plan, subscription_period_end, is_paid, whatsapp)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, businessName || fullName + " Business", 'free', oneYearFromNow, false, whatsapp || null]
      );
    }

    // Create Seller Verification Record if not a regular user
    if (accountType !== 'user') {
      await pool.query(
        `INSERT INTO seller_verifications
         (user_id, status, id_type, id_number, whatsapp_number, location_city)
         VALUES ($1, 'pending', $2, $3, $4, $5)`,
        [userId, idType || null, idNumber || null, whatsapp || null, locationCity || null]
      );
    }

    // Send verification email with proper error handling
    try {
      await transporter.sendMail({
        from: `"Coin d'affaire" <gravityz0071@gmail.com>`,
        to: email,
        subject: "Verification Email",
        html: `<!doctype html>
          <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <title>Verify your email — Coin d'affaire</title>
            </head>
            <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Arial, 'Helvetica Neue', Helvetica, sans-serif;color:#111;">
              <!-- Container -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  <td align="center" style="padding:24px 12px;">
                    <!-- Inner card -->
                    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 6px 18px rgba(0,0,0,0.06);">
                      <!-- Header -->
                      <tr>
                        <td style="padding:20px 24px 8px 24px; text-align:left;">
                          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                              <td style="vertical-align:middle;">
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <!-- Body Content -->
                      <tr>
                        <td style="padding:0 24px 24px 24px;">
                          <h1 style="margin:0 0 16px 0;font-size:24px;color:#1f2937;">Vérifiez votre email</h1>
                          <p style="margin:0 0 16px 0;font-size:16px;line-height:1.5;color:#4b5563;">
                            Nous avons envoyé un lien de vérification à <strong>${email}</strong>
                          </p>
                          <p style="margin:0 0 24px 0;font-size:16px;line-height:1.5;color:#4b5563;">
                            Veuillez cliquer sur le lien ci-dessous pour activer votre compte et vous connecter.
                          </p>
                          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                            <tr>
                              <td align="center" style="background-color:#2563eb;border-radius:6px;">
                                <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">
                                  Vérifier mon email
                                </a>
                              </td>
                            </tr>
                          </table>
                          <p style="margin:24px 0 0 0;font-size:14px;color:#6b7280;">
                            Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur:<br>
                            <a href="${verifyUrl}" style="color:#2563eb;text-decoration:underline;word-break:break-all;">${verifyUrl}</a>
                          </p>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="background-color:#f9fafb;padding:16px 24px;font-size:12px;color:#9ca3af;text-align:center;">
                          &copy; ${new Date().getFullYear()} Coin d'affaire. Tous droits réservés.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>`
      });
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send verification email:', emailError.message);
    }

    res.status(201).json({ message: "Check your email to verify account" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { verifyToken } = req.params
    const checkInDb = await pool.query(`UPDATE users SET is_verified=true, verifytoken=NULL where verifyToken = $1 RETURNING *`, [verifyToken])
    if (!checkInDb.rows.length) {
      return res.status(400).json({ message: "Invalid verification link" })
    }
    res.status(200).json({ message: "Email verified" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}

// api: /auth/login
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await pool.query(`SELECT * from users where email = $1`, [email])
    if (!result.rows.length) {
      return res.status(400).json({ message: "Check your email or password" })
    }

    const isPasswordCollect = await comparePassword(password, result.rows[0].password);
    if (!isPasswordCollect) {
      return res.status(400).json({ message: "Check your email or password" })
    }

    const user = result.rows[0]

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Please verify your email before logging in. Check your inbox for the verification link.",
        isVerified: false
      })
    }

    const token = generateToken(user)

    res.cookie('Token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    res.status(200).json({
      message: "Login successfully",
      token,
      user: toSafeUser(user)
    })
  } catch (error) {
    res.status(500).json({ message: "Internal server error" })
  }
}

const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      `SELECT user_id, full_name, seller_whatsapp, seller_contact_email, email, phone, account_type, is_verified, verification_status FROM users WHERE user_id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { fullName, phone, sellerWhatsapp, sellerContactEmail } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name), 
           phone = COALESCE($2, phone),
           seller_whatsapp = COALESCE($3, seller_whatsapp),
           seller_contact_email = COALESCE($4, seller_contact_email),
           updated_at = NOW()
       WHERE user_id = $5 RETURNING *`,
      [fullName, phone, sellerWhatsapp || null, sellerContactEmail || null, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", user: toSafeUser(result.rows[0]) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    const userResult = await pool.query(`SELECT password FROM users WHERE user_id = $1`, [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordCorrect = await comparePassword(currentPassword, userResult.rows[0].password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const hashedNewPassword = await hashPassword(newPassword);
    await pool.query(`UPDATE users SET password = $1, updated_at = NOW() WHERE user_id = $2`, [hashedNewPassword, userId]);

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("updatePassword error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export {
  register,
  verifyEmail,
  loginController,
  getCurrentUser,
  updateProfile,
  updatePassword,
}

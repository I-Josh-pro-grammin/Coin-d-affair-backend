const pool = require("../config/database");
const { hashPassword, comparePassword } = require("../utils/hash");
const { generateToken, verifyToken } = require("../utils/jwt");
const crypto = require("crypto");
const transporter = require("../config/emailSender");

// api: /auth/register
const register = async (req, res) => {
  const { fullName, email, password, accountType, phone } = req.body;
  try {
    const existingEmail = await pool.query(
      `SELECT user_id FROM users where email = $1`,
      [email]
    );
    // res.json(existingEmail.rows.length);

    if ((existingEmail.rows.length - 1) > 0) {
      return res.status(400).json({ message: "Account already exist" });
    }
    const verifyToken = crypto.randomUUID();
    const verifyUrl = `${process.env.BACKEND_URL}/verify/${verifyToken}`;
    const hashedPassword = hashPassword(password);
    const saveInDb = await pool.query(
      `INSERT INTO users (email,phone,password,full_name,account_type,verifyToken) values ($1,$2,$3,$4,$5,$6)`,
      [email,
      phone,
      hashedPassword,
      fullName,
      accountType,
      verifyToken]
    );

    transporter.sendMail({
      from: `"Coin d'affaire" <gravityz0071@gmail.com`,
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
                    <td style="text-align:right; vertical-align:middle; font-size:13px; color:#6b7280;">
                      <span style="display:inline-block; padding:6px 10px; border-radius:6px; background:#eef2ff; color:#3730a3;">Verify your email</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Hero -->
            <tr>
              <td style="padding:22px 24px 8px 24px; text-align:left;">
                <h1 style="margin:0 0 8px 0; font-size:22px; line-height:1.2; color:#0f172a;">Hi {{user_name}}, welcome to Coin d'affaire 👋</h1>
                <p style="margin:0; font-size:15px; color:#374151; line-height:1.5;">
                  Thanks for creating an account. To finish setting up your profile and start buying or selling, please verify your email address.
                </p>
              </td>
            </tr>

            <!-- Button -->
            <tr>
              <td style="padding:18px 24px 8px 24px; text-align:center;">
                <a href="${verifyUrl}" target="_blank" style="display:inline-block; text-decoration:none; background:#2563eb; color:#ffffff; padding:14px 22px; border-radius:8px; font-weight:600; font-size:16px; box-shadow:0 6px 12px rgba(37,99,235,0.18);">
                  Verify email address
                </a>
              </td>
            </tr           

            <!-- Footer small -->
            <tr>
              <td style="background:#fafafa; padding:14px 24px; text-align:center; font-size:12px; color:#9ca3af;">
                <div style="max-width:520px;margin:0 auto;">
                  <p style="margin:0 0 6px 0;">Coin d'affaire — international marketplace for real estate, vehicles, fashion, electronics and more.</p>
                  <p style="margin:0;">If you didn't create an account, you can safely ignore this email.</p>
                </div>
              </td>
            </tr>

          </table>
          <!-- end inner card -->
        </td>
      </tr>
    </table>
  </body>
</html>
`,
    });

    res.status(201).json({ message: "Check your email to verify account" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({
      message: "Internal server error",
      error: error.message
     });
  }
};

// api: auth/verify/:verifyToken
const verifyEmail =  async(req,res) =>{
    try {
        const { verifyToken } = req.params
        const checkInDb = await pool.query(`UPDATE users SET is_verified=true, verifytoken=NULL where verifyToken = $1`,[verifyToken])
        if(!checkInDb.rows.length){
            return res.status(400).json({message: "Invalid verification link"})
        }
    } catch (error) {
        res.status(500).json({message: "Internal server error"})
    }
}

// api: /auth/login
const login = async(req,res)=>{
    try {
        const {email,password} = req.body
        const result = await pool.query(`SELECT * from users where email = $1`,[email])
        if(!result.rows.length){
           return res.status(400).json({message: "Check your email or password"})
        }

        const isPasswordCollect = comparePassword(password,result.rows[0].password);
        if(!isPasswordCollect){
            return res.status(400).json({message: "Check your email or password"})
        }

        const user = result.rows[0]
        const token = generateToken(user)

        res.cookie('Token', token,{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 7*24*60*60*1000
        })

        res.status(200).json({message: "Login successfully", user:{
            userId: user.user_id,
            accountType: user.account_type
        }})
    } catch (error) {
        res.status(500).json({message: "Internal server error"})
    }
}

module.exports = {
    register,
    verifyEmail,
    login
}
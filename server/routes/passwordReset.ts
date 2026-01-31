import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { sendBrevoEmail } from "../email/brevoSend";

const router = Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const PASSWORD_COL_RAW = process.env.USER_PASSWORD_COLUMN || "password";
const PASSWORD_COL = PASSWORD_COL_RAW.toLowerCase();

const ALLOWED_PASSWORD_COLS = new Set(["password", "password_hash", "passwordhash"]);
if (!ALLOWED_PASSWORD_COLS.has(PASSWORD_COL)) {
  throw new Error(
    `USER_PASSWORD_COLUMN must be one of: password, password_hash, passwordHash. Got: ${PASSWORD_COL_RAW}`
  );
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function minutesFromNow(mins: number) {
  return new Date(Date.now() + mins * 60 * 1000);
}

router.get("/verify-reset-token", async (req, res) => {
  const token = String(req.query?.token || "").trim();

  if (!token) {
    return res.json({ valid: false });
  }

  try {
    const tokenHash = sha256(token);

    const tokenResult = await pool.query(
      `SELECT id FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    return res.json({ valid: (tokenResult.rowCount || 0) > 0 });
  } catch (err) {
    console.error("verify-reset-token error:", err);
    return res.json({ valid: false });
  }
});

router.post("/forgot-password", async (req, res) => {
  const emailOrUsername = String(req.body?.emailOrUsername || req.body?.email || "").trim().toLowerCase();

  const generic = {
    ok: true,
    message: "If an account exists, a reset link has been sent.",
  };

  if (!emailOrUsername) return res.json(generic);

  try {
    const userResult = await pool.query(
      `SELECT id, email FROM users WHERE lower(email) = $1 OR lower(username) = $1 LIMIT 1`,
      [emailOrUsername]
    );

    if (userResult.rowCount === 0) return res.json(generic);

    const user = userResult.rows[0] as { id: number; email: string };

    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [user.id]);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = sha256(rawToken);
    const expiresAt = minutesFromNow(60);

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    const resetUrl = `${process.env.APP_URL}/reset-password?token=${rawToken}`;

    await sendBrevoEmail({
      toEmail: user.email,
      subject: "Reset your Nearby Traveler password",
      textContent:
        `Reset your password:\n\n${resetUrl}\n\n` +
        `This link expires in 1 hour. If you didn't request this, ignore this email.`,
    });

    return res.json(generic);
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.json(generic);
  }
});

router.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const newPassword = String(req.body?.newPassword || "");

  if (!token || newPassword.length < 8) {
    return res.status(400).json({ ok: false, message: "Invalid request." });
  }

  try {
    const tokenHash = sha256(token);

    const tokenResult = await pool.query(
      `SELECT id, user_id
       FROM password_reset_tokens
       WHERE token_hash = $1
         AND used_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenResult.rowCount === 0) {
      return res.status(400).json({ ok: false, message: "Token invalid or expired." });
    }

    const { id: resetTokenId, user_id: userId } = tokenResult.rows[0] as {
      id: string;
      user_id: number;
    };

    const passwordHash = await bcrypt.hash(newPassword, 12);

    const updateSql =
      PASSWORD_COL === "passwordhash"
        ? `UPDATE users SET "passwordHash" = $1 WHERE id = $2`
        : `UPDATE users SET ${PASSWORD_COL} = $1 WHERE id = $2`;

    await pool.query(updateSql, [passwordHash, userId]);

    await pool.query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [
      resetTokenId,
    ]);

    return res.json({ ok: true, message: "Password updated. Please log in." });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ ok: false, message: "Server error." });
  }
});

export default router;

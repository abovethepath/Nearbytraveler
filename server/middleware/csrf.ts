import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// Secure CSRF protection using double-submit cookie pattern
// This is production-ready and more secure than the deprecated csurf package

interface CSRFRequest extends Request {
  csrfToken?: () => string;
}

// Generate a cryptographically secure CSRF token
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// CSRF middleware that implements double-submit cookie pattern
export const csrfProtection = () => {
  return (req: CSRFRequest, res: Response, next: NextFunction) => {
    // Add token generation method to request
    req.csrfToken = () => {
      const token = generateCSRFToken();
      // Set secure cookie with token
      res.cookie('_csrf', token, {
        httpOnly: false, // Need to be readable by frontend JS
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 hour
      });
      return token;
    };

    // For GET requests, just attach the token generator and continue
    if (req.method === 'GET') {
      return next();
    }

    // For state-changing requests (POST, PUT, DELETE), validate CSRF token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      const tokenFromCookie = req.cookies._csrf;
      const tokenFromHeader = req.get('X-CSRF-Token') || req.get('X-Requested-With') === 'XMLHttpRequest' && req.body._csrf;
      
      if (!tokenFromCookie || !tokenFromHeader) {
        console.error('🔒 CSRF Protection: Missing CSRF token');
        return res.status(403).json({
          success: false,
          message: 'CSRF token required',
          code: 'CSRF_TOKEN_MISSING'
        });
      }

      // Compare tokens using crypto.timingSafeEqual to prevent timing attacks
      const cookieBuffer = Buffer.from(tokenFromCookie, 'hex');
      const headerBuffer = Buffer.from(tokenFromHeader, 'hex');
      
      if (cookieBuffer.length !== headerBuffer.length || !crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
        console.error('🔒 CSRF Protection: Invalid CSRF token');
        return res.status(403).json({
          success: false,
          message: 'Invalid CSRF token',
          code: 'CSRF_TOKEN_INVALID'
        });
      }

      console.log('✅ CSRF Protection: Token validated successfully');
    }

    next();
  };
};

// Endpoint to get CSRF token for frontend
export const getCSRFToken = (req: CSRFRequest, res: Response) => {
  if (!req.csrfToken) {
    return res.status(500).json({
      success: false,
      message: 'CSRF middleware not properly configured'
    });
  }
  
  const token = req.csrfToken();
  res.json({
    success: true,
    csrfToken: token
  });
};
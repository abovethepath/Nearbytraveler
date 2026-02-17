import React, { useEffect } from "react";
import { useAuth } from "@/App";

/**
 * Sign-out page - clears session and redirects to sign-in.
 * Useful for native app users who land via QR code and need to switch accounts.
 * Accessible at /signout (e.g. nearbytraveler.org/signout)
 */
export default function SignOutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    logout("/signin");
  }, [logout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <p className="text-gray-600 dark:text-gray-400">Signing out...</p>
    </div>
  );
}

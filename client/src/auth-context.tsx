import React, { createContext, useContext, useState } from "react";

export type AuthUser = { 
  id: number; 
  username?: string | null;
  interests?: string[];
  localActivities?: string[];
  localEvents?: string[];
  travelDestination?: string;
  userType?: string;
  name?: string;
  location?: string;
  bio?: string;
  profileImage?: string;
  [key: string]: any;
} | null;

export type AuthContextValue = {
  user: AuthUser;
  setUser: React.Dispatch<React.SetStateAction<AuthUser>>;
};

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  setUser: () => {},
});

// ✅ Back-compat hook used across the app
export function useAuth() {
  return useContext(AuthContext);
}

// (Optional) Useful for tests or external wrappers
export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser;
}) {
  const [user, setUser] = useState<AuthUser>(initialUser);
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
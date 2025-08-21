import React from "react";

export const AuthContext = React.createContext({
  user: null, 
  setUser: () => {}, 
  isAuthenticated: false
});

export const useAuth = () => React.useContext(AuthContext);
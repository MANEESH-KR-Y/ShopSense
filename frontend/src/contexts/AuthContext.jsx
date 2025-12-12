import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // --------------------------
  // Load session on refresh
  // --------------------------
  useEffect(() => {
    const init = async () => {
      // Always try to refresh/get a token first to ensure we have one for API calls
      const refreshed = await tryRefresh();
      if (!refreshed) {
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    init();
  }, []);

  // --------------------------
  // Refresh access token
  // --------------------------
  const tryRefresh = async () => {
    try {
      const res = await authAPI.refresh();
      const newToken = res.data.accessToken;

      window.__accessToken = newToken;
      setAccessToken(newToken);

      // Now load user
      const me = await authAPI.getCurrentUser();
      setUser(me.data.user);

      return true;
    } catch {
      return false;
    }
  };

  // --------------------------
  // Login
  // --------------------------
  const login = async (credentials) => {
    try {
      const res = await authAPI.login(credentials);

      const token = res.data.accessToken;

      window.__accessToken = token;
      setAccessToken(token);
      setUser(res.data.user);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Login failed",
      };
    }
  };

  const loginWithOtp = async (email, otp) => {
    try {
      const res = await authAPI.loginOtp({ email, otp });
      const token = res.data.accessToken;

      window.__accessToken = token;
      setAccessToken(token);
      setUser(res.data.user);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "OTP Login failed"
      };
    }
  };

  // --------------------------
  // Logout
  // --------------------------
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch { }

    window.__accessToken = null;
    setAccessToken(null);
    setUser(null);
  };

  const register = async (data) => {
    try {
      const res = await authAPI.register(data);
      const token = res.data.accessToken;

      window.__accessToken = token;
      setAccessToken(token);
      setUser(res.data.user);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || "Registration failed",
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithOtp,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/inventory/Products";
import AddProduct from "./pages/inventory/AddProduct";
import UpdateStock from "./pages/inventory/UpdateStock";
import EditProduct from "./pages/inventory/EditProduct";
import Billing from "./pages/Billing";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import GstReport from "./pages/analytics/GstReport";
import { SyncProvider } from "./contexts/SyncContext";
import NetworkStatus from "./components/NetworkStatus";


export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <NetworkStatus />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/inventory/edit/:id"
              element={
                <ProtectedRoute>
                  <EditProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory/products"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory/add"
              element={
                <ProtectedRoute>
                  <AddProduct />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory/update/:productId"
              element={
                <ProtectedRoute>
                  <UpdateStock />
                </ProtectedRoute>
              }
            />

            <Route
              path="/inventory/stock"
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics/report"
              element={
                <ProtectedRoute>
                  <GstReport />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </SyncProvider>
    </AuthProvider>
  );
}

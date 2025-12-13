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
import { VoiceProvider, useVoiceContext } from "./contexts/VoiceContext";
import GlobalVoiceControl from "./components/GlobalVoiceControl";
import { NLU } from "./utils/nlu";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation for route aware logic
import { AnimatePresence } from 'framer-motion';

// ... (imports remain same)

// Animated Routes Wrapper
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
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
    </AnimatePresence>
  );
};
// ... (imports remain same)

// Global Voice Handler Component
const GlobalVoiceHandler = () => {
  const { text, isListening } = useVoiceContext();
  const navigate = useNavigate();
  const location = useLocation();
  const lastProcessedRef = React.useRef("");

  React.useEffect(() => {
    if (!text || text === lastProcessedRef.current) return;
    lastProcessedRef.current = text;

    const processGlobalVoice = async () => {
      try {
        // Parse globally (ASYNC now)
        const { intent, route } = await NLU.parse(text, []);

        if (intent === 'navigation' && route) {
          if (location.pathname !== route) {
            navigate(route);
            console.log(`Navigating to ${route}`);
          }
        }
      } catch (err) {
        console.error("Global Voice Error", err);
      }
    };
    processGlobalVoice();

  }, [text, navigate, location]);

  return null; // Invisible handler
};

// ... (imports remain same)
import SplashScreen from "./components/SplashScreen"; // Import SplashScreen

// ... (AnimatedRoutes and GlobalVoiceHandler remain same)

export default function App() {
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Simulate initial loading time (e.g., waiting for Auth or Assets)
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 3 seconds splash screen

    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <SyncProvider>
        <VoiceProvider> {/* Wrap with VoiceProvider */}
          <NetworkStatus />
          {loading ? (
            <SplashScreen />
          ) : (
            <>
              <GlobalVoiceControl />
              <BrowserRouter>
                <GlobalVoiceHandler /> {/* Active inside Router */}
                <AnimatedRoutes />
              </BrowserRouter>
            </>
          )}
        </VoiceProvider>
      </SyncProvider>
    </AuthProvider>
  );
}

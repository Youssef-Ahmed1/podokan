// frontend/src/App.jsx
import React, { useEffect, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { server } from "./server"; // Base URL for backend
import Store from "./redux/store";
import { loadSeller, loadUser } from "./redux/actions/user";
import { getAllProducts } from "./redux/actions/product";
import { getAllEvents } from "./redux/actions/event";

// Route Protection
import ProtectedRoute from "./routes/ProtectedRoute";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";
import SellerProtectedRoute from "./routes/SellerProtectedRoute";

// Layout
import Loader from "./components/Layout/Loader";

// Page Imports (Ensure these files/exports exist and paths are correct)
import {
  LoginPage,
  SignupPage,
  ActivationPage,
  HomePage,
  ProductsPage,
  BestSellingPage,
  EventsPage,
  FAQPage,
  CheckoutPage,
  PaymentPage,
  OrderSuccessPage,
  ProductDetailsPage,
  ProfilePage,
  ShopCreatePage,
  SellerActivationPage,
  ShopLoginPage,
  OrderDetailsPage as UserOrderDetailsPage,
  TrackOrderPage,
  UserInbox,
} from "./routes/Routes.js";
import {
  ShopHomePage as SellerShopHomePage,
  ShopDashboardPage,
  ShopCreateProduct,
  ShopAllProducts,
  ShopCreateEvents,
  ShopAllEvents,
  ShopAllCoupouns,
  ShopPreviewPage,
  ShopAllOrders,
  ShopOrderDetails,
  ShopAllRefunds,
  ShopSettingsPage,
  ShopWithDrawMoneyPage,
  ShopInboxPage,
} from "./routes/ShopRoutes";
import {
  AdminDashboardPage,
  AdminDashboardUsers,
  AdminDashboardSellers,
  AdminDashboardOrders,
  AdminDashboardProducts,
  AdminDashboardEvents,
  AdminDashboardWithdraw,
  AdminApprovalProducts,
} from "./routes/AdminRoutes";
import AdminOrderDetails from "./pages/Shop/AdminOrderDetails.jsx"; // Direct import for parameterized route

// Styles
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// --- Axios Global Config ---
axios.defaults.baseURL = server;
axios.defaults.withCredentials = true; // Send cookies globally

// Request Interceptor (Adds Tokens)
axios.interceptors.request.use(
  (config) => {
    const userToken = localStorage.getItem("token");
    const sellerToken = localStorage.getItem("seller_token");
    // Define seller paths accurately
    const sellerApiPatterns = [
      "/api/v2/shop",
      "/api/v2/product",
      "/api/v2/event",
      "/api/v2/coupon", // Verify coupon path
      "/api/v2/order/get-seller",
      "/api/v2/order/accept-refund",
      "/api/v2/withdraw",
    ];
    const isSellerRequest =
      config.url &&
      sellerApiPatterns.some((pattern) => config.url.startsWith(pattern));

    delete config.headers["Authorization"];
    delete config.headers["Seller-Authorization"]; // Clear first

    // Apply correct token based on route type
    if (isSellerRequest && sellerToken) {
      config.headers["Seller-Authorization"] = `Bearer ${sellerToken}`;
    } else if (userToken) {
      config.headers["Authorization"] = `Bearer ${userToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor (Handles 401)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};
    const originalRequest = error.config;
    // Only handle 401 and ensure we don't retry indefinitely
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const wasSellerRequest =
        !!originalRequest.headers["Seller-Authorization"];
      const toastId = wasSellerRequest ? "seller-401" : "user-401";
      const message = wasSellerRequest
        ? "Seller session expired. Please login again."
        : "Session expired. Please login again.";
      const tokenKey = wasSellerRequest ? "seller_token" : "token";

      console.warn(`Axios Interceptor: ${message}`);
      localStorage.removeItem(tokenKey); // Remove expired token
      toast.error(message, { toastId }); // Notify user
      // Consider dispatching logout actions if they exist and handle state correctly
      // Store.dispatch(wasSellerRequest ? { type: 'SELLER_LOGOUT' } : { type: 'LOGOUT_SUCCESS' });
    }
    // Always re-reject the error so the original call site knows it failed
    return Promise.reject(error);
  }
);

// --- App Component ---
const App = () => {
  // Load user/seller/initial data on first mount
  useEffect(() => {
    Store.dispatch(loadUser());
    Store.dispatch(loadSeller());
    Store.dispatch(getAllProducts());
    Store.dispatch(getAllEvents());
  }, []); // Empty dependency array ensures this runs only once

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        {" "}
        {/* For lazy loading routes if implemented */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sign-up" element={<SignupPage />} />
          <Route
            path="/activation/:activation_token"
            element={<ActivationPage />}
          />
          <Route
            path="/seller/activation/:activation_token"
            element={<SellerActivationPage />}
          />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailsPage />} />
          <Route path="/best-selling" element={<BestSellingPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/shop/preview/:id" element={<ShopPreviewPage />} />
          <Route path="/shop-create" element={<ShopCreatePage />} />
          <Route path="/shop-login" element={<ShopLoginPage />} />
          {/* User Protected Routes */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order/success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <UserInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/order/:id"
            element={
              <ProtectedRoute>
                <UserOrderDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/track/order/:id"
            element={
              <ProtectedRoute>
                <TrackOrderPage />
              </ProtectedRoute>
            }
          />
          {/* Seller Protected Routes */}
          <Route
            path="/shop/:id"
            element={
              <SellerProtectedRoute>
                <SellerShopHomePage />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <SellerProtectedRoute>
                <ShopSettingsPage />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <SellerProtectedRoute>
                <ShopDashboardPage />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-create-product"
            element={
              <SellerProtectedRoute>
                <ShopCreateProduct />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-orders"
            element={
              <SellerProtectedRoute>
                <ShopAllOrders />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/order/:id"
            element={
              <SellerProtectedRoute>
                <ShopOrderDetails />
              </SellerProtectedRoute>
            }
          />{" "}
          {/* Seller order detail */}
          <Route
            path="/dashboard-refunds"
            element={
              <SellerProtectedRoute>
                <ShopAllRefunds />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-products"
            element={
              <SellerProtectedRoute>
                <ShopAllProducts />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-create-event"
            element={
              <SellerProtectedRoute>
                <ShopCreateEvents />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-events"
            element={
              <SellerProtectedRoute>
                <ShopAllEvents />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-coupouns"
            element={
              <SellerProtectedRoute>
                <ShopAllCoupouns />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-withdraw-money"
            element={
              <SellerProtectedRoute>
                <ShopWithDrawMoneyPage />
              </SellerProtectedRoute>
            }
          />
          <Route
            path="/dashboard-messages"
            element={
              <SellerProtectedRoute>
                <ShopInboxPage />
              </SellerProtectedRoute>
            }
          />
          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-users"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardUsers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-sellers"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardSellers />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-orders"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardOrders />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin/order/:id"
            element={
              <ProtectedAdminRoute>
                <AdminOrderDetails />
              </ProtectedAdminRoute>
            }
          />{" "}
          {/* Admin order detail */}
          <Route
            path="/admin-products"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardProducts />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-events"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardEvents />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-withdraw-request"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardWithdraw />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/admin-approval"
            element={
              <ProtectedAdminRoute>
                <AdminApprovalProducts />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </Suspense>
      <ToastContainer
        position="bottom-center"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </BrowserRouter>
  );
};

export default App;
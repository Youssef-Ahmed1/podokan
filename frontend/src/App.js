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

// Route Components (assuming lazy loading isn't fully implemented yet based on Suspense usage)
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
    OrderDetailsPage as UserOrderDetailsPage, // Renamed import for clarity
    TrackOrderPage,
} from "./routes/Routes.js";
import {
    ShopHomePage as SellerShopHomePage, // Renamed import for clarity
    ShopDashboardPage,
    ShopCreateProduct,
    ShopAllProducts,
    ShopCreateEvents,
    ShopAllEvents,
    ShopAllCoupons,
    ShopPreviewPage,
    ShopAllOrders, // Component for /dashboard-orders
    ShopOrderDetails, // Component for /order/:id (Seller)
    ShopAllRefunds,
    ShopSettingsPage,
    ShopWithDrawMoneyPage,
} from "./routes/ShopRoutes";
import {
  AdminDashboardPage,
  AdminDashboardUsers,
  AdminDashboardSellers,
  AdminDashboardOrders, // Component for /admin-orders
  AdminDashboardProducts,
  AdminDashboardEvents,
  AdminDashboardWithdraw,
  AdminApprovalProducts,
} from "./routes/AdminRoutes";
import AdminOrderDetails from "./pages/Shop/AdminOrderDetails"; // Use direct import for admin detail page

// Styles
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// --- Axios Global Config ---
axios.defaults.baseURL = server;
axios.defaults.withCredentials = true; // Send cookies globally

// Request Interceptor (Adds Tokens)
axios.interceptors.request.use(
    (config) => {
        // Define API paths that require the Seller token more precisely

        // Clear existing auth headers first
        delete config.headers["Authorization"];
        delete config.headers["Seller-Authorization"];

        // Apply correct token based on route type priority (Seller > User)

        return config;
    },
    (error) => Promise.reject(error),
);

// Response Interceptor (Handles 401 Unauthorized)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const { status } = error.response || {};
    const originalRequest = error.config;

    // Only handle 401 and prevent infinite retry loops
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Mark request to prevent re-handling

      // Determine if it was likely a seller or user request based on headers SENT
      const wasSellerRequest =
        !!originalRequest.headers["Seller-Authorization"];
      const toastId = wasSellerRequest ? "seller-401" : "user-401";
      const message = wasSellerRequest
          ? "Seller session expired or invalid. Please login again."
          : "Session expired or invalid. Please login again.";
      const loginPath = wasSellerRequest ? "/shop-login" : "/login";

      console.warn(
        `Axios Interceptor (401): ${message} (URL: ${originalRequest.url})`
      );


      if (!toast.isActive(toastId)) {
        toast.error(message, { toastId });
      }
      setTimeout(() => {
        // Check if still on a protected page before redirecting
        const currentPath = window.location.pathname;
        const isProtectedRoute =
            currentPath.startsWith("/dashboard") ||
            currentPath.startsWith("/profile") ||
            currentPath.startsWith("/admin") ||
            currentPath.startsWith("/settings") ||
            currentPath.startsWith("/checkout") ||
            currentPath.startsWith("/payment") ||
            currentPath.includes("/order/");

        if (isProtectedRoute) {
          // Check user/seller state before redirecting forcefully
          const state = Store.getState();
          const stillAuthenticated = wasSellerRequest
            ? state.seller?.isSellerAuthenticated
            : state.user?.isAuthenticated;
          if (!stillAuthenticated) {
            console.log(`Redirecting to ${loginPath} due to 401.`);
            window.location.href = loginPath; // Force redirect if state confirms logout
          } else {
            console.log(
              "State indicates still logged in, skipping forced redirect for 401."
            );
          }
        }
      }, 500);


    }

    return Promise.reject(error);
  }
);

// --- App Component ---
const App = () => {
  // Load user/seller/initial data on first mount
  useEffect(() => {
    // Wrap dispatches in try/catch if actions might throw errors themselves
    try {
      Store.dispatch(loadUser());
      Store.dispatch(loadSeller());
      Store.dispatch(getAllProducts());
      Store.dispatch(getAllEvents());
    } catch (error) {
      console.error("Error during initial data load:", error);
      toast.error("Failed to load initial application data.");
    }
  }, []); // Empty dependency array ensures this runs only once

  return (
      <BrowserRouter>
          <Suspense fallback={<Loader />}>
              {" "}
              {/* For lazy loading routes */}
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
                  <Route
                      path="/shop/preview/:id"
                      element={<ShopPreviewPage />}
                  />
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
                      path="/user/order/:id" // User specific order detail route
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
                      path="/shop/:id" // Public shop view? Or Seller Home? Assuming Seller Home
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
                      path="/dashboard-orders" // Seller All Orders page
                      element={
                          <SellerProtectedRoute>
                              <ShopAllOrders />
                          </SellerProtectedRoute>
                      }
                  />
                  <Route
                      path="/order/:id" // Seller specific order detail route
                      element={
                          <SellerProtectedRoute>
                              <ShopOrderDetails />
                          </SellerProtectedRoute>
                      }
                  />
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
                      path="/dashboard-coupons"
                      element={
                          <SellerProtectedRoute>
                              <ShopAllCoupons />
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
                      path="/admin-orders" // Admin All Orders page
                      element={
                          <ProtectedAdminRoute>
                              <AdminDashboardOrders />
                          </ProtectedAdminRoute>
                      }
                  />
                  <Route
                      path="/admin/order/:id" // Admin specific order detail route
                      element={
                          <ProtectedAdminRoute>
                              <AdminOrderDetails />
                          </ProtectedAdminRoute>
                      }
                  />
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

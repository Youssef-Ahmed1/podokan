// frontend/src/App.js

import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import axios from "axios";
import { server } from "./server"; // Check/adjust path
import Store from "./redux/store"; // Adjust path

// --- Page Imports (Ensure correct paths based on structure) ---
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
  OrderDetailsPage,
  TrackOrderPage,
  UserInbox,
} from "./routes/Routes.js"; // Adjust path
import {
  ShopDashboardPage,
  ShopCreateProduct,
  ShopAllProducts,
  ShopCreateEvents,
  ShopAllEvents,
  ShopAllCoupouns,
  ShopPreviewPage,
  ShopAllOrders,
  /* ShopOrderDetails, */ ShopAllRefunds,
  ShopSettingsPage,
  ShopWithDrawMoneyPage,
  ShopInboxPage,
} from "./routes/ShopRoutes"; // Adjust path

// Corrected/Specific Page Imports based on screenshots
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx"; // Adjust if path differs
import AdminDashboardUsers from "./pages/AdminDashboardUsers.jsx"; // Adjust path
import AdminDashboardSellers from "./pages/AdminDashboardSellers.jsx"; // Adjust path
import AdminDashboardOrders from "./pages/AdminDashboardOrders.jsx"; // Correct path
import AdminDashboardProducts from "./pages/AdminDashboardProducts.jsx"; // Adjust path
import AdminDashboardEvents from "./pages/AdminDashboardEvents.jsx"; // Adjust path
import AdminDashboardWithdraw from "./pages/AdminDashboardWithdraw.jsx"; // Adjust path
import AdminApprovalProducts from "./pages/AdminApprovalProducts.jsx"; // Adjust path
import ShopHomePage from "./pages/Shop/ShopHomePage"; // Check if this specific file exists or comes from ShopRoutes.js
import ShopOrderDetails from "./pages/Shop/ShopOrderDetails"; // Correct path for seller order detail
import AdminOrderDetails from "./pages/Shop/AdminOrderDetails"; // Correct path for admin order detail (inside Shop folder per screenshot)

// --- Route Protection ---
import ProtectedRoute from "./routes/ProtectedRoute"; // Adjust path
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute"; // Adjust path
import SellerProtectedRoute from "./routes/SellerProtectedRoute"; // Adjust path

// --- Redux Actions ---
import { loadSeller, loadUser } from "./redux/actions/user"; // Adjust path
import { getAllProducts } from "./redux/actions/product"; // Adjust path
import { getAllEvents } from "./redux/actions/event"; // Adjust path

// --- CSS ---
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// --- Loading Component ---
import Loader from "./components/Layout/Loader"; // Assuming path

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Configure axios default settings
        axios.defaults.withCredentials = true; // Crucial for cookie-based sessions if used

        // Set up default auth headers from localStorage
        const token = localStorage.getItem("token");
        const sellerToken = localStorage.getItem("seller_token");

        // Ensure 'Authorization' header includes 'Bearer ' prefix if token exists
        if (token) {
          axios.defaults.headers.common["Authorization"] = token.startsWith(
            "Bearer "
          )
            ? token
            : `Bearer ${token}`;
        } else {
          delete axios.defaults.headers.common["Authorization"]; // Remove header if no token
        }

        // Ensure 'Seller-Authorization' header includes 'Bearer ' prefix if token exists
        if (sellerToken) {
          axios.defaults.headers.common["Seller-Authorization"] =
            sellerToken.startsWith("Bearer ")
              ? sellerToken
              : `Bearer ${sellerToken}`;
        } else {
          delete axios.defaults.headers.common["Seller-Authorization"]; // Remove header if no token
        }

        // Load initial data in parallel
        // Add error handling for individual dispatches if needed
        await Promise.allSettled([
          // Use allSettled to continue even if one fails
          Store.dispatch(loadUser()),
          Store.dispatch(loadSeller()),
          Store.dispatch(getAllProducts()),
          Store.dispatch(getAllEvents()),
        ]).then((results) => {
          results.forEach((result, index) => {
            if (result.status === "rejected") {
              console.error(
                `Initialization failed for action ${index}:`,
                result.reason
              );
              // Optionally toast non-critical errors?
            }
          });
        });
      } catch (error) {
        console.error("Critical error initializing app:", error);
        // Maybe show a global error boundary?
      } finally {
        setIsLoading(false); // Set loading false even if some parts fail
      }
    };

    initializeApp();
  }, []); // Run only once on mount

  if (isLoading) {
    return <Loader />; // Use your Loader component
  }

  return (
    <BrowserRouter>
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
        <Route path="/shop-create" element={<ShopCreatePage />} />
        <Route path="/shop-login" element={<ShopLoginPage />} />
        <Route path="/shop/preview/:id" element={<ShopPreviewPage />} />{" "}
        {/* Public shop preview */}
        {/* Protected User Routes */}
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
        {/* Use the page that contains the UserOrderDetails component */}
        <Route
          path="/user/order/:id"
          element={
            <ProtectedRoute>
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
        {/* Use the page that contains the TrackOrder component */}
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
              <ShopHomePage />
            </SellerProtectedRoute>
          }
        />{" "}
        {/* Seller view of their shop? */}
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
        />{" "}
        {/* Seller orders list */}
        <Route
          path="/dashboard-refunds"
          element={
            <SellerProtectedRoute>
              <ShopAllRefunds />
            </SellerProtectedRoute>
          }
        />
        {/* Seller Order Detail Route - Use correct page component */}
        <Route
          path="/order/:id"
          element={
            <SellerProtectedRoute>
              <ShopOrderDetails />
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
        {/* Admin Orders List Route - Use correct page component */}
        <Route
          path="/admin-orders"
          element={
            <ProtectedAdminRoute>
              <AdminDashboardOrders />
            </ProtectedAdminRoute>
          }
        />
        {/* Admin Order Detail Route - Use correct page component (using Shop/AdminOrderDetails per screenshot) */}
        <Route
          path="/admin/order/:id"
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
        {/* Fallback or 404 Route */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>

      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </BrowserRouter>
  );
};

export default App;

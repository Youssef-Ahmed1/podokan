import React, { useEffect, useState, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import axios from "axios";
import { server } from "./server";
import Store from "./redux/store";
import { loadSeller, loadUser } from "./redux/actions/user";
import { getAllProducts } from "./redux/actions/product";
import { getAllEvents } from "./redux/actions/event";
import ProtectedRoute from "./routes/ProtectedRoute";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";
import SellerProtectedRoute from "./routes/SellerProtectedRoute";
import Loader from "./components/Layout/Loader";

// Lazy load components
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const SignupPage = React.lazy(() => import("./pages/SignupPage"));
const ActivationPage = React.lazy(() => import("./pages/ActivationPage"));
const HomePage = React.lazy(() => import("./pages/HomePage"));
const ProductsPage = React.lazy(() => import("./pages/ProductsPage"));
const BestSellingPage = React.lazy(() => import("./pages/BestSellingPage"));
const EventsPage = React.lazy(() => import("./pages/EventsPage"));
const FAQPage = React.lazy(() => import("./pages/FAQPage"));
const CheckoutPage = React.lazy(() => import("./pages/CheckoutPage"));
const PaymentPage = React.lazy(() => import("./pages/PaymentPage"));
const OrderSuccessPage = React.lazy(() => import("./pages/OrderSuccessPage"));
const ProductDetailsPage = React.lazy(() =>
  import("./pages/ProductDetailsPage")
);
const ProfilePage = React.lazy(() => import("./pages/ProfilePage"));
const ShopCreatePage = React.lazy(() => import("./pages/ShopCreatePage"));
const SellerActivationPage = React.lazy(() =>
  import("./pages/SellerActivationPage")
);
const ShopLoginPage = React.lazy(() => import("./pages/ShopLoginPage"));
const UserOrderDetails = React.lazy(() => import("./pages/UserOrderDetails"));
const TrackOrderPage = React.lazy(() => import("./pages/TrackOrderPage"));
const UserInbox = React.lazy(() => import("./pages/UserInbox"));
const ShopHomePage = React.lazy(() => import("./pages/ShopHomePage"));
const ShopDashboardPage = React.lazy(() =>
  import("./pages/Shop/ShopDashboardPage")
);
const ShopCreateProduct = React.lazy(() =>
  import("./pages/Shop/ShopCreateProduct")
);
const ShopAllProducts = React.lazy(() =>
  import("./pages/Shop/ShopAllProducts")
);
const ShopCreateEvents = React.lazy(() =>
  import("./pages/Shop/ShopCreateEvents")
);
const ShopAllEvents = React.lazy(() => import("./pages/Shop/ShopAllEvents"));
const ShopAllCoupouns = React.lazy(() =>
  import("./pages/Shop/ShopAllCoupouns")
);
const ShopPreviewPage = React.lazy(() => import("./pages/ShopPreviewPage"));
const ShopAllOrders = React.lazy(() => import("./pages/Shop/AllOrders"));
const ShopOrderDetails = React.lazy(() => import("./pages/Shop/OrderDetails"));
const ShopAllRefunds = React.lazy(() => import("./pages/Shop/ShopAllRefunds"));
const ShopSettingsPage = React.lazy(() =>
  import("./pages/Shop/ShopSettingsPage")
);
const ShopWithDrawMoneyPage = React.lazy(() =>
  import("./pages/Shop/ShopWithDrawMoneyPage")
);
const ShopInboxPage = React.lazy(() => import("./pages/Shop/ShopInboxPage"));
const AdminDashboardPage = React.lazy(() =>
  import("./pages/Admin/AdminDashboardPage")
);
const AdminDashboardUsers = React.lazy(() =>
  import("./pages/Admin/AdminDashboardUsers")
);
const AdminDashboardSellers = React.lazy(() =>
  import("./pages/Admin/AdminDashboardSellers")
);
const AdminDashboardOrders = React.lazy(() =>
  import("./pages/Admin/AdminDashboardOrders")
);
const AdminOrderDetails = React.lazy(() =>
  import("./pages/Admin/AdminOrderDetails")
);
const AdminDashboardProducts = React.lazy(() =>
  import("./pages/Admin/AdminDashboardProducts")
);
const AdminDashboardEvents = React.lazy(() =>
  import("./pages/Admin/AdminDashboardEvents")
);
const AdminDashboardWithdraw = React.lazy(() =>
  import("./pages/Admin/AdminDashboardWithdraw")
);
const AdminApprovalProducts = React.lazy(() =>
  import("./pages/Admin/AdminApprovalProducts")
);

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Axios Global Defaults & Interceptor
axios.defaults.baseURL = server;
axios.defaults.withCredentials = true;

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const sellerToken = localStorage.getItem("seller_token");
    // Prioritize seller token for seller-specific routes
    const sellerRoutes = [
      "/shop/",
      "/get-seller-orders",
      "/get-seller-order",
      "/accept-refund",
    ]; // Add more patterns
    const isSellerReq = sellerRoutes.some((route) =>
      config.url?.includes(route)
    );

    if (isSellerReq && sellerToken) {
      config.headers["Seller-Authorization"] = `Bearer ${sellerToken}`;
    } else if (token) {
      // Use user/admin token for others
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const App = () => {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.allSettled([
          Store.dispatch(loadUser()),
          Store.dispatch(loadSeller()),
          Store.dispatch(getAllProducts()),
          Store.dispatch(getAllEvents()),
        ]);
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  if (isInitializing) return <Loader />;

  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
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
          {/* User */}
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
                <UserOrderDetails />
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
          {/* Seller */}
          <Route
            path="/shop/:id"
            element={
              <SellerProtectedRoute>
                <ShopHomePage />
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
          {/* Seller Order Detail */}
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
          {/* Admin */}
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
          {/* Admin Order Detail */}
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
        hideProgressBar
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

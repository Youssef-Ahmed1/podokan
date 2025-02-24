// routes/SellerProtectedRoute.js
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import React, { useEffect} from "react";
// routes/SellerProtectedRoute.js
const SellerProtectedRoute = ({ children }) => {
  const { isSeller, isLoading, seller } = useSelector((state) => state.seller);
  const navigate = useNavigate();

  useEffect(() => {
    // Check token on mount
    const token = localStorage.getItem('seller_token');
    if (!token && !isLoading) {
      navigate('/shop-login');
    }
  }, [isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isSeller) {
    return <Navigate to="/shop-login" replace />;
  }

  if (seller?.status !== "Active") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-red-600">Account Not Active</h2>
          <p className="mt-2 text-gray-600">Your seller account is currently not active.</p>
          <p className="mt-1 text-gray-600">Please contact support for assistance.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default SellerProtectedRoute;
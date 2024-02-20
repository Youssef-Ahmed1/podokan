import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Loader from "../components/Layout/Loader";

const SellerProtectedRoute = ({ children }) => {
  const { isLoading, isSeller } = useSelector((state) => state.seller);

  // Show a loader while fetching seller status
  if (isLoading) {
    return <Loader />;
  } else {
    // Check if the user is not identified as a seller
    if (!isSeller) {
      // Redirect to shop login if the user is not a seller
      return <Navigate to="/shop-login" replace />;
    }
    // Render children components for authenticated sellers
    return children;
  }
};

export default SellerProtectedRoute;

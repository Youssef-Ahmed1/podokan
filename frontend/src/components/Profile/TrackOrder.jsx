// frontend/src/pages/TrackOrderPage.jsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import {
  Truck,
  Package,
  AlertTriangle,
  ArrowLeft,
  Clock,
  Check,
  X,
} from "lucide-react"; // Import relevant icons
// **FIX: Correct paths based on user structure**
import { getAllOrdersOfUser } from "../redux/actions/order"; // Path relative to pages folder
import Loader from "../components/Layout/Loader"; // Assuming Loader path
import AdminHeader from "../components/Layout/AdminHeader"; // If using standard layout
import Footer from "../components/Layout/Footer"; // If using standard layout

const TrackOrder = () => {
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id: orderId } = useParams();

  const [trackingStatusInfo, setTrackingStatusInfo] = useState(null);
  const [orderNotFound, setOrderNotFound] = useState(false);

  useEffect(() => {
    if (
      user?._id &&
      (!orders || orders.length === 0 || !orders.find((o) => o._id === orderId))
    ) {
      dispatch(getAllOrdersOfUser());
    }
  }, [dispatch, user, orderId, orders]);

  useEffect(() => {
    setOrderNotFound(false);
    setTrackingStatusInfo(null); // Reset on change
    if (!isLoading && orders?.length) {
      const data = orders.find((item) => item._id === orderId);
      if (data) {
        setTrackingStatusInfo(getStatusMessage(data.status));
      } else {
        setOrderNotFound(true);
      }
    } else if (!isLoading && error) {
      /* Handled below */
    } else if (!isLoading && !orders?.length) {
      setOrderNotFound(true);
    }
  }, [orders, isLoading, orderId, error]);

  const getStatusMessage = (status) => {
    switch (status) {
      case "Processing":
        return { message: "Preparing for shipment...", icon: Package };
      case "Transferred to delivery partner":
        return { message: "Handed over to delivery partner.", icon: Truck };
      case "Shipping":
        return { message: "In transit to your location.", icon: Truck };
      case "Received":
        return { message: "Arrived at local delivery hub.", icon: Truck };
      case "On the way":
        return { message: "Out for delivery!", icon: Truck };
      case "Delivered":
        return { message: "Delivered successfully!", icon: Package };
      case "Processing refund":
        return { message: "Processing refund request...", icon: Clock };
      case "Refund Approved":
        return { message: "Refund approved.", icon: Check };
      case "Refund Success":
        return { message: "Refund complete.", icon: Check };
      case "Refund Rejected":
        return { message: "Refund rejected.", icon: X };
      case "Cancelled":
        return { message: "Order cancelled.", icon: X };
      default:
        return { message: "Status unavailable.", icon: AlertTriangle };
    }
  };

  return (
    <div>
      {/* Use your standard page layout Header/Footer */}
      {/* <AdminHeader /> */}

      <div className="w-full min-h-[70vh] flex flex-col justify-center items-center text-center p-4 bg-gray-50">
        {
          isLoading ? (
            <Loader />
          ) : error ? (
            <div className="...">
              <AlertTriangle /> Error: {error} <Link to="/profile">Back</Link>
            </div>
          ) : orderNotFound ? (
            <div className="...">
              <Package /> Order NF <Link to="/profile">Back</Link>
            </div>
          ) : trackingStatusInfo ? (
            <div className="bg-white p-8 md:p-12 rounded-lg shadow-md max-w-lg">
              {trackingStatusInfo.icon && (
                <trackingStatusInfo.icon
                  size={50}
                  className="text-blue-600 mb-5 mx-auto"
                />
              )}
              <h1 className="text-xl md:text-2xl font-semibold text-gray-800 mb-3">
                Order Tracking
              </h1>
              <p className="text-base md:text-lg text-gray-700">
                {trackingStatusInfo.message}
              </p>
              <Link to={`/user/order/${orderId}`} className="mt-6 ...">
                {" "}
                View Full Details{" "}
              </Link>
            </div>
          ) : (
            <Loader />
          ) /* Show loader if status still calculating */
        }
      </div>

      {/* <Footer /> */}
    </div>
  );
};

export default TrackOrder;

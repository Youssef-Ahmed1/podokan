import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { BsFillBagFill } from "react-icons/bs";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { Eye, PackageOpen } from "lucide-react";

import {
  getAllOrdersOfShop,
  sellerUpdateOrderStatus,
  clearErrors,
} from "../../redux/actions/order"; // Use sellerUpdate action
import axios from "axios";
import { server } from "../../server";
import styles from "../../styles/styles";
import Loader from "../../components/Layout/Loader"; // Assuming Loader exists

const OrderDetails = () => {
  const { seller } = useSelector((state) => state.seller);
  // Get the correct slice of state for shop orders
  const {
    shopOrders,
    isLoading: ordersLoading,
    error: orderError,
  } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: orderId } = useParams(); // Rename to avoid conflict

  const [currentOrder, setCurrentOrder] = useState(null); // State for the specific order being viewed
  const [currentStatus, setCurrentStatus] = useState(""); // State for the dropdown selection
  const [sellerItems, setSellerItems] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true); // Separate loading state for finding/fetching the specific order
  const [updateError, setUpdateError] = useState(null); // Specific error for status update

  // Helper to find the order and set state
  const findAndSetOrder = useCallback(
    (orders) => {
      if (!orders || !orderId) return;

      const foundOrder = orders.find((order) => order._id === orderId);
      if (foundOrder) {
        console.log("Order found in Redux state:", orderId);
        setCurrentOrder(foundOrder);
        setCurrentStatus(foundOrder.status);

        // Filter cart to include only this seller's items
        if (foundOrder.cart && Array.isArray(foundOrder.cart) && seller?._id) {
          const sellerProducts = foundOrder.cart.filter((item) => {
            const itemShopId = item.shopId?.toString?.() || item.shopId;
            return itemShopId === seller._id.toString();
          });
          setSellerItems(sellerProducts);
          console.log(
            `Found ${sellerProducts.length} items for this seller in the order.`
          );
        } else {
          setSellerItems([]);
        }
        setLoadingOrder(false);
      } else {
        // If not in Redux state (e.g., direct navigation), attempt direct fetch
        console.log(
          "Order not in Redux state, attempting direct fetch:",
          orderId
        );
        fetchOrderDirectly();
      }
    },
    [orderId, seller?._id]
  ); // Dependency on seller._id added

  // Function to fetch order directly via API (fallback)
  const fetchOrderDirectly = useCallback(async () => {
    setLoadingOrder(true);
    setUpdateError(null);
    dispatch(clearErrors()); // Clear redux error

    try {
      // Check for seller token before fetching
      const sellerToken = localStorage.getItem("seller_token");
      if (!sellerToken) throw new Error("Seller authentication required.");

      const response = await axios.get(
        // **Ensure this endpoint is correct and uses the right auth**
        `${server}/order/get-seller-order/${orderId}`,
        {
          headers: { "Seller-Authorization": `Bearer ${sellerToken}` },
          withCredentials: true, // Use only if necessary for backend session/cookies
        }
      );

      if (response.data.success) {
        const orderData = response.data.order;
        console.log("Direct fetch successful for order:", orderId);
        setCurrentOrder(orderData);
        setCurrentStatus(orderData.status);
        // Backend already filters items for this endpoint, no need to filter again
        setSellerItems(orderData.cart || []); // Use the already filtered cart
      } else {
        throw new Error(
          response.data.message || "Order not found via direct fetch."
        );
      }
    } catch (err) {
      console.error("Error fetching order details directly:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load order details";
      setUpdateError(errorMsg); // Show error in UI
      toast.error(errorMsg); // Show toast as well
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId, dispatch]); // Removed 'seller' dependency as token is checked inside

  // Effect to load data:
  // 1. Ensures seller is loaded.
  // 2. Fetches all shop orders if not already loaded/present.
  // 3. Finds the specific order from the list or fetches directly.
  useEffect(() => {
    dispatch(clearErrors()); // Clear errors on component mount/order change

    if (!seller?._id) {
      console.log("Seller info not ready, waiting...");
      setLoadingOrder(true); // Keep showing loader until seller is ready
      // Optionally redirect to login or show message if seller stays null after timeout
      return;
    }

    // If shopOrders are already loaded, try finding the order
    if (shopOrders && shopOrders.length > 0) {
      console.log(
        "Shop orders found in Redux state, attempting to find order:",
        orderId
      );
      findAndSetOrder(shopOrders);
    } else if (!ordersLoading) {
      // Only fetch all if not currently loading
      console.log(
        "Shop orders not in Redux state or empty, fetching all orders first..."
      );
      setLoadingOrder(true); // Show loader while fetching all
      dispatch(getAllOrdersOfShop())
        .then((actionResult) => {
          // After fetching all, find the specific order from the new state
          console.log(
            "Finished fetching all shop orders, result:",
            actionResult
          );
          // The state updates async, use actionResult or re-read from store in next render cycle.
          // Using findAndSetOrder here might access stale state, better to rely on subsequent effect run.
          // OR directly use the result if the action payload structure allows:
          if (actionResult && Array.isArray(actionResult.orders)) {
            findAndSetOrder(actionResult.orders);
          } else {
            // Fetch directly if fetching all failed or returned unexpected shape
            fetchOrderDirectly();
          }
        })
        .catch((error) => {
          console.error("Failed to fetch all shop orders initially:", error);
          // Try fetching the single order directly as a fallback
          fetchOrderDirectly();
        });
    } else {
      // Orders are currently being loaded by another process, wait.
      console.log("Orders are already being loaded...");
      setLoadingOrder(true);
    }

    // Cleanup function
    return () => {
      dispatch(clearErrors()); // Clean up errors on unmount
    };
  }, [
    dispatch,
    orderId,
    seller?._id,
    shopOrders,
    ordersLoading,
    findAndSetOrder,
    fetchOrderDirectly,
  ]); // Add callbacks to dependency array

  // Handler for status update dropdown change
  const handleStatusChange = (e) => {
    setCurrentStatus(e.target.value);
    setUpdateError(null); // Clear previous update errors
  };

  // Handler for submitting the status update
  const orderUpdateHandler = async () => {
    if (
      !currentOrder ||
      !currentStatus ||
      currentStatus === currentOrder.status
    ) {
      toast.info("No status change selected.");
      return; // No change needed
    }
    setUpdateError(null); // Clear previous error
    console.log(
      `Attempting to update order ${orderId} status to ${currentStatus}`
    );

    try {
      // Use the specific sellerUpdateOrderStatus action
      await dispatch(sellerUpdateOrderStatus(orderId, currentStatus));
      // Action already shows success toast and refreshes list
      // We might update local state too for immediate UI feedback, but Redux refresh handles it
      // setCurrentOrder(prev => ({ ...prev, status: currentStatus })); // Optional optimistic update
    } catch (error) {
      // Error is caught, toasted, and dispatched by handleApiRequest within the action.
      // We can display it locally too if needed.
      console.error("Error during status update dispatch:", error);
      setUpdateError(
        error.message || "Update failed. Please check console/toasts."
      );
      // Maybe reset dropdown to original status?
      // setCurrentStatus(currentOrder.status);
    }
  };

  // ----- Render Logic -----

  // Display loader if fetching all orders OR finding/fetching the specific order
  if (ordersLoading || loadingOrder) {
    return <Loader />;
  }

  // Display error if fetching/finding failed significantly
  if (updateError && !currentOrder) {
    // If initial load failed
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center">
          <h3 className="font-bold text-lg mb-2">Error Loading Order</h3>
          <p>{updateError}</p>
        </div>
        <button
          onClick={() => navigate("/dashboard-orders")}
          className="mt-6 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  // Display "Order not found" specifically if load finished but no order data
  if (!currentOrder) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col justify-center items-center">
        <PackageOpen size={60} className="text-gray-400 mb-4" />
        <p className="text-xl text-gray-600">Order Not Found</p>
        <p className="text-gray-500 mt-2">
          Could not find details for this order ID, or it may not involve your
          shop.
        </p>
        <Link
          to="/dashboard-orders"
          className="mt-4 text-blue-600 hover:underline"
        >
          Return to Orders List
        </Link>
      </div>
    );
  }

  // --- Main Order Details Display ---

  // Calculate seller-specific subtotal
  const sellerSubtotal = sellerItems.reduce(
    (total, item) => total + (item.price || 0) * (item.qty || 1),
    0
  );

  // Define available statuses for seller to select (customize as needed)
  const sellerSelectableStatuses = [
    "Processing",
    "Transferred to delivery partner",
    // Seller likely cannot set "Shipping", "Received", "On the way", "Delivered" directly
  ];
  // If order is in refund process, show refund statuses
  const refundProcessingStatuses = [
    "Processing refund",
    "Refund Approved",
    "Refund Rejected",
    "Refund Success",
  ];

  return (
    <div
      className={`${styles.section} py-4 px-2 md:px-8 bg-gray-50 min-h-screen`}
    >
      {/* Header */}
      <div className="w-full flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <BsFillBagFill size={30} className="text-red-600" />
          <h1 className="pl-3 text-[22px] md:text-[25px] font-semibold text-gray-800">
            Order Details
          </h1>
        </div>
        <Link to="/dashboard-orders">
          <button
            className={`${styles.button} !bg-white !border !border-gray-300 !text-gray-700 hover:!bg-gray-50 !rounded-md !h-[45px] !px-5 text-[16px] md:text-[18px] transition duration-150`}
          >
            Back to Order List
          </button>
        </Link>
      </div>

      {/* Order Info Summary */}
      <div className="bg-white shadow rounded-lg p-6 mb-6 md:flex md:items-center md:justify-between">
        <div className="mb-4 md:mb-0">
          <h5 className="text-gray-600 text-sm">
            Order ID:{" "}
            <span className="font-medium text-gray-800">
              #{currentOrder.orderNumber || currentOrder._id?.slice(0, 8)}
            </span>
          </h5>
          <h5 className="text-gray-600 text-sm mt-1">
            Placed on:{" "}
            <span className="font-medium text-gray-800">
              {format(new Date(currentOrder.createdAt), "PPp")}{" "}
              {/* Format: Mar 28, 2025, 1:36 PM */}
            </span>
          </h5>
        </div>
        {/* Show Customer Name */}
        <div>
          <h5 className="text-gray-600 text-sm text-left md:text-right">
            Customer:{" "}
            <span className="font-medium text-gray-800">
              {currentOrder.user?.name || "N/A"}
            </span>
          </h5>
        </div>
      </div>

      {/* Seller's Items in This Order */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-[18px] font-semibold mb-5 text-gray-800 border-b pb-3">
          Your Items in This Order
        </h3>

        {sellerItems.length === 0 ? (
          <div className="w-full bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-700 text-center">
              No items from your shop are included in this specific order detail
              view.
            </p>
            {/* Show a link back or verify if this state should occur */}
          </div>
        ) : (
          sellerItems.map((item, index) => (
            <div
              key={item._id || index} // Use item._id if available
              className="flex flex-col md:flex-row items-start mb-5 border-b border-gray-100 pb-5 last:border-b-0 last:pb-0"
            >
              {/* Image */}
              <div className="w-[80px] h-[80px] bg-gray-100 rounded-md overflow-hidden flex-shrink-0 mb-3 md:mb-0 md:mr-4">
                {item.designImage?.url ||
                typeof item.designImage === "string" ? (
                  <img
                    src={item.designImage?.url || item.designImage}
                    alt={item.DesignTitle || "Product Image"}
                    className="w-full h-full object-contain" // contain is safer for varying aspect ratios
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <PackageOpen size={24} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-grow">
                <h5 className="text-[18px] font-medium text-gray-900">
                  {item.DesignTitle || "Untitled Design"}
                </h5>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-medium">Type:</span>{" "}
                  {item.ProductType || "N/A"}
                  {item.ProductColor && item.ProductColor !== "Default" ? (
                    <span className="ml-2">
                      <span className="font-medium">Color:</span>{" "}
                      {item.ProductColor}
                    </span>
                  ) : (
                    ""
                  )}
                  {item.size && item.size !== "One Size" ? (
                    <span className="ml-2">
                      <span className="font-medium">Size:</span> {item.size}
                    </span>
                  ) : (
                    ""
                  )}
                </p>
                <h5 className="pt-1 text-[16px] text-gray-700">
                  EGP {item.price?.toFixed(2) || "0.00"} x {item.qty || 1}{" "}
                  item(s) =
                  <span className="font-semibold ml-1">
                    EGP {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </span>
                </h5>
              </div>
            </div>
          ))
        )}

        {/* Seller's Subtotal Display */}
        {sellerItems.length > 0 && (
          <div className="border-t border-gray-200 w-full text-right mt-4 pt-4">
            <h5 className="text-[18px]">
              Subtotal (Your Items):{" "}
              <strong className="ml-2">EGP {sellerSubtotal.toFixed(2)}</strong>
            </h5>
            <p className="text-xs text-gray-500 mt-1">
              (Excludes shipping and items from other sellers)
            </p>
          </div>
        )}
      </div>

      {/* Customer & Payment Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Shipping Address */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-[18px] font-semibold text-gray-800 mb-4">
            Shipping Address
          </h4>
          <p className="text-gray-700">
            {currentOrder?.shippingAddress?.address1 || "N/A"}
          </p>
          {currentOrder?.shippingAddress?.address2 && (
            <p className="text-gray-700">
              {currentOrder.shippingAddress.address2}
            </p>
          )}
          <p className="text-gray-700">
            {currentOrder?.shippingAddress?.city || "N/A"},{" "}
            {currentOrder?.shippingAddress?.country || "N/A"}{" "}
            {currentOrder?.shippingAddress?.postalCode || ""}
          </p>
          <p className="text-gray-700 mt-2">
            Phone:{" "}
            {currentOrder?.shippingAddress?.phoneNumber ||
              currentOrder?.user?.phoneNumber ||
              "N/A"}
          </p>
        </div>

        {/* Payment Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-[18px] font-semibold text-gray-800 mb-4">
            Payment Information
          </h4>
          <div className="space-y-2">
            <p className="text-gray-700">
              Method:{" "}
              <span className="font-medium">
                {currentOrder?.paymentInfo?.type || "Cash On Delivery"}
              </span>
            </p>
            <p className="text-gray-700">
              Status:
              <span
                className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  currentOrder?.paymentInfo?.status === "Succeeded" ||
                  currentOrder?.paymentInfo?.status === "succeeded"
                    ? "bg-green-100 text-green-800"
                    : currentOrder?.paymentInfo?.status === "Failed"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {currentOrder?.paymentInfo?.status || "Processing"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Order Status Update Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h4 className="text-[18px] font-semibold text-gray-800 mb-4">
          Order Status
        </h4>
        {updateError && ( // Show update-specific errors here
          <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
            Error updating status: {updateError}
          </div>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Current Status Display */}
          <div className="flex-shrink-0">
            Current Status:
            <span
              className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                currentOrder.status === "Delivered"
                  ? "bg-green-100 text-green-800"
                  : currentOrder.status === "Processing"
                  ? "bg-blue-100 text-blue-800"
                  : currentOrder.status === "Cancelled" ||
                    currentOrder.status === "Refund Rejected"
                  ? "bg-red-100 text-red-800"
                  : currentOrder.status?.includes("Refund")
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {currentOrder.status}
            </span>
          </div>

          {/* Status Update Dropdown and Button */}
          <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Logic to determine which statuses are available */}
            {refundProcessingStatuses.includes(currentOrder.status) ? (
              // Seller Refund Actions Dropdown
              <select
                value={currentStatus} // Use controlled component state
                onChange={handleStatusChange}
                className="w-full sm:w-[220px] border h-[40px] rounded-[5px] px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading} // Disable during any loading
              >
                {/* Only show options from current status onwards */}
                {refundProcessingStatuses
                  .slice(
                    refundProcessingStatuses.indexOf(currentOrder.status) || 0
                  )
                  .map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
                {/* Allow rejecting even if approved? Maybe not. */}
                {!currentOrder.status.includes("Rejected") &&
                  !refundProcessingStatuses
                    .slice(
                      refundProcessingStatuses.indexOf(currentOrder.status) || 0
                    )
                    .includes("Refund Rejected") && (
                    <option value="Refund Rejected">Refund Rejected</option>
                  )}
              </select>
            ) : ![
                "Delivered",
                "Cancelled",
                "Refund Success",
                "Refund Rejected",
              ].includes(currentOrder.status) ? (
              // Regular Order Flow Dropdown (excluding final states)
              <select
                value={currentStatus}
                onChange={handleStatusChange}
                className="w-full sm:w-[220px] border h-[40px] rounded-[5px] px-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isLoading}
              >
                {/* Only show options from current status onwards in the sequence */}
                {sellerSelectableStatuses
                  .slice(
                    sellerSelectableStatuses.indexOf(currentOrder.status) || 0
                  )
                  .map((option) => (
                    <option value={option} key={option}>
                      {option}
                    </option>
                  ))}
              </select>
            ) : (
              // If in a final state, don't show dropdown
              <p className="text-sm text-gray-500">(Status is final)</p>
            )}

            {/* Show Update Button only if status can be changed */}
            {currentStatus !== currentOrder.status && (
              <button
                className={`${styles.button} !h-[40px] !px-4 !text-[16px]`}
                onClick={orderUpdateHandler}
                disabled={isLoading || ordersLoading} // Disable if loading
              >
                {isLoading ? "Updating..." : "Update Status"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  AlertTriangle,
  Info,
  CreditCard,
  MapPin,
  Phone,
  Save,
  RefreshCw,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import axios from "axios"; // Use axios directly for seller-specific fetch
import { server } from "../../server"; // Adjust path
import { toast } from "react-toastify";
import Loader from "../../components/Layout/Loader"; // Adjust path
import { format } from "date-fns";
import {
  sellerUpdateRefundStatus,
  clearErrors,
} from "../../redux/actions/order"; // Redux action for UPDATE
import { ORDER_STATUSES } from "../../constants/orderStatuses"; // Adjust path
import { Select, MenuItem, Button, CircularProgress, Box } from "@mui/material"; // MUI components

const OrderDetails = () => {
  const { seller } = useSelector((state) => state.seller);
  // Get update-related state from Redux (for the refund action)
  const { isUpdating: isRefundUpdating, error: reduxError } = useSelector(
    (state) => state.order
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams(); // Order ID from URL

  // Local state for the fetched order details and loading/error
  const [order, setOrder] = useState(null);
  const [refundStatus, setRefundStatus] = useState(""); // Local state for the refund dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [localError, setLocalError] = useState(null); // Local error state for the fetch

  // Fetching logic using direct axios call with seller token (via interceptor)
  const fetchOrderDetails = useCallback(async () => {
    setLocalError(null); // Clear previous local errors
    setIsLoading(true);
    // Ensure seller info is available
    if (!seller?._id) {
      setLocalError(
        "Seller information not loaded. Cannot fetch order details."
      );
      setIsLoading(false);
      return;
    }
    if (!id) {
      setLocalError("Order ID is missing from the URL.");
      setIsLoading(false);
      return;
    }

    try {
      // Axios interceptor will add the 'Seller-Authorization' header
      const { data } = await axios.get(
        `${server}/order/get-seller-order/${id}`, // Endpoint specifically for seller view
        { withCredentials: true } // Necessary for cookies if using them
      );

      if (data.success && data.order) {
        setOrder(data.order); // Set the fetched order data (already filtered by backend)
        setRefundStatus(data.order.status); // Initialize dropdown with current status
        setLocalError(null); // Clear error on success
      } else {
        // Handle cases where API returns success: false or no order data
        throw new Error(data.message || "Failed to retrieve order details.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Failed to load order details";
      setLocalError(msg);
      setOrder(null); // Clear order data on error

      // Don't double-toast if interceptor handles common auth errors (401)
      // But show toast for other errors like 403 (Forbidden), 404 (Not Found), 500 etc.
      if (err.response?.status !== 401) {
        toast.error(msg);
      }
      // Redirect if order not found or seller forbidden
      if (err.response?.status === 404 || err.response?.status === 403) {
        console.warn(
          `Redirecting seller due to ${err.response.status} on order detail fetch.`
        );
        navigate("/dashboard-orders");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, seller?._id, navigate]);

  // Fetch order details on component mount or when ID/Seller changes
  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Handle Redux errors specifically from the update action
  useEffect(() => {
    if (reduxError) {
      toast.error(`Refund Update Error: ${reduxError}`);
      dispatch(clearErrors()); // Clear the error from Redux state
    }
    // Cleanup function
    return () => {
      if (reduxError) dispatch(clearErrors());
    };
  }, [reduxError, dispatch]);

  // Refund Update Handler - Dispatches Redux action
  const handleRefundUpdate = () => {
    if (!order?._id || isRefundUpdating) return; // Prevent action if no order or already updating

    const currentStatus = order.status;
    const validActionStatuses = [
      // Statuses the seller can transition TO
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];

    // Check if the selected status in the dropdown is a valid action
    if (!validActionStatuses.includes(refundStatus)) {
      toast.warn(
        "Please select 'Approve Refund' or 'Reject Refund' to confirm."
      );
      return;
    }

    // Verify the order is currently in the 'Processing Refund' state
    if (currentStatus !== ORDER_STATUSES.PROCESSING_REFUND) {
      toast.error(
        `Action not allowed. Order status must be '${ORDER_STATUSES.PROCESSING_REFUND}' (Current: ${currentStatus}).`
      );
      // Revert dropdown to current status if action is invalid
      setRefundStatus(currentStatus);
      return;
    }

    // Dispatch the Redux action to update the refund status
    dispatch(sellerUpdateRefundStatus(id, refundStatus))
      .then((updatedOrderData) => {
        // Action might resolve with updated order data or just success
        if (updatedOrderData) {
          setOrder(updatedOrderData); // Update local state with the response from the action
          setRefundStatus(updatedOrderData.status);
        } else {
          // If action doesn't return data, refetch to be sure
          fetchOrderDetails();
        }
        // Success toast is handled within the action itself
      })
      .catch(() => {
        // Error toast is handled by the action/effect hook
        // Revert the dropdown selection back to the original status on failure
        setRefundStatus(currentStatus);
      });
  };

  // Render Loading State
  if (isLoading) return <Loader />;

  // Render Error/Not Found State (after loading attempt)
  if (!order) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col justify-center items-center p-4">
        {/* Display local fetch error */}
        {localError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center shadow-sm mb-4 max-w-md">
            <AlertTriangle Size={32} className="mx-auto mb-2 text-red-500" />
            <p className="font-semibold">Error Loading Order</p>
            <p className="text-sm mt-1">{localError}</p>
          </div>
        )}
        {!localError && <Info Size={48} className="text-gray-400 mb-4" />}

        <p className="text-xl text-gray-600 mt-4">
          {localError
            ? "Please try again or go back."
            : "Order details could not be displayed."}
        </p>
        <Link
          to="/dashboard-orders"
          className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center transition-colors"
        >
          <ArrowLeft Size={16} className="mr-1" /> Back to Orders List
        </Link>
      </div>
    );
  }

  // Prepare data for rendering if order exists
  const sellerItems = order.cart || []; // Cart is pre-filtered by backend for seller routes
  const sellerSubtotal = sellerItems.reduce(
    (total, item) => total + (item.price || 0) * (item.qty || 1),
    0
  );
  const orderTotal = order.totalPrice || 0;

  // Main Render
  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <ShoppingBag Size={30} className="text-blue-600 flex-shrink-0" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Order Details
              </h1>
              <p className="text-sm text-gray-500">
                ID: #{order._id?.slice(-8)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              to="/dashboard-orders"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-colors"
            >
              <ArrowLeft Size={16} className="mr-1" /> Order List
            </Link>
            <button
              onClick={fetchOrderDetails}
              disabled={isLoading || isRefundUpdating} // Disable refresh during fetch or update
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              title="Refresh Details"
            >
              <RefreshCw
                Size={18}
                className={isLoading || isRefundUpdating ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>

        {/* Order Info Summary */}
        <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6 text-sm">
            <div>
              <h5 className="text-gray-500 font-medium">Order ID:</h5>
              <p className="font-semibold text-gray-800">
                #{order._id?.slice(-8)}
              </p>
            </div>
            <div>
              <h5 className="text-gray-500 font-medium">Placed on:</h5>
              <p className="font-semibold text-gray-800">
                {format(new Date(order.createdAt), "PPp")}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <h5 className="text-gray-500 font-medium mb-1">Status:</h5>
              <span
                className={`inline-block px-3 py-1 text-xs rounded-full font-medium ${
                  order.status === "Processing"
                    ? "bg-blue-100 text-blue-800"
                    : order.status === "Delivered"
                    ? "bg-green-100 text-green-800"
                    : order.status === "Cancelled" ||
                      order.status === "Refund Rejected"
                    ? "bg-red-100 text-red-800"
                    : order.status?.includes("Refund")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <div className="md:col-span-3 mt-2 pt-3 border-t border-gray-100">
              <h5 className="text-gray-500 font-medium">Order Total:</h5>
              <p className="text-lg font-bold text-gray-900">
                EGP {orderTotal.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Items in this Order ({sellerItems.length})
          </h2>
          {sellerItems.length === 0 ? ( // Should not happen if backend filter works, but good fallback
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
              <Info Size={18} /> No items from your shop found in this order
              record.
            </div>
          ) : (
            <div className="space-y-4">
              {sellerItems.map((item, index) => (
                <div
                  key={item._id || `item-${index}`}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  {/* Item Image */}
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                    {item.designImage?.url ? (
                      <img
                        src={item.designImage.url}
                        alt={item.DesignTitle || "Design"}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package
                        Size={24}
                        className="text-gray-400"
                        title="No Image"
                      />
                    )}
                  </div>
                  {/* Item Details */}
                  <div className="flex-grow">
                    <h5 className="text-md font-semibold text-gray-800">
                      {item.DesignTitle || "N/A"}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Type: {item.ProductType || "N/A"} | Color:{" "}
                      {item.ProductColor || "N/A"} | Size: {item.Size || "N/A"}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Quantity: {item.qty || 1}
                    </p>
                    {/* Optional: Item ID */}
                    {/* <p className="text-xs text-gray-400">Item ID: {item._id || 'N/A'}</p> */}
                  </div>
                  {/* Item Pricing */}
                  <div className="w-full sm:w-auto text-left sm:text-right mt-2 sm:mt-0 flex-shrink-0">
                    <p className="text-sm text-gray-600">Unit Price:</p>
                    <p className="font-semibold text-gray-800">
                      EGP {(item.price ?? 0).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Item Total:</p>
                    <p className="font-semibold text-gray-800">
                      EGP {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer & Financial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Your Items Value */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Your Items Value
            </h3>
            {sellerItems.length > 0 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-gray-600 text-sm">
                  <span>Subtotal (Your Items)</span>
                  <span className="font-medium">
                    EGP {sellerSubtotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  This is the total value of the items you supplied in this
                  specific order.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">N/A</p>
            )}
          </div>

          {/* Customer & Order Info */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Customer & Order Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {/* Customer Info */}
              <div>
                <h4 className="font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                  <UserIcon Size={14} /> Customer
                </h4>
                <p className="text-gray-800">{order.user?.name || "N/A"}</p>
                <p className="text-gray-600 text-xs">
                  {order.user?.email || "N/A"}
                </p>
              </div>
              {/* Shipping Address */}
              <div>
                <h4 className="font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                  <MapPin Size={14} /> Shipping Address
                </h4>
                <p className="text-gray-800">
                  {order.shippingAddress?.address1 || ""}{" "}
                  {order.shippingAddress?.address2 || ""}
                </p>
                <p className="text-gray-800">
                  {order.shippingAddress?.city || ""},{" "}
                  {order.shippingAddress?.postalCode || ""}
                </p>
                <p className="text-gray-600 mt-1 flex items-center gap-1.5">
                  <Phone Size={12} />{" "}
                  {order.shippingAddress?.phoneNumber || "N/A"}
                </p>
              </div>
              {/* Payment Details */}
              <div className="md:col-span-2 mt-2 pt-3 border-t border-gray-100">
                <h4 className="font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                  <CreditCard Size={14} /> Payment Details
                </h4>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {order.paymentInfo?.type || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span
                    className={`font-medium ${
                      order.paymentInfo?.status?.toLowerCase() === "succeeded"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {order.paymentInfo?.status || "N/A"}
                  </span>
                </div>
                {/* Display Order Total Again for Clarity */}
                <div className="flex justify-between mt-1 pt-1 border-t">
                  <span className="font-semibold">Order Total:</span>
                  <span className="font-semibold">
                    EGP {orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refund Action Section */}
        {/* Show this section only if the order status is 'Processing Refund' */}
        {order.status === ORDER_STATUSES.PROCESSING_REFUND && (
          <div className="mt-6 bg-white rounded-lg shadow p-5 border border-yellow-300">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              <AlertTriangle Size={18} /> Action Required: Refund Request
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              The customer has requested a refund for this order. Please review
              and choose an action below.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select
                value={refundStatus} // Controlled by local state `refundStatus`
                onChange={(e) => setRefundStatus(e.target.value)}
                displayEmpty
                Size="small"
                fullWidth // Take full width on smaller screens
                disabled={isRefundUpdating} // Disable while update is in progress
                sx={{ minWidth: 180, height: "40px", flexGrow: 1 }} // Allow dropdown to grow
              >
                {/* Placeholder option */}
                <MenuItem value={ORDER_STATUSES.PROCESSING_REFUND} disabled>
                  <em>Select refund action...</em>
                </MenuItem>
                {/* Actionable options */}
                <MenuItem value={ORDER_STATUSES.REFUND_APPROVED}>
                  Approve Refund
                </MenuItem>
                <MenuItem value={ORDER_STATUSES.REFUND_REJECTED}>
                  Reject Refund
                </MenuItem>
              </Select>
              <Button
                variant="contained"
                onClick={handleRefundUpdate}
                disabled={
                  // Disable if dropdown hasn't changed to a valid action OR if update is in progress
                  ![
                    ORDER_STATUSES.REFUND_APPROVED,
                    ORDER_STATUSES.REFUND_REJECTED,
                  ].includes(refundStatus) || isRefundUpdating
                }
                startIcon={
                  isRefundUpdating ? (
                    <CircularProgress Size={20} color="inherit" />
                  ) : (
                    <Save Size={16} />
                  )
                }
                sx={{ height: "40px", minWidth: "160px", flexShrink: 0 }} // Prevent button shrinking
              >
                {isRefundUpdating ? "Processing..." : "Confirm Action"}
              </Button>
            </div>
            {/* Display Redux error if update fails */}
            {reduxError && (
              <p className="text-red-500 text-xs mt-2">{reduxError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
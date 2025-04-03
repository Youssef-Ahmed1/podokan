// frontend/src/pages/Shop/OrderDetails.jsx
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
} from "lucide-react";
import axios from "axios";
import { server } from "../../server"; // Adjust path
import { toast } from "react-toastify";
import Loader from "../../components/Layout/Loader"; // Adjust path
import { format } from "date-fns";
import {
  sellerUpdateRefundStatus,
  clearErrors,
} from "../../redux/actions/order"; // Adjust path
import { ORDER_STATUSES } from "../../constants/orderStatuses.js";
import { Select, MenuItem, Button, CircularProgress } from "@mui/material"; // MUI for better dropdown

const OrderDetails = () => {
  const { seller } = useSelector((state) => state.seller);
  const { isUpdating, error: reduxError } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [refundStatus, setRefundStatus] = useState(""); // For the dropdown
  const [isLoading, setIsLoading] = useState(true);
  const [localError, setLocalError] = useState(null);

  // Fetching logic
  const fetchOrderDetails = useCallback(async () => {
    setLocalError(null);
    setIsLoading(true);
    if (!seller?._id) {
      setLocalError("Seller info missing.");
      setIsLoading(false);
      return;
    }
    if (!id) {
      setLocalError("Order ID missing.");
      setIsLoading(false);
      return;
    }
    try {
      // Use axios directly - interceptor adds Seller token
      const { data } = await axios.get(
        `${server}/order/get-seller-order/${id}`,
        { withCredentials: true }
      );
      if (data.success && data.order) {
        setOrder(data.order);
        setRefundStatus(data.order.status);
      } else {
        throw new Error(data.message || "Failed to get order details");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to load details";
      setLocalError(msg);
      // Avoid double toast if interceptor handles 401/403/404
      if (![401, 403, 404].includes(err.response?.status)) toast.error(msg);
      if ([403, 404].includes(err.response?.status))
        navigate("/dashboard-orders"); // Redirect if forbidden/not found
    } finally {
      setIsLoading(false);
    }
  }, [id, seller?._id, navigate]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]); // Fetch on load

  // Handle Redux errors (from update action)
  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
      dispatch(clearErrors());
    }
    return () => dispatch(clearErrors()); // Cleanup on unmount
  }, [reduxError, dispatch]);

  // Refund Update Handler
  const handleRefundUpdate = () => {
    if (!order?._id) return;
    const currentStatus = order.status;
    const validActions = [
      ORDER_STATUSES.REFUND_APPROVED,
      ORDER_STATUSES.REFUND_REJECTED,
    ];
    if (!validActions.includes(refundStatus)) {
      toast.warn("Select Approve or Reject.");
      return;
    }
    if (currentStatus !== ORDER_STATUSES.PROCESSING_REFUND) {
      toast.error(`Order not in '${ORDER_STATUSES.PROCESSING_REFUND}' status.`);
      return;
    }
    dispatch(sellerUpdateRefundStatus(id, refundStatus))
      .then((updatedData) => {
        if (updatedData?.order) {
          setOrder(updatedData.order);
          setRefundStatus(updatedData.order.status);
        } else {
          fetchOrderDetails();
        }
      })
      .catch(() => {
        setRefundStatus(currentStatus);
      }); // Revert dropdown on error
  };

  // Render Loading
  if (isLoading) return <Loader />;

  // Render Error/Not Found
  if (!order) {
    return (
      <div className="w-full min-h-[70vh] flex flex-col justify-center items-center p-4">
        {localError ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-center shadow-sm">
            <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
            <p className="font-semibold">Error</p>
            <p className="text-sm mt-1">{localError}</p>
          </div>
        ) : (
          <Info size={48} className="text-gray-400 mb-4" />
        )}
        <p className="text-xl text-gray-600 mt-4">Order details unavailable.</p>
        <Link
          to="/dashboard-orders"
          className="mt-6 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-5 rounded-lg inline-flex items-center transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Orders
        </Link>
      </div>
    );
  }

  // Prepare data for rendering
  const sellerItems = order.cart || [];
  const sellerSubtotal = sellerItems.reduce(
    (t, i) => t + (i.price || 0) * (i.qty || 1),
    0
  );

  // Main Render
  return (
    <div className="w-full p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Package size={30} className="text-blue-600 flex-shrink-0" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Order Details
            </h1>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link
              to="/dashboard-orders"
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" /> Order List
            </Link>
            <button
              onClick={fetchOrderDetails}
              disabled={isLoading || isUpdating}
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              title="Refresh Details"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
        {/* Order Info Summary */}
        <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h5 className="text-gray-500">Order ID:</h5>
              <p className="font-semibold text-gray-800">
                #{order._id?.slice(-8)}
              </p>
            </div>
            <div>
              <h5 className="text-gray-500">Placed on:</h5>
              <p className="font-semibold text-gray-800">
                {format(new Date(order.createdAt), "PPp")}
              </p>
            </div>
            <div className="text-left md:text-right">
              <h5 className="text-gray-500">Status:</h5>
              <span
                className={`inline-block mt-1 px-3 py-1 text-xs rounded-full font-medium ${
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
          </div>
        </div>
        {/* Items */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Items ({sellerItems.length})
          </h2>
          {sellerItems.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
              <Info size={18} /> No items from your shop found.
            </div>
          ) : (
            <div className="space-y-4">
              {sellerItems.map((item) => (
                <div
                  key={item._id || Math.random()}
                  className="bg-white rounded-lg shadow p-4 border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border border-gray-200">
                    {item.designImage?.url ? (
                      <img
                        src={item.designImage.url}
                        alt={item.DesignTitle || "Design"}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <Package size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h5 className="text-md font-semibold text-gray-800">
                      {item.DesignTitle || "N/A"}
                    </h5>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Type: {item.ProductType} | Color: {item.ProductColor} |
                      Size: {item.size}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      Qty: {item.qty}
                    </p>
                  </div>
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
        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-5 border border-gray-100">
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
                  Value of your items in this order.
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">N/A</p>
            )}
          </div>
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Customer & Order Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-600 mb-1">Customer</h4>
                <p className="text-gray-800">{order.user?.name || "N/A"}</p>
                <p className="text-gray-600 text-xs">
                  {order.user?.email || "N/A"}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-600 mb-1 flex items-center">
                  <MapPin size={14} className="mr-1" /> Address
                </h4>
                <p className="text-gray-800">
                  {order.shippingAddress?.address1 || ""}{" "}
                  {order.shippingAddress?.address2 || ""}
                </p>
                <p className="text-gray-800">
                  {order.shippingAddress?.city || ""},{" "}
                  {order.shippingAddress?.country || ""}{" "}
                  {order.shippingAddress?.postalCode || ""}
                </p>
                <p className="text-gray-600 mt-1 flex items-center">
                  <Phone size={12} className="mr-1" />{" "}
                  {order.shippingAddress?.phoneNumber || "N/A"}
                </p>
              </div>
              <div className="md:col-span-2 mt-2 border-t pt-3">
                <h4 className="font-medium text-gray-600 mb-1 flex items-center">
                  <CreditCard size={14} className="mr-1" /> Payment & Total
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
                <div className="flex justify-between mt-1 pt-1 border-t">
                  <span className="font-semibold">Order Total:</span>
                  <span className="font-semibold">
                    EGP {(order.totalPrice ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Refund Action */}
        {order.status === ORDER_STATUSES.PROCESSING_REFUND && (
          <div className="mt-6 bg-white rounded-lg shadow p-5 border border-yellow-300">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">
              Action Required: Refund Request
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Approve or reject the customer's refund request.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select
                value={refundStatus}
                onChange={(e) => setRefundStatus(e.target.value)}
                displayEmpty
                size="small"
                fullWidth
                disabled={isUpdating}
                sx={{ minWidth: 180, height: "40px" }}
              >
                <MenuItem value={ORDER_STATUSES.PROCESSING_REFUND} disabled>
                  <em>Select action...</em>
                </MenuItem>
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
                  ![
                    ORDER_STATUSES.REFUND_APPROVED,
                    ORDER_STATUSES.REFUND_REJECTED,
                  ].includes(refundStatus) || isUpdating
                }
                startIcon={
                  isUpdating ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Save size={16} />
                  )
                }
                sx={{ height: "40px", minWidth: "140px" }}
              >
                {isUpdating ? "Processing..." : "Confirm Action"}
              </Button>
            </div>
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

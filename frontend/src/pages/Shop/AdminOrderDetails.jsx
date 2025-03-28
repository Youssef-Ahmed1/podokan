import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import {
  Package,
  Truck,
  Download,
  Edit,
  Check,
  X,
  Clock,
  CreditCard,
  Printer,
  AlertTriangle,
  User as UserIcon,
  Mail,
  Phone,
  Box,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  adminUpdateOrderStatus, // Use the specific admin action
  getAllOrdersOfAdmin, // Action to fetch all admin orders
  clearErrors,
} from "../../redux/actions/order"; // Corrected import path assuming actions/order.js
import axios from "axios";
import { server } from "../../server"; // Your server endpoint base URL
// Assuming DesignDownloader is correctly imported from utils
// import { DesignDownloader } from "../../utils/designDownload";
import Loader from "../../components/Layout/Loader"; // Assuming Loader exists
import styles from "../../styles/styles"; // Assuming styles exist

// --- Status Update Modal Component ---
const StatusUpdateModal = ({
  open,
  onClose,
  currentStatus,
  onUpdate,
  isLoading,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);

  useEffect(() => {
    // Reset local state if modal reopens or currentStatus changes externally
    setNewStatus(currentStatus);
  }, [currentStatus, open]);

  // Available statuses for Admin
  const adminStatuses = [
    "Processing",
    "Transferred to delivery partner",
    "Shipping",
    "Received",
    "On the way",
    "Delivered",
    "Processing refund", // Admin might view but usually doesn't set this?
    "Refund Approved", // Admin might need to trigger system refunds?
    "Refund Rejected",
    "Refund Success",
    "Cancelled", // Admin can cancel orders
  ];

  const handleConfirmUpdate = () => {
    if (newStatus && newStatus !== currentStatus) {
      onUpdate(newStatus);
    } else {
      toast.info("No status change selected.");
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-60 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-800">
            Update Order Status
          </h3>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label
            htmlFor="statusSelect"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select New Status:
          </label>
          <select
            id="statusSelect"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            {adminStatuses.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Current Status: {currentStatus}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-4 border-t bg-gray-50 rounded-b-lg space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmUpdate}
            disabled={isLoading || newStatus === currentStatus}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              "Update Status"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Admin Order Details Component ---
const AdminOrderDetails = () => {
  // **FIX: useSelector should point to state.order for orders, isLoading, error**
  const {
    adminOrders,
    isLoading: ordersLoading,
    error: orderError,
  } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user); // For role checks if needed, though backend enforces admin
  const dispatch = useDispatch();
  const { id: orderId } = useParams();

  const [order, setOrder] = useState(null); // The specific order being viewed
  const [loadingOrder, setLoadingOrder] = useState(true); // Loading state for this specific order
  const [localError, setLocalError] = useState(null); // Local error state for display
  // Removed item-specific download state, manage in handle function
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false); // Loading state for status update action

  // Helper function to fetch the order directly (fallback)
  const fetchOrderDirectly = useCallback(async () => {
    console.log(`Attempting direct fetch for admin order: ${orderId}`);
    setLoadingOrder(true);
    setLocalError(null);
    dispatch(clearErrors());

    try {
      const token = localStorage.getItem("token")
        ? `Bearer ${localStorage.getItem("token")}`
        : null;
      if (!token) throw new Error("Admin authentication token not found.");

      const { data } = await axios.get(
        `${server}/order/admin/order/${orderId}`, // Use the specific admin endpoint
        {
          headers: { Authorization: token },
          // withCredentials: true, // Usually not needed with bearer token
        }
      );

      if (data.success && data.order) {
        console.log("Direct fetch successful (Admin):", orderId);
        setOrder(data.order);
        setLocalError(null); // Clear error on success
      } else {
        throw new Error(
          data.message || "Order not found via direct admin fetch."
        );
      }
    } catch (error) {
      console.error("Error fetching admin order details directly:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to load order details.";
      setLocalError(errorMsg);
      toast.error(errorMsg);
      setOrder(null); // Ensure order is null on error
    } finally {
      setLoadingOrder(false);
    }
  }, [orderId, dispatch]);

  // Effect to load order data
  useEffect(() => {
    dispatch(clearErrors()); // Clear previous errors
    setLoadingOrder(true);

    const findOrderInState = () => {
      if (adminOrders && adminOrders.length > 0) {
        const found = adminOrders.find((o) => o._id === orderId);
        if (found) {
          console.log(`Order ${orderId} found in adminOrders state.`);
          setOrder(found);
          setLocalError(null);
          setLoadingOrder(false);
          return true; // Indicate found
        }
      }
      return false; // Indicate not found
    };

    // 1. Try finding in existing Redux state first
    if (findOrderInState()) {
      return; // Found, no further action needed
    }

    // 2. If not found, and orders aren't loading, fetch all admin orders (might contain it)
    if (!ordersLoading) {
      console.log(
        `Order ${orderId} not in state, fetching all admin orders first...`
      );
      dispatch(getAllOrdersOfAdmin())
        .then(() => {
          // After fetch completes, the Redux state should update.
          // Let the *next* render cycle's useEffect find it in the updated state.
          // OR, we can *attempt* direct fetch immediately as a likely faster path if not found after fetch.
          console.log(
            "Finished fetching all admin orders, attempting direct fetch as fallback/confirmation."
          );
          fetchOrderDirectly(); // Fetch directly anyway after bulk fetch attempt
        })
        .catch((err) => {
          console.error(
            "Failed to fetch all admin orders, attempting direct fetch:",
            err
          );
          // If fetching all failed, definitely try fetching directly
          fetchOrderDirectly();
        });
    } else {
      // If orders are currently loading, just wait for them to finish.
      // The next render cycle's useEffect run should find the order then.
      console.log("Admin orders are currently loading, waiting...");
    }

    // Cleanup on unmount or orderId change
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch, orderId, adminOrders, ordersLoading, fetchOrderDirectly]); // fetchOrderDirectly is memoized

  // **FIX: Corrected handleDownloadDesign using Redux action**
  // This function now simply dispatches the action, letting the action handle the logic.
  // State management for 'isDownloading' needs to happen within this component if feedback is desired during download.
  const [downloadingItems, setDownloadingItems] = useState({}); // Store loading state per item

  const handleDownloadDesign = async (item) => {
    if (!item?._id || !order?._id) return;
    const itemId = item._id;

    // Set loading state for this specific item
    setDownloadingItems((prev) => ({ ...prev, [itemId]: true }));
    console.log(
      `Dispatching download request for order ${order._id}, item ${itemId}`
    );

    try {
      // Dispatch the action which internally uses DesignDownloader
      await dispatch(adminDownloadDesign(order._id, itemId));
      // Success toast is handled within the action
    } catch (error) {
      // Error toast is handled within the action
      console.error(`Download dispatch failed for item ${itemId}:`, error);
      // Keep the error handling within the action for consistency
    } finally {
      // Reset loading state for this specific item
      setDownloadingItems((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Handle status update confirmation from modal
  const handleConfirmStatusUpdate = async (newStatus) => {
    if (!order?._id) return;
    console.log(
      `Admin confirming status update for ${order._id} to ${newStatus}`
    );
    setIsUpdatingStatus(true);
    try {
      await dispatch(adminUpdateOrderStatus(order._id, newStatus));
      // Success toast handled by action
      setShowStatusModal(false); // Close modal on success
      // Re-fetch order details or rely on Redux state update triggered by the action
      // For immediate feedback (optional, action should update state):
      // setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      // Consider fetching fresh data to be absolutely sure: fetchOrderDirectly();
    } catch (error) {
      // Error toast handled by action
      console.error("Status update failed:", error);
      // Keep modal open on error? User choice.
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // --- Render Logic ---

  if (loadingOrder || ordersLoading) {
    // Check both general and specific loading state
    return <Loader />;
  }

  // Handle Errors (either from Redux state or local fetch)
  const displayError = localError || orderError;
  if (displayError && !order) {
    // If loading finished but order is null due to error
    return (
      <div className="w-full h-[70vh] flex flex-col justify-center items-center p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg text-center">
          <h3 className="font-bold text-lg mb-2">
            Error Loading Order Details
          </h3>
          <p>{displayError}</p>
        </div>
        <Link
          to="/admin-orders" // Link back to the admin orders list
          className="mt-6 text-blue-600 hover:underline"
        >
          Return to Orders List
        </Link>
      </div>
    );
  }

  if (!order) {
    // If no error but still no order after loading
    return (
      <div className="w-full h-[70vh] flex flex-col justify-center items-center p-4">
        <PackageOpen size={60} className="text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Order Not Found</h2>
        <p className="text-gray-500 mt-2">
          The requested order details could not be located.
        </p>
        <Link to="/admin-orders" className="mt-6 text-blue-600 hover:underline">
          Return to Orders List
        </Link>
      </div>
    );
  }

  // Calculate totals (use fallback for potentially bad data)
  const subtotal =
    order.subtotal ??
    order.cart?.reduce(
      (total, item) => total + (item.price || 0) * (item.qty || 1),
      0
    ) ??
    0;
  const shippingCost =
    order.shippingCost ?? order.shippingAddress?.shippingPrice ?? 50;
  const total = order.totalPrice ?? subtotal + shippingCost;

  // --- Main Component Render ---
  return (
    <div
      className={`${styles.section} py-4 px-2 md:px-8 bg-gray-50 min-h-screen`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header & Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          {/* Back Link */}
          <div className="mb-4">
            <Link
              to="/admin-orders"
              className="text-sm text-blue-600 hover:underline flex items-center"
            >
              <Box size={16} className="mr-1" /> Back to Orders List
            </Link>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                Order #{order.orderNumber || order._id.slice(0, 8)}{" "}
                {/* Use virtual if defined */}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                Placed on: {format(new Date(order.createdAt), "PPp")}{" "}
                {/* e.g., Mar 28, 2025, 2:17 PM */}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-3">
              {/* Current Status Badge */}
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                  order.status === "Delivered" ||
                  order.status === "Refund Success"
                    ? "bg-green-100 text-green-800"
                    : order.status === "Processing"
                    ? "bg-blue-100 text-blue-800"
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
              {/* Update Status Button */}
              <button
                onClick={() => setShowStatusModal(true)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium flex items-center whitespace-nowrap"
              >
                <Edit size={14} className="mr-1" />
                Update Status
              </button>
            </div>
          </div>

          {/* Order Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Items Summary */}
            <div className="p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center mb-2 text-gray-700">
                <Package className="text-blue-500 mr-2" size={20} />
                <h3 className="font-semibold text-base">Order Contents</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Total Items: {order.cart?.length || 0}
              </p>
              <p className="text-gray-600 text-sm">
                Total Quantity:{" "}
                {order.cart?.reduce((sum, item) => sum + (item.qty || 1), 0) ||
                  0}
              </p>
              <p className="mt-2 font-bold text-gray-800">
                Total: EGP {total.toFixed(2)}
              </p>
            </div>

            {/* Payment Summary */}
            <div className="p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center mb-2 text-gray-700">
                <CreditCard className="text-green-500 mr-2" size={20} />
                <h3 className="font-semibold text-base">Payment</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Method:{" "}
                <span className="font-medium">
                  {order.paymentInfo?.type || "N/A"}
                </span>
              </p>
              <p className="text-gray-600 text-sm">
                Status:{" "}
                <span
                  className={`font-medium ${
                    order.paymentInfo?.status === "Succeeded" ||
                    order.paymentInfo?.status === "succeeded"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.paymentInfo?.status || "N/A"}
                </span>
              </p>
              {order.paidAt && (
                <p className="text-gray-500 text-xs mt-1">
                  Paid: {format(new Date(order.paidAt), "Pp")}
                </p>
              )}
            </div>

            {/* Timeline Summary */}
            <div className="p-4 border rounded-lg bg-gray-50/50">
              <div className="flex items-center mb-2 text-gray-700">
                <Clock className="text-purple-500 mr-2" size={20} />
                <h3 className="font-semibold text-base">Timeline</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Created: {format(new Date(order.createdAt), "Pp")}
              </p>
              {order.deliveredAt && (
                <p className="text-gray-600 text-sm">
                  Delivered: {format(new Date(order.deliveredAt), "Pp")}
                </p>
              )}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <p className="text-gray-500 text-xs mt-1">
                  Last Update:{" "}
                  {format(
                    new Date(
                      order.statusHistory[
                        order.statusHistory.length - 1
                      ].timestamp
                    ),
                    "Pp"
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-5 border-b pb-3">
            Customer Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact */}
            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center">
                <UserIcon size={18} className="mr-2 text-gray-500" /> Contact
                Details
              </h3>
              <p className="text-gray-800 font-medium">
                {order.user?.name || "N/A"}
              </p>
              <a
                href={`mailto:${order.user?.email}`}
                className="text-sm text-blue-600 hover:underline flex items-center mt-1"
              >
                <Mail size={14} className="mr-1" /> {order.user?.email || "N/A"}
              </a>
              <p className="text-sm text-gray-600 flex items-center mt-1">
                <Phone size={14} className="mr-1" />{" "}
                {order.shippingAddress?.phoneNumber ||
                  order.user?.phoneNumber ||
                  "N/A"}
              </p>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="font-medium mb-3 text-gray-700 flex items-center">
                <Truck size={18} className="mr-2 text-gray-500" /> Shipping
                Address
              </h3>
              <p className="text-gray-700">
                {order.shippingAddress?.address1 || "N/A"}
              </p>
              {order.shippingAddress?.address2 && (
                <p className="text-gray-700">
                  {order.shippingAddress.address2}
                </p>
              )}
              <p className="text-gray-700">
                {order.shippingAddress?.city || "N/A"},{" "}
                {order.shippingAddress?.country || "N/A"}
                {order.shippingAddress?.postalCode
                  ? ` ${order.shippingAddress.postalCode}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items List */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Order Items ({order.cart?.length || 0})
        </h2>
        {order.cart && order.cart.length > 0 ? (
          order.cart.map((item) => {
            const itemId = item._id?.toString() || uuidv4(); // Fallback ID for key
            const isItemDownloading = downloadingItems[itemId];
            const unitPrice = item.price ?? 0;
            const quantity = item.qty ?? 1;
            const itemTotal = unitPrice * quantity;

            return (
              <div
                key={itemId}
                className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Image */}
                  <div className="w-full md:w-1/3 lg:w-1/4 flex justify-center items-center">
                    <div className="aspect-square w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {item.designImage?.url ||
                      typeof item.designImage === "string" ? (
                        <img
                          src={item.designImage?.url || item.designImage}
                          alt={item.DesignTitle || "Product Image"}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <AlertTriangle
                            size={40}
                            className="text-gray-400 mx-auto mb-2"
                          />
                          <p className="text-xs text-gray-500">
                            No Design Preview
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="w-full md:w-2/3 lg:w-3/4">
                    {/* Title & Price */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.DesignTitle || "Untitled Design"}
                        </h3>
                        {/* Item Metadata */}
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                          <span>
                            Type:{" "}
                            <span className="font-medium text-gray-700">
                              {item.ProductType || "N/A"}
                            </span>
                          </span>
                          <span>
                            Color:{" "}
                            <span className="font-medium text-gray-700">
                              {item.ProductColor || "N/A"}
                            </span>
                          </span>
                          <span>
                            Size:{" "}
                            <span className="font-medium text-gray-700">
                              {item.size || "N/A"}
                            </span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 pl-4">
                        <p className="text-lg font-semibold text-gray-800">
                          EGP {itemTotal.toFixed(2)}
                        </p>
                        <p className="text-gray-500 text-sm">
                          (EGP {unitPrice.toFixed(2)} x {quantity})
                        </p>
                      </div>
                    </div>

                    {/* Design Specifications */}
                    <div className="bg-gray-50 p-3 rounded-md mb-4">
                      <h4 className="font-medium text-sm text-gray-600 mb-2">
                        Design Specifications
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500">Pos X:</span>{" "}
                          <span className="font-medium text-gray-700">
                            {item.designSpecs?.positionX ?? "N/A"}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Pos Y:</span>{" "}
                          <span className="font-medium text-gray-700">
                            {item.designSpecs?.positionY ?? "N/A"}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Scale:</span>{" "}
                          <span className="font-medium text-gray-700">
                            {item.designSpecs?.scale ?? "N/A"}x
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Rotate:</span>{" "}
                          <span className="font-medium text-gray-700">
                            {item.designSpecs?.rotation ?? "N/A"}°
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions for Item */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => handleDownloadDesign(item)}
                        disabled={isItemDownloading}
                        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-blue-300 flex items-center min-w-[150px] justify-center"
                      >
                        {isItemDownloading ? (
                          <>
                            <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download
                              size={16}
                              className="inline-block mr-1.5"
                            />
                            Download Design
                          </>
                        )}
                      </button>
                      {/* Add button for Print Ready File if URL exists */}
                      {item.printReadyFile?.url && (
                        <a
                          href={item.printReadyFile.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center"
                          download={`print_ready_${order._id}_${item._id}`}
                        >
                          <Printer size={16} className="inline-block mr-1.5" />{" "}
                          Print File
                        </a>
                      )}
                      {/* Placeholder for other actions like 'Edit Item Details' */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
            No items found in this order's cart data.
          </div>
        )}

        {/* Order Totals Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Order Financials
          </h2>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Shipping Cost</span>
              <span>EGP {shippingCost.toFixed(2)}</span>
            </div>
            {/* Add Discounts or Taxes here if applicable */}
            <div className="flex justify-between text-gray-800 font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span>EGP {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Status History (Optional) */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Order History
            </h2>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
              {order.statusHistory
                .slice()
                .reverse()
                .map(
                  (
                    entry,
                    index // Show newest first
                  ) => (
                    <div key={index} className="flex items-start text-sm">
                      <div className="flex-shrink-0 mt-0.5 mr-2">
                        <Clock size={14} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">
                          {entry.status}
                        </p>
                        <p className="text-gray-500">
                          {format(new Date(entry.timestamp), "Pp")} by{" "}
                          <span className="italic">
                            {entry.updatedBy?.includes("@")
                              ? "Customer"
                              : entry.updatedBy}
                          </span>{" "}
                          {/* Mask sensitive IDs */}
                        </p>
                        {entry.details && (
                          <p className="text-gray-600 mt-1 pl-4 text-xs border-l-2 ml-1 py-1">
                            {entry.details}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                )}
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        <StatusUpdateModal
          open={showStatusModal}
          onClose={() => setShowStatusModal(false)}
          currentStatus={order.status}
          onUpdate={handleConfirmStatusUpdate}
          isLoading={isUpdatingStatus}
        />
      </div>
    </div>
  );
};

export default AdminOrderDetails;

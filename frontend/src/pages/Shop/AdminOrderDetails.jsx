import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Package,
  Download,
  Edit,
  Clock,
  CreditCard,
  AlertTriangle,
  User as UserIcon,
  MapPin,
  Phone,
  ShoppingBag,
  ArrowLeft,
  Info,
  Save,
  RefreshCw,
  Printer,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  adminUpdateOrderStatus,
  adminGetDesignDataForDownload,
  getOrderDetails, // Use generic action, backend authorizes admin
  clearErrors,
} from "../../redux/actions/order"; // Adjust path
import { DesignDownloader } from "../../utils/designDownload"; // Adjust path
import Loader from "../../components/Layout/Loader"; // Adjust path
import { ORDER_STATUSES } from "../../constants/orderStatuses"; // Adjust path
import {
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  Box,
  Typography,
  IconButton,
} from "@mui/material"; // MUI components

// --- Status Update Modal Component ---
const StatusUpdateModal = ({
  open,
  onClose,
  currentStatus,
  onUpdate,
  availableStatuses,
  isUpdating,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);

  // Reset local state when modal opens or currentStatus changes externally
  useEffect(() => {
    if (open) {
      setNewStatus(currentStatus);
    }
  }, [open, currentStatus]);

  const handleUpdateClick = () => {
    if (newStatus !== currentStatus) {
      onUpdate(newStatus); // Call the update handler passed from parent
    } else {
      onClose(); // Close if status hasn't changed
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Update Order Status</DialogTitle>
      <DialogContent sx={{ paddingTop: "16px !important" }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Current Status: <strong>{currentStatus}</strong>
        </Typography>
        <Select
          value={newStatus || ""}
          onChange={(e) => setNewStatus(e.target.value)}
          fullWidth
          size="small"
          disabled={isUpdating}
          displayEmpty
        >
          {/* <MenuItem value={currentStatus} disabled><em>Select new status...</em></MenuItem> */}
          {Object.values(availableStatuses).map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </Select>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isUpdating} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={handleUpdateClick}
          variant="contained"
          color="primary"
          disabled={isUpdating || newStatus === currentStatus} // Disable if no change or updating
          startIcon={
            isUpdating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Save size={16} />
            )
          }
        >
          {isUpdating ? "Updating..." : "Update Status"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Main Admin Order Details Component ---
const AdminOrderDetails = () => {
  // Select relevant state from Redux
  const {
    order, // The detailed order object
    isDetailLoading, // Loading state for fetching the detail
    isUpdating, // Loading state for status updates
    isDownloading, // Loading state for preparing download data
    error: reduxError, // Combined error state from Redux actions
  } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user); // Need admin user info
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams(); // Order ID from URL

  // Local state
  const [downloadingItemId, setDownloadingItemId] = useState(null); // Track which item's download is processing
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Basic check if the logged-in user is an admin
  const isAdmin = user?.role?.toLowerCase() === "admin";

  // Fetching logic using useCallback
  const fetchOrderData = useCallback(() => {
    dispatch(clearErrors()); // Clear previous errors
    if (!isAdmin) {
      toast.error("Access Denied: Admin privileges required.");
      navigate("/admin/dashboard"); // Redirect non-admins
      return;
    }
    if (id) {
      // console.log("Admin fetching order details for:", id);
      dispatch(getOrderDetails(id)); // Use the generic action
    } else {
      console.error("Order ID missing in AdminOrderDetails.");
      toast.error("Order ID is missing.");
      navigate("/admin-orders");
    }
  }, [dispatch, id, isAdmin, navigate]);

  // Fetch data on mount or when ID/admin status changes
  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  // Handle Redux errors
  useEffect(() => {
    if (reduxError) {
      toast.error(`Error: ${reduxError}`);
      // Redirect if order not found or forbidden after fetch attempt
      if (
        reduxError.toLowerCase().includes("not found") ||
        reduxError.toLowerCase().includes("forbidden")
      ) {
        navigate("/admin-orders");
      }
      dispatch(clearErrors()); // Clear error after handling
    }
    // Cleanup
    return () => {
      if (reduxError) dispatch(clearErrors());
    };
  }, [reduxError, dispatch, navigate]);

  // Download Handler
  const handleDownloadDesignClick = (item) => {
    // Basic validation
    if (!item?._id || isDownloading || !order?._id || downloadingItemId) return; // Prevent multiple clicks
    if (!item.designImage?.url) {
      toast.error(
        "Cannot download: Design image URL is missing for this item."
      );
      return;
    }

    setDownloadingItemId(item._id); // Set loading state for this specific item
    toast.info(`Preparing download package for item ${item._id.slice(-6)}...`);

    dispatch(adminGetDesignDataForDownload(order._id, item._id))
      .then((designData) => {
        // Check if designData was actually returned
        if (!designData) {
          throw new Error(
            "Failed to retrieve necessary data for download preparation."
          );
        }
        // Call the utility function to process and trigger download
        return DesignDownloader.downloadSingleDesign(designData);
      })
      .then(() => {
        toast.success(
          `Download package initiated for item ${item._id.slice(-6)}!`
        );
      })
      .catch((err) => {
        console.error("Design download failed:", err);
        // Toast for specific errors is handled in the action/downloader, show generic here if needed
        // toast.error(`Download failed for item ${item._id.slice(-6)}: ${err.message}`);
      })
      .finally(() => {
        setDownloadingItemId(null); // Clear loading state regardless of outcome
      });
  };

  // Status Update Handler (called from modal)
  const handleUpdateStatusSubmit = (selectedStatus) => {
    if (!order?._id || selectedStatus === order.status || isUpdating) {
      setShowStatusModal(false); // Close modal if no change or already updating
      return;
    }

    dispatch(adminUpdateOrderStatus(order._id, selectedStatus))
      .then(() => {
        setShowStatusModal(false); // Close modal on success (state updates via Redux)
        // Success toast handled by action
      })
      .catch(() => {
        setShowStatusModal(false); // Close modal even on error
        // Error toast handled by action/effect hook
      });
  };

  // --- Render Logic ---

  // Initial Loading State
  if (isDetailLoading && !order) {
    return <Loader />;
  }

  // Order Not Found or Error State (after loading attempt)
  if (!order && !isDetailLoading) {
    return (
      <div className="p-6 text-center max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center items-center">
        {/* Display specific error if available */}
        {reduxError && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4 flex items-center justify-center gap-2 shadow-sm border border-red-200">
            <AlertTriangle size={20} /> <span>{reduxError}</span>
          </div>
        )}
        <Info size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-4">
          Could not load details for Order ID: {id}. It may not exist or an
          error occurred.
        </p>
        <Link
          to="/admin-orders" // Link back to the main admin orders list
          className="text-blue-600 hover:underline inline-flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Orders List
        </Link>
      </div>
    );
  }

  // If order exists, prepare data
  const cartItems = order.cart || [];
  const subtotal = order.subtotal ?? 0;
  const shipping = order.shippingCost ?? 0;
  const total = order.totalPrice ?? subtotal + shipping;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <Link
          to="/admin-orders"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 group text-sm font-medium"
        >
          <ArrowLeft
            size={18}
            className="mr-1 group-hover:-translate-x-1 transition-transform"
          />
          Back to Orders List
        </Link>
        <button
          onClick={fetchOrderData} // Refresh button
          disabled={isDetailLoading || isUpdating || isDownloading}
          className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
          title="Refresh Order Details"
        >
          <RefreshCw
            size={18}
            className={
              isDetailLoading || isUpdating || isDownloading
                ? "animate-spin"
                : ""
            }
          />
        </button>
      </div>

      {/* Order Summary Box */}
      <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          {/* Left Side: Order ID and Date */}
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <ShoppingBag size={24} className="text-blue-600" /> Order #
              {order._id?.slice(-8)}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Placed:{" "}
              {order.createdAt
                ? format(new Date(order.createdAt), "PP 'at' p")
                : "N/A"}
            </p>
            <p className="text-gray-500 text-sm">
              Total:{" "}
              <span className="font-bold text-gray-700">
                EGP {total.toFixed(2)}
              </span>
            </p>
          </div>
          {/* Right Side: Status and Update Button */}
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                {order.status || "N/A"}
              </span>
            </div>
            {/* Button to open the status update modal */}
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={isUpdating} // Disable while an update is in progress
              className="w-full md:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <Edit size={14} className="mr-1.5" /> Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Customer & Shipping Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Customer Card */}
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600" /> Customer Details
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              <strong className="text-gray-600 w-20 inline-block">Name:</strong>{" "}
              {order.user?.name || "N/A"}
            </p>
            <p>
              <strong className="text-gray-600 w-20 inline-block">
                Email:
              </strong>{" "}
              {order.user?.email || "N/A"}
            </p>
            <p>
              <strong className="text-gray-600 w-20 inline-block">
                User ID:
              </strong>{" "}
              {order.user?._id || "N/A"}
            </p>
          </div>
        </div>
        {/* Shipping Address Card */}
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" /> Shipping Address
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              {order.shippingAddress?.address1}
              {order.shippingAddress?.address2
                ? `, ${order.shippingAddress.address2}`
                : ""}
            </p>
            <p>
              {order.shippingAddress?.city},{" "}
              {order.shippingAddress?.country || "(Missing!)"}{" "}
              {order.shippingAddress?.postalCode}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-gray-600">
              <Phone size={14} /> {order.shippingAddress?.phoneNumber}
            </p>
            {/* Highlight missing critical address parts */}
            {!order.shippingAddress?.address1 && (
              <p className="text-red-500 text-xs mt-1">
                (Warning: Address Line 1 missing)
              </p>
            )}
            {!order.shippingAddress?.city && (
              <p className="text-red-500 text-xs mt-1">
                (Warning: City missing)
              </p>
            )}
            {!order.shippingAddress?.country && (
              <p className="text-red-500 text-xs mt-1">
                (Warning: Country missing)
              </p>
            )}
            {!order.shippingAddress?.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">
                (Warning: Phone number missing)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Items ({cartItems.length})
        </h2>
        <div className="space-y-4">
          {cartItems.map((item, index) => (
            <div
              key={item._id || `item-${index}`}
              className="bg-white rounded-lg shadow p-4 border border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Image */}
                <div className="md:col-span-2 aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                  {item.designImage?.url ? (
                    <img
                      src={item.designImage.url}
                      alt={item.DesignTitle || "Design"}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-red-500 p-2">
                      <AlertTriangle size={32} title="Design URL Missing!" />
                      <p className="text-xs mt-1">No Image URL</p>
                    </div>
                  )}
                </div>
                {/* Item Info */}
                <div className="md:col-span-6">
                  <h3 className="text-md font-semibold">
                    {item.DesignTitle || "(No Title)"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Item ID: {item._id || "N/A"}
                  </p>
                  {/* Display warning if URL is missing */}
                  {!item.designImage?.url && (
                    <p className="text-red-500 text-xs mt-1">
                      (Warning: Design URL missing! Download/Print unavailable.)
                    </p>
                  )}
                  {/* Item Attributes */}
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded border">
                      Type: {item.ProductType || "N/A"}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded border">
                      Color: {item.ProductColor || "N/A"}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded border">
                      Size: {item.size || "N/A"}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded border">
                      Qty: {item.qty || 1}
                    </span>
                  </div>
                  {/* Design Specs Details */}
                  <details className="mt-3 text-xs cursor-pointer group">
                    <summary className="font-medium text-gray-600 hover:text-black list-none flex items-center group-open:mb-1">
                      Design Specs{" "}
                      <span className="ml-1 transform group-open:rotate-90 transition-transform">
                        &rarr;
                      </span>
                    </summary>
                    <div className="mt-1 bg-gray-50 p-2 rounded border text-gray-700">
                      Position X:{" "}
                      <span className="font-mono">
                        {item.designSpecs?.positionX ?? "?"}%
                      </span>
                      <br />
                      Position Y:{" "}
                      <span className="font-mono">
                        {item.designSpecs?.positionY ?? "?"}%
                      </span>
                      <br />
                      Scale:{" "}
                      <span className="font-mono">
                        {item.designSpecs?.scale ?? "?"}x
                      </span>
                      <br />
                      Rotation:{" "}
                      <span className="font-mono">
                        {item.designSpecs?.rotation ?? "?"}°
                      </span>
                    </div>
                  </details>
                </div>
                {/* Pricing & Actions */}
                <div className="md:col-span-4 text-left md:text-right">
                  <p className="text-sm text-gray-600">
                    Unit Price: EGP {(item.price ?? 0).toFixed(2)}
                  </p>
                  <p className="text-md font-semibold mt-1">
                    Item Total: EGP{" "}
                    {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-col md:items-end gap-2">
                    {/* Download Button */}
                    <button
                      onClick={() => handleDownloadDesignClick(item)}
                      disabled={
                        !item.designImage?.url ||
                        isDownloading ||
                        downloadingItemId === item._id
                      } // Disable if no URL, any download active, or this item downloading
                      className={`w-full md:w-auto px-3 py-1.5 rounded text-sm flex items-center justify-center transition-colors ${
                        !item.designImage?.url ||
                        isDownloading ||
                        downloadingItemId === item._id
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                      title={
                        !item.designImage?.url
                          ? "Design URL missing"
                          : "Download Design Package"
                      }
                    >
                      {isDownloading && downloadingItemId === item._id ? (
                        <>
                          <CircularProgress
                            size={14}
                            color="inherit"
                            sx={{ mr: 1 }}
                          />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download size={14} className="mr-1" /> Download Pkg
                        </>
                      )}
                    </button>
                    {/* Print Button (Placeholder) */}
                    <button
                      disabled // Disabled as functionality is not implemented
                      className="w-full md:w-auto px-3 py-1.5 bg-gray-300 text-gray-600 rounded text-sm flex items-center justify-center cursor-not-allowed"
                      title="Print file generation not available"
                    >
                      <Printer size={14} className="mr-1" /> Print File (N/A)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financials & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Financial Summary Card */}
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" /> Financial Summary
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium">
                {order.paymentInfo?.type || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
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
            {order.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paid At:</span>
                <span>{format(new Date(order.paidAt), "PPp")}</span>
              </div>
            )}
            {order.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivered At:</span>
                <span>{format(new Date(order.deliveredAt), "PPp")}</span>
              </div>
            )}
            <div className="border-t my-2"></div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Shipping:</span>
              <span>EGP {shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t font-bold text-md mt-1">
              <span className="text-gray-800">Total:</span>
              <span className="text-gray-800">EGP {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {/* Order History Card */}
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" /> Order History
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto text-sm pr-2 custom-scrollbar">
            {order.statusHistory?.length > 0 ? (
              [...order.statusHistory].reverse().map(
                (
                  s,
                  i // Reverse for newest first display
                ) => (
                  <div key={i} className="flex items-start gap-2">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          i === 0 ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      ></div>
                      {i < order.statusHistory.length - 1 && (
                        <div className="w-px h-full bg-gray-200 mt-1 flex-grow"></div>
                      )}
                    </div>
                    {/* History details */}
                    <div>
                      <p className="font-medium text-gray-700">{s.status}</p>
                      <p className="text-xs text-gray-500">
                        {s.timestamp
                          ? format(new Date(s.timestamp), "PPp")
                          : "N/A"}
                        {s.updatedBy && ` by ${s.updatedBy.split(":")[0]}`}
                      </p>
                      {s.details && (
                        <p className="text-xs text-gray-600 mt-0.5 bg-gray-50 p-1 rounded italic border border-gray-100">
                          "{s.details}"
                        </p>
                      )}
                    </div>
                  </div>
                )
              )
            ) : (
              <p className="text-gray-500">No status history recorded.</p>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      <StatusUpdateModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={order.status || ""} // Pass current status
        onUpdate={handleUpdateStatusSubmit} // Pass update handler
        availableStatuses={ORDER_STATUSES} // Pass all available statuses
        isUpdating={isUpdating} // Pass loading state for update
      />
    </div>
  );
};

export default AdminOrderDetails;
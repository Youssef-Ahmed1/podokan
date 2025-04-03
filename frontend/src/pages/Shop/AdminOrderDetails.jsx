import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Package,
  Download,
  Edit,
  X,
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
  getOrderDetails,
  clearErrors,
} from "../../redux/actions/order";
import { DesignDownloader } from "../../utils/designDownload";
import Loader from "../../components/Layout/Loader";
import { ORDER_STATUSES } from "../../constants/orderStatuses.js";
import {
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
} from "@mui/material"; // MUI components

// --- Status Update Modal Component ---
// Included directly for completeness, could be moved to a separate file
const StatusUpdateModal = ({
  open,
  onClose,
  currentStatus,
  onUpdate,
  availableStatuses,
  isUpdating,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);

  // Update local state if the modal reopens or the external status changes
  useEffect(() => {
    if (open) {
      setNewStatus(currentStatus);
    }
  }, [open, currentStatus]);

  const handleUpdateClick = () => {
    if (newStatus !== currentStatus) {
      onUpdate(newStatus); // Call the update function passed via props
    } else {
      onClose(); // Close if status hasn't changed
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Update Order Status</DialogTitle>
      <DialogContent sx={{ paddingTop: "16px !important" }}>
        {" "}
        {/* Ensure some top padding */}
        <Select
          value={newStatus || ""} // Ensure value is controlled, handle initial empty state if needed
          onChange={(e) => setNewStatus(e.target.value)}
          fullWidth
          size="small"
          disabled={isUpdating}
          displayEmpty // Allows showing placeholder if needed
        >
          {/* Optional: Placeholder */}
          {/* <MenuItem value="" disabled><em>Select new status...</em></MenuItem> */}
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
          disabled={isUpdating || newStatus === currentStatus}
          startIcon={
            isUpdating ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <Save size={16} />
            )
          }
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// --- Main Admin Order Details Component ---
const AdminOrderDetails = () => {
  const {
    order,
    isDetailLoading,
    isUpdating,
    isDownloading,
    error: reduxError,
  } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user); // Assuming admin user info is here
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams(); // Order ID from URL

  const [downloadingItemId, setDownloadingItemId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const fetchOrderData = useCallback(() => {
    dispatch(clearErrors()); // Clear previous errors first
    if (id && isAdmin) {
      dispatch(getOrderDetails(id));
    } else if (!isAdmin && user) {
      // Check if user exists but is not admin
      toast.error("Access Denied: Admin privileges required.");
      navigate("/"); // Redirect non-admins with message
    } else if (!user) {
      // If user data isn't loaded yet, maybe wait or handle appropriately
      // For now, assume ProtectedAdminRoute handles unauthenticated access
      console.warn("Admin check failed: User data not available.");
    }
  }, [dispatch, id, isAdmin, navigate, user]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]); // Fetch on mount/id change

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
      if (
        reduxError.includes("not found") ||
        reduxError.includes("Forbidden")
      ) {
        navigate("/admin-orders"); // Redirect if order not found/accessible by admin
      }
      dispatch(clearErrors());
    }
  }, [reduxError, dispatch, navigate]);

  const handleDownloadDesignClick = (item) => {
    if (!item?._id || isDownloading || !order?._id) return;
    setDownloadingItemId(item._id);

    dispatch(adminGetDesignDataForDownload(order._id, item._id))
      .then((designData) => {
        if (designData) {
          return DesignDownloader.downloadSingleDesign(designData);
        } else {
          // Action should have handled the error toast, but log just in case
          console.error("Failed to get design data payload from action.");
          throw new Error("Design data missing."); // Throw to trigger catch
        }
      })
      .then(() =>
        toast.success(`Design package for item ${item._id.slice(-6)} started!`)
      )
      .catch((err) => {
        console.error("Download initiation failed:", err);
        // Error toast likely handled by action/interceptor, no need to double toast
      })
      .finally(() => setDownloadingItemId(null));
  };

  const handleUpdateStatusSubmit = (selectedStatus) => {
    if (!order?._id || selectedStatus === order.status || isUpdating) {
      setShowStatusModal(false);
      return;
    }
    dispatch(adminUpdateOrderStatus(order._id, selectedStatus))
      .then(() => {
        setShowStatusModal(false);
        // State updates handled by Redux reducer, no need to manually setOrder
      })
      .catch(() => {
        // Error handled by action/toast
        setShowStatusModal(false); // Close modal even on error
      });
  };

  // Render Logic
  if (isDetailLoading && !order) return <Loader />; // Show loader only if order is not yet loaded

  // Order not found or error state after loading attempt
  if (!order && !isDetailLoading) {
    return (
      <div className="p-6 text-center max-w-2xl mx-auto">
        {reduxError && ( // Display error if fetch failed
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4 flex items-center justify-center gap-2">
            <AlertTriangle size={20} />
            <span>{reduxError}</span>
          </div>
        )}
        <Info size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-4">
          Could not load details for Order ID: {id}
        </p>
        <Link
          to="/admin-orders"
          className="text-blue-600 hover:underline inline-flex items-center"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Orders List
        </Link>
      </div>
    );
  }

  // Data is available, proceed with rendering
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
          />{" "}
          Back to Orders List
        </Link>
        <button
          onClick={fetchOrderData}
          disabled={isDetailLoading || isUpdating}
          className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
          title="Refresh Order"
        >
          <RefreshCw
            size={18}
            className={isDetailLoading || isUpdating ? "animate-spin" : ""}
          />
        </button>
      </div>

      {/* Order Summary Box */}
      <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <ShoppingBag size={24} className="text-blue-600" /> Order #
              {order._id?.slice(-8)}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {order.createdAt
                ? format(new Date(order.createdAt), "PP 'at' p")
                : "N/A"}
            </p>
          </div>
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
            <button
              onClick={() => setShowStatusModal(true)}
              disabled={isUpdating}
              className="w-full md:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center transition-colors disabled:bg-blue-400"
            >
              <Edit size={14} className="mr-1.5" /> Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Customer & Shipping Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600" /> Customer
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
              {order.shippingAddress?.country || "(Country Missing!)"}{" "}
              {order.shippingAddress?.postalCode}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-gray-600">
              <Phone size={14} /> {order.shippingAddress?.phoneNumber}
            </p>
            {/* Highlight missing country if validation was bypassed */}
            {!order.shippingAddress?.country && (
              <p className="text-red-500 text-xs mt-1">
                (Warning: Country missing)
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
          {cartItems.map((item) => (
            <div
              key={item._id || Math.random()}
              className="bg-white rounded-lg shadow p-4 border border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                {/* Image Col */}
                <div className="md:col-span-2 aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                  {item.designImage?.url ? (
                    <img
                      src={item.designImage.url}
                      alt={item.DesignTitle || "Design"}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <AlertTriangle
                      size={32}
                      className="text-red-400"
                      title="Design URL Missing!"
                    />
                  )}{" "}
                  {/* Highlight missing URL */}
                </div>
                {/* Info Col */}
                <div className="md:col-span-6">
                  <h3 className="text-md font-semibold">
                    {item.DesignTitle || "N/A"}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Item ID: {item._id || "N/A"}
                  </p>
                  {/* Highlight missing URL */}
                  {!item.designImage?.url && (
                    <p className="text-red-500 text-xs mt-1">
                      (Warning: Design URL missing! Download may fail.)
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      Type: {item.ProductType || "N/A"}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      Color: {item.ProductColor || "N/A"}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      Size: {item.size || "N/A"}
                    </span>
                  </div>
                  <details className="mt-3 text-xs cursor-pointer">
                    <summary className="font-medium text-gray-600 hover:text-black">
                      Design Specs
                    </summary>
                    <div className="mt-1 bg-gray-50 p-2 rounded border">
                      Pos:({item.designSpecs?.positionX ?? "?"}%,{" "}
                      {item.designSpecs?.positionY ?? "?"}%) | Scale:{" "}
                      {item.designSpecs?.scale ?? "?"}x | Rot:{" "}
                      {item.designSpecs?.rotation ?? "?"}°
                    </div>
                  </details>
                </div>
                {/* Actions/Price Col */}
                <div className="md:col-span-4 text-left md:text-right">
                  <p className="text-sm text-gray-600">
                    EGP {(item.price ?? 0).toFixed(2)} x {item.qty || 1}
                  </p>
                  <p className="text-md font-semibold mt-1">
                    Item Total: EGP{" "}
                    {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                  <div className="mt-3 flex flex-col md:items-end gap-2">
                    <button
                      onClick={() => handleDownloadDesignClick(item)}
                      disabled={
                        !item.designImage?.url ||
                        (isDownloading && downloadingItemId === item._id)
                      } // Disable if URL missing
                      className={`w-full md:w-auto px-3 py-1.5 rounded text-sm flex items-center justify-center transition-colors ${
                        !item.designImage?.url ||
                        (isDownloading && downloadingItemId === item._id)
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                      title={
                        !item.designImage?.url
                          ? "Cannot download: Design URL missing"
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
                    <button
                      disabled
                      className="w-full md:w-auto px-3 py-1.5 bg-gray-300 text-gray-600 rounded text-sm flex items-center justify-center cursor-not-allowed"
                      title="Print file feature not available"
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
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock size={18} className="text-blue-600" /> Order History
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto text-sm pr-2">
            {order.statusHistory?.length > 0 ? (
              [...order.statusHistory].reverse().map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      i === 0 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium text-gray-700">{s.status}</p>
                    <p className="text-xs text-gray-500">
                      {s.timestamp
                        ? format(new Date(s.timestamp), "PPp")
                        : "N/A"}
                      {s.updatedBy && ` by ${s.updatedBy.split(":")[0]}`}
                    </p>
                    {s.details && (
                      <p className="text-xs text-gray-600 mt-0.5 bg-gray-50 p-1 rounded italic">
                        "{s.details}"
                      </p>
                    )}
                  </div>
                </div>
              ))
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
        onUpdate={handleUpdateStatusSubmit}
        availableStatuses={ORDER_STATUSES} // Pass the constants
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default AdminOrderDetails;
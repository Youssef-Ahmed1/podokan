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
  Image as ImageIcon,
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
import { ORDER_STATUSES } from "../../constants/orderStatuses";
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
  Tooltip,
} from "@mui/material";

const StatusUpdateModal = ({
  open,
  onClose,
  currentStatus,
  onUpdate,
  availableStatuses,
  isUpdating,
}) => {
  const [newStatus, setNewStatus] = useState(currentStatus);

  useEffect(() => {
    if (open) setNewStatus(currentStatus);
  }, [open, currentStatus]);

  const handleUpdateClick = () => {
    if (newStatus && newStatus !== currentStatus && !isUpdating)
      onUpdate(newStatus);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1, fontSize: "1.1rem" }}>
        Update Order Status
      </DialogTitle>
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
          MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
        >
          {Object.values(availableStatuses).map((s) => (
            <MenuItem key={s} value={s} sx={{ fontSize: "0.9rem" }}>
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
          disabled={isUpdating || newStatus === currentStatus || !newStatus}
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

const AdminOrderDetails = () => {
  const {
    order,
    isDetailLoading,
    isUpdating,
    isDownloading,
    error: reduxError,
  } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [downloadingItemId, setDownloadingItemId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const fetchOrderData = useCallback(() => {
    dispatch(clearErrors());
    if (!isAdmin) {
      toast.error("Access Denied: Admin privileges required.");
      navigate("/admin/dashboard");
      return;
    }
    if (id && id !== "undefined") {
      dispatch(getOrderDetails(id));
    } else {
      toast.error("Order ID is missing or invalid.");
      navigate("/admin-orders");
    }
  }, [dispatch, id, isAdmin, navigate]);

  useEffect(() => {
    fetchOrderData();
  }, [fetchOrderData]);

  useEffect(() => {
    if (order) {
      const checkAllItemFields = (cart) => {
        if (!Array.isArray(cart)) return false;
        return cart.every(
          (item) =>
            item &&
            item._id &&
            item.DesignTitle &&
            item.ProductType &&
            item.ProductColor &&
            item.size &&
            item.price != null &&
            item.qty &&
            item.designImage?.url
        );
      };
      console.log("Admin Order Details - Rendered Data Check:", {
        orderId: order._id,
        status: order.status,
        hasUserData: !!order.user?._id && !!order.user?.name,
        cartItemsCount: order.cart?.length || 0,
        hasValidCart: Array.isArray(order.cart),
        hasAllItemFields: checkAllItemFields(order.cart),
        hasShippingAddress:
          !!order.shippingAddress?.address1 &&
          !!order.shippingAddress?.city &&
          !!order.shippingAddress?.country,
      });
    }
  }, [order]);

  useEffect(() => {
    if (reduxError && !isDetailLoading) {
      toast.error(`Error: ${reduxError}`);
      if (
        reduxError.toLowerCase().includes("not found") ||
        reduxError.toLowerCase().includes("forbidden") ||
        reduxError.toLowerCase().includes("invalid order id")
      ) {
        navigate("/admin-orders");
      }
      dispatch(clearErrors());
    }
  }, [reduxError, dispatch, navigate, isDetailLoading]);

  const handleDownloadDesignClick = async (item) => {
    if (!item?._id || !order?._id || isDownloading || downloadingItemId) return;
    if (!item.designImage?.url) {
      toast.error("Cannot download: Design image URL is missing.");
      return;
    }
    setDownloadingItemId(item._id);
    toast.info(
      `Preparing download package for "${item.DesignTitle || "item"}"...`
    );
    try {
      const designData = await dispatch(
        adminGetDesignDataForDownload(order._id, item._id)
      );
      if (!designData || !designData.imageUrl)
        throw new Error("Failed to retrieve valid data for download.");
      await DesignDownloader.downloadSingleDesign(designData);
    } catch (err) {
      console.error("Design download failed:", err);
      toast.error(`Download failed: ${err.message || "Unknown error"}`);
    } finally {
      setDownloadingItemId(null);
    }
  };

  const handleUpdateStatusSubmit = (selectedStatus) => {
    if (!order?._id || selectedStatus === order.status || isUpdating) {
      setShowStatusModal(false);
      return;
    }
    dispatch(adminUpdateOrderStatus(order._id, selectedStatus))
      .then(() => setShowStatusModal(false))
      .catch(() => setShowStatusModal(false));
  };

  if (isDetailLoading && !order) return <Loader />;

  if (!order && !isDetailLoading) {
    return (
      <div className="p-6 text-center max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center items-center">
        {reduxError && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4 flex items-center justify-center gap-2 shadow-sm border border-red-200">
            <AlertTriangle size={20} /> <span>{reduxError}</span>
          </div>
        )}
        <Info size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Order Details Unavailable</h2>
        <p className="text-gray-600 mb-4">
          {reduxError
            ? "An error occurred."
            : `Could not load details for Order ID: ${id}.`}
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

  const safeOrder = order || {};
  const cartItems = Array.isArray(safeOrder.cart) ? safeOrder.cart : [];
  const subtotal = safeOrder.subtotal ?? 0;
  const shipping = safeOrder.shippingCost ?? 0;
  const total = safeOrder.totalPrice ?? subtotal + shipping;
  const currentStatus = safeOrder.status || "Unknown";
  const shippingAddress = safeOrder.shippingAddress || {};
  const paymentInfo = safeOrder.paymentInfo || {};
  const customerInfo = safeOrder.user || {};
  const statusHistory = safeOrder.statusHistory || [];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
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
        <Tooltip title="Refresh Order Details">
          <IconButton
            onClick={fetchOrderData}
            disabled={isDetailLoading || isUpdating || isDownloading}
            size="small"
            sx={{
              bgcolor: "primary.lighter",
              "&:hover": { bgcolor: "primary.light" },
            }}
          >
            <RefreshCw
              size={18}
              className={isDetailLoading ? "animate-spin" : ""}
            />
          </IconButton>
        </Tooltip>
      </div>

      <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag size={24} className="text-blue-600 flex-shrink-0" />{" "}
              Order #{safeOrder._id?.slice(-8) || "N/A"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Placed:{" "}
              {safeOrder.createdAt
                ? format(new Date(safeOrder.createdAt), "PP 'at' p")
                : "N/A"}
            </p>
            <p className="text-gray-500 text-sm">
              Total:{" "}
              <span className="font-bold text-gray-700">
                EGP {total.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  currentStatus === ORDER_STATUSES.PROCESSING
                    ? "bg-blue-100 text-blue-800"
                    : currentStatus === ORDER_STATUSES.DELIVERED
                    ? "bg-green-100 text-green-800"
                    : currentStatus === ORDER_STATUSES.CANCELLED ||
                      currentStatus === ORDER_STATUSES.REFUND_REJECTED
                    ? "bg-red-100 text-red-800"
                    : currentStatus?.includes("Refund")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentStatus}
              </span>
            </div>
            <Button
              onClick={() => setShowStatusModal(true)}
              disabled={isUpdating || !safeOrder._id}
              variant="contained"
              size="small"
              startIcon={
                isUpdating ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Edit size={14} />
                )
              }
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <UserIcon size={18} className="text-blue-600" /> Customer Details
          </h2>
          {customerInfo._id ? (
            <div className="space-y-1 text-sm">
              <p>
                <strong className="text-gray-600 w-20 inline-block">
                  Name:
                </strong>{" "}
                {customerInfo.name || "(No name)"}
              </p>
              <p>
                <strong className="text-gray-600 w-20 inline-block">
                  Email:
                </strong>{" "}
                {customerInfo.email || "(No email)"}
              </p>
              <p>
                <strong className="text-gray-600 w-20 inline-block">
                  User ID:
                </strong>{" "}
                {customerInfo._id}
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 p-3 rounded-md text-yellow-700 border border-yellow-200 flex items-center gap-2 text-sm">
              <AlertTriangle size={18} />
              <span>Customer data missing/incomplete.</span>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MapPin size={18} className="text-blue-600" /> Shipping Address
          </h2>
          {shippingAddress.address1 ||
          shippingAddress.city ||
          shippingAddress.country ? (
            <div className="space-y-1 text-sm">
              <p>
                {shippingAddress.address1 || "(Missing Address 1)"}
                {shippingAddress.address2
                  ? `, ${shippingAddress.address2}`
                  : ""}
              </p>
              <p>
                {shippingAddress.city || "(Missing City)"},{" "}
                {shippingAddress.country || "(Missing Country)"}{" "}
                {shippingAddress.postalCode || ""}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-gray-600">
                <Phone size={14} />{" "}
                {shippingAddress.phoneNumber || "(Missing Phone)"}
              </p>
              {!shippingAddress.address1 && (
                <p className="text-red-500 text-xs mt-1">
                  (Warning: Address 1 missing)
                </p>
              )}
              {!shippingAddress.city && (
                <p className="text-red-500 text-xs mt-1">
                  (Warning: City missing)
                </p>
              )}
              {!shippingAddress.country && (
                <p className="text-red-500 text-xs mt-1">
                  (Warning: Country missing)
                </p>
              )}
              {!shippingAddress.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  (Warning: Phone missing)
                </p>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 p-3 rounded-md text-yellow-700 border border-yellow-200 flex items-center gap-2 text-sm">
              <AlertTriangle size={18} />
              <span>Shipping address data missing.</span>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Items ({cartItems.length})
        </h2>
        <div className="space-y-4">
          {cartItems.length > 0 ? (
            cartItems.map((item, index) => (
              <div
                key={item._id || `item-${index}`}
                className="bg-white rounded-lg shadow p-4 border border-gray-100"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-2 aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border relative">
                    {item.designImage?.url ? (
                      <img
                        src={item.designImage.url}
                        alt={item.DesignTitle || "Design"}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextElementSibling.style.display =
                            "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 flex-col items-center justify-center text-center text-gray-400 p-1 bg-gray-100 ${
                        item.designImage?.url ? "hidden" : "flex"
                      }`}
                    >
                      <ImageIcon size={32} />
                      <p className="text-xs mt-1">
                        {item.designImage?.url ? "Load Error" : "No Image URL"}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-6">
                    <h3 className="text-md font-semibold text-gray-800">
                      {item.DesignTitle || "(No Title)"}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Item ID: {item._id || "N/A"}
                    </p>
                    {!item.designImage?.url && (
                      <p className="text-red-500 text-xs mt-1">
                        (Warning: Design URL missing!)
                      </p>
                    )}
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
                    <details className="mt-3 text-xs cursor-pointer group">
                      <summary className="font-medium text-gray-600 hover:text-black list-none flex items-center group-open:mb-1">
                        Design Specs{" "}
                        <span className="ml-1 transform group-open:rotate-90 transition-transform duration-150 ease-in-out">
                          →
                        </span>
                      </summary>
                      <div className="mt-1 bg-gray-50 p-2 rounded border text-gray-700 font-mono">
                        X: {item.designSpecs?.positionX ?? "?"}%, Y:{" "}
                        {item.designSpecs?.positionY ?? "?"}% <br /> Scale:{" "}
                        {item.designSpecs?.scale ?? "?"}x, Rot:{" "}
                        {item.designSpecs?.rotation ?? "?"}°
                      </div>
                    </details>
                  </div>
                  <div className="md:col-span-4 text-left md:text-right">
                    <p className="text-sm text-gray-600">
                      Unit Price: EGP {(item.price ?? 0).toFixed(2)}
                    </p>
                    <p className="text-md font-semibold mt-1">
                      Item Total: EGP{" "}
                      {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                    </p>
                    <div className="mt-4 flex flex-col md:items-end gap-2">
                      <Button
                        onClick={() => handleDownloadDesignClick(item)}
                        disabled={
                          !item.designImage?.url ||
                          isDownloading ||
                          downloadingItemId === item._id
                        }
                        variant="contained"
                        size="small"
                        startIcon={
                          isDownloading && downloadingItemId === item._id ? (
                            <CircularProgress size={14} color="inherit" />
                          ) : (
                            <Download size={14} />
                          )
                        }
                        fullWidth={false}
                        sx={{ width: { xs: "100%", md: "auto" } }}
                        title={
                          !item.designImage?.url
                            ? "URL missing"
                            : "Download Design Package (ZIP)"
                        }
                      >
                        {isDownloading && downloadingItemId === item._id
                          ? "Processing..."
                          : "Download Pkg"}
                      </Button>
                      <Button
                        disabled
                        variant="outlined"
                        size="small"
                        startIcon={<Printer size={14} />}
                        fullWidth={false}
                        sx={{ width: { xs: "100%", md: "auto" } }}
                        title="Print file generation unavailable"
                      >
                        Print File (N/A)
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 bg-white rounded-lg shadow border border-gray-100">
              <Package size={32} className="mx-auto mb-2" />
              No items found in this order.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-100">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CreditCard size={18} className="text-blue-600" /> Financial Summary
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium">{paymentInfo.type || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span
                className={`font-medium ${
                  paymentInfo.status?.toLowerCase() === "succeeded"
                    ? "text-green-600"
                    : paymentInfo.status === "Processing"
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}
              >
                {paymentInfo.status || "N/A"}
              </span>
            </div>
            {safeOrder.paidAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Paid At:</span>
                <span>{format(new Date(safeOrder.paidAt), "PPp")}</span>
              </div>
            )}
            {safeOrder.deliveredAt && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivered At:</span>
                <span>{format(new Date(safeOrder.deliveredAt), "PPp")}</span>
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
          <div className="space-y-3 max-h-60 overflow-y-auto text-sm pr-2 custom-scrollbar">
            {statusHistory.length > 0 ? (
              [...statusHistory].reverse().map((s, i) => (
                <div key={`history-${i}`} className="flex items-start gap-2">
                  <div className="flex flex-col items-center mt-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        i === 0 ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    ></div>
                    {i < statusHistory.length - 1 && (
                      <div className="w-px h-full bg-gray-200 mt-1 flex-grow min-h-[10px]"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 capitalize">
                      {s.status}
                    </p>
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
              ))
            ) : (
              <p className="text-gray-500">No status history recorded.</p>
            )}
          </div>
        </div>
      </div>

      <StatusUpdateModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={currentStatus}
        onUpdate={handleUpdateStatusSubmit}
        availableStatuses={ORDER_STATUSES}
        isUpdating={isUpdating}
      />
    </div>
  );
};

export default AdminOrderDetails;

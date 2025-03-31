// frontend/src/pages/Admin/AdminOrderDetails.jsx
import React, { useEffect, useState } from "react";
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
  MapPin,
  Phone,
  ShoppingBag,
  ArrowLeft,
  Info,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  adminUpdateOrderStatus,
  adminGetDesignDataForDownload,
  clearErrors,
} from "../../redux/actions/order";
import axios from "axios"; // Keep for direct fetch fallback
import { server } from "../../server";
import { DesignDownloader } from "../../utils/designDownload";
import Loader from "../../components/Layout/Loader";
import { ORDER_STATUSES } from "../../../../backend/constants/orderStatuses"; // Adjust path

const StatusUpdateModal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-500 hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
};

const AdminOrderDetails = () => {
  const {
    isUpdating,
    isDownloading,
    error: reduxError,
  } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingItemId, setDownloadingItemId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [localError, setLocalError] = useState(null);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  useEffect(() => {
    if (reduxError) {
      toast.error(reduxError);
      setLocalError(reduxError);
      dispatch(clearErrors());
    }
  }, [reduxError, dispatch]);

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setLocalError(null);
      setOrder(null);
      try {
        const token = localStorage.getItem("token");
        if (!isAdmin || !token) throw new Error("Admin auth required.");
        const { data } = await axios.get(`${server}/order/admin/order/${id}`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success && data.order) setOrder(data.order);
        else throw new Error(data.message || "Order not found");
      } catch (e) {
        const msg =
          e.response?.data?.message || e.message || "Failed to load details";
        setLocalError(msg);
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id, isAdmin]);

  const handleDownloadDesignClick = (item) => {
    if (!item?._id || isDownloading) return;
    setDownloadingItemId(item._id);
    dispatch(adminGetDesignDataForDownload(order._id, item._id))
      .then((data) => data && DesignDownloader.downloadSingleDesign(data))
      .then(() => toast.success("Design package started!"))
      .catch(() => {})
      .finally(() => setDownloadingItemId(null));
  };
  const handleUpdateStatusSubmit = () => {
    if (!newStatus || newStatus === order?.status || isUpdating) {
      setShowStatusModal(false);
      return;
    }
    dispatch(adminUpdateOrderStatus(order._id, newStatus))
      .then((updated) => {
        if (updated?.order) setOrder(updated.order);
        setShowStatusModal(false);
      })
      .catch(() => {});
  };

  if (isLoading) return <Loader />;
  if (localError && !order)
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4 flex items-center justify-center gap-2">
          <AlertTriangle size={20} />
          <span>{localError}</span>
        </div>
        <Link to="/admin-orders" className="text-blue-600 hover:underline">
          <ArrowLeft size={16} className="inline mr-1" /> Back
        </Link>
      </div>
    );
  if (!order)
    return (
      <div className="p-6 text-center">
        <Info size={48} className="mx-auto text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p>ID: {id}</p>
        <Link to="/admin-orders" className="text-blue-600 hover:underline mt-4">
          <ArrowLeft size={16} className="inline mr-1" /> Back
        </Link>
      </div>
    );

  const subtotal =
    order.subtotal ??
    order.cart?.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0) ??
    0;
  const shipping =
    order.shippingCost ?? order.shippingAddress?.shippingPrice ?? 0;
  const total = order.totalPrice ?? subtotal + shipping;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto font-sans bg-gray-50 min-h-screen">
      <Link
        to="/admin-orders"
        className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 group text-sm font-medium"
      >
        <ArrowLeft size={18} className="mr-1 group-hover:-translate-x-1" /> Back
        to List
      </Link>
      <div className="bg-white rounded-lg shadow p-5 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold flex items-center">
              <ShoppingBag size={24} className="mr-2 text-blue-600" /> Order #
              {order._id.slice(-8)}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {format(new Date(order.createdAt), "PPp")}
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
                    : order.status.includes("Refund")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {order.status}
              </span>
            </div>
            <button
              onClick={() => {
                setNewStatus(order.status);
                setShowStatusModal(true);
              }}
              className="w-full md:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium flex items-center justify-center"
            >
              <Edit size={14} className="mr-1.5" /> Update Status
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <UserIcon size={18} className="mr-2 text-blue-600" /> Customer
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              <strong className="text-gray-600 w-16 inline-block">Name:</strong>{" "}
              {order.user?.name}
            </p>
            <p>
              <strong className="text-gray-600 w-16 inline-block">
                Email:
              </strong>{" "}
              {order.user?.email}
            </p>
            <p>
              <strong className="text-gray-600 w-16 inline-block">ID:</strong>{" "}
              {order.user?._id}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <MapPin size={18} className="mr-2 text-blue-600" /> Shipping
          </h2>
          <div className="space-y-1 text-sm">
            <p>
              {order.shippingAddress?.address1}
              {order.shippingAddress?.address2
                ? `, ${order.shippingAddress.address2}`
                : ""}
            </p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.country}{" "}
              {order.shippingAddress?.postalCode}
            </p>
            <p className="mt-1 flex items-center">
              <Phone size={14} className="mr-1.5 text-gray-500" />{" "}
              {order.shippingAddress?.phoneNumber}
            </p>
          </div>
        </div>
      </div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">
          Items ({order.cart?.length || 0})
        </h2>
        <div className="space-y-4">
          {order.cart.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg shadow p-4 border border-gray-100"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                <div className="md:col-span-2 aspect-square bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  {item.designImage?.url ? (
                    <img
                      src={item.designImage.url}
                      alt={item.DesignTitle}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <AlertTriangle size={32} className="text-gray-400" />
                  )}
                </div>
                <div className="md:col-span-6">
                  <h3 className="text-md font-semibold">{item.DesignTitle}</h3>
                  <p className="text-xs text-gray-500">Item ID: {item._id}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      Type: {item.ProductType}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      Color: {item.ProductColor}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                      Size: {item.size}
                    </span>
                  </div>
                  <div className="mt-3 bg-gray-50 p-2 rounded text-xs">
                    <h4 className="font-medium mb-1">Design Specs:</h4>
                    <p>
                      Pos:({item.designSpecs?.positionX ?? "?"}%,{" "}
                      {item.designSpecs?.positionY ?? "?"}%) | Scale:
                      {item.designSpecs?.scale ?? "?"}x | Rot:
                      {item.designSpecs?.rotation ?? "?"}°
                    </p>
                  </div>
                </div>
                <div className="md:col-span-4 text-left md:text-right">
                  <p className="text-sm text-gray-600">
                    EGP {item.price?.toFixed(2)} x {item.qty}
                  </p>
                  <p className="text-md font-semibold mt-1">
                    Item Total: EGP{" "}
                    {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                  <div className="mt-3 flex flex-col md:items-end gap-2">
                    <button
                      onClick={() => handleDownloadDesignClick(item)}
                      disabled={isDownloading && downloadingItemId === item._id}
                      className={`w-full md:w-auto px-3 py-1.5 rounded text-sm flex items-center justify-center ${
                        isDownloading && downloadingItemId === item._id
                          ? "bg-blue-300 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      }`}
                    >
                      {isDownloading && downloadingItemId === item._id ? (
                        <>
                          <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full mr-1.5"></span>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Download size={14} className="mr-1" />
                          Download Pkg
                        </>
                      )}
                    </button>
                    <button
                      disabled
                      className="w-full md:w-auto px-3 py-1.5 bg-gray-300 text-gray-600 rounded text-sm flex items-center justify-center cursor-not-allowed"
                    >
                      <Printer size={14} className="mr-1" /> Print File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <CreditCard size={18} className="mr-2 text-blue-600" /> Financials
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Method:</span>
              <span className="font-medium">{order.paymentInfo?.type}</span>
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
                {order.paymentInfo?.status}
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
            <div className="flex justify-between pt-1 border-t font-bold text-md">
              <span>Total:</span>
              <span>EGP {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <h2 className="text-lg font-semibold mb-3 flex items-center">
            <Clock size={18} className="mr-2 text-blue-600" /> History
          </h2>
          <div className="space-y-3 max-h-60 overflow-y-auto text-sm pr-2">
            {order.statusHistory?.length > 0 ? (
              [...order.statusHistory].reverse().map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full ${
                      i === 0 ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium">{s.status}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(s.timestamp), "PPp")} by {s.updatedBy}
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
              <p className="text-gray-500">No history.</p>
            )}
          </div>
        </div>
      </div>
      <StatusUpdateModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Status"
      >
        <>
          <label
            htmlFor="statusSelect"
            className="block text-sm font-medium mb-1"
          >
            New Status:
          </label>
          <select
            id="statusSelect"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
          >
            {Object.values(ORDER_STATUSES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex justify-end mt-6 gap-3">
            <button
              type="button"
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatusSubmit}
              disabled={isUpdating || newStatus === order.status}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium flex items-center justify-center disabled:bg-blue-300 hover:bg-blue-700 min-w-[100px]"
            >
              {isUpdating ? (
                <Loader />
              ) : (
                <>
                  <Check size={16} className="mr-1" /> Update
                </>
              )}
            </button>
          </div>
        </>
      </StatusUpdateModal>
    </div>
  );
};

export default AdminOrderDetails;

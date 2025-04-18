// File: frontend/src/components/User/UserOrderDetails.jsx
import React, { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Clock,
  Truck,
  CreditCard,
  ArrowLeft,
  AlertTriangle,
  Info,
  ShoppingBag,
  MapPin,
  Phone,
  Package as PackageIcon,
  ImageOff,
} from "lucide-react";
import { toast } from "react-toastify";
import { getOrderDetails, clearErrors } from "../redux/actions/order"; // Adjust path
import Loader from "../components/Layout/Loader"; // Adjust path
import styles from "../styles/styles"; // Adjust path
import { ORDER_STATUSES } from "../constants/orderStatuses"; // Adjust path

const UserOrderDetails = () => {
  const {
    order: currentOrder,
    isDetailLoading,
    error: detailError,
  } = useSelector((state) => state.order);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchOrder = useCallback(() => {
    dispatch(clearErrors());
    if (!isAuthenticated) {
      toast.info("Login required.");
      navigate("/login");
      return;
    }
    if (id && id !== "undefined") dispatch(getOrderDetails(id));
    else {
      toast.error("Invalid order ID.");
      navigate("/profile");
    }
  }, [dispatch, id, isAuthenticated, navigate]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  useEffect(() => {
    if (detailError) {
      if (!isDetailLoading) toast.error(detailError);
      if (
        detailError.includes("not found") ||
        detailError.includes("forbidden") ||
        detailError.includes("invalid")
      )
        navigate("/profile");
      dispatch(clearErrors());
    }
    // Check if fetched order belongs to the current user after loading
    if (
      !isDetailLoading &&
      currentOrder &&
      user &&
      currentOrder.user?._id !== user._id
    ) {
      toast.error("You are not authorized to view this order.");
      navigate("/profile");
    }
  }, [detailError, dispatch, navigate, isDetailLoading, currentOrder, user]);

  if (isDetailLoading && !currentOrder) return <Loader />;
  if (!currentOrder && !isDetailLoading)
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        {detailError && (
          <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-4 flex items-center justify-center gap-2 shadow-sm border border-red-200">
            <AlertTriangle size={20} />
            <span>{detailError}</span>
          </div>
        )}
        <Info size={48} className="mx-auto text-orange-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Order Unavailable</h2>
        <p className="text-gray-600 mt-2">
          {detailError
            ? "Error loading order."
            : "Could not load requested order."}
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center mt-6 text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" /> My Orders
        </Link>
      </div>
    );

  const safeOrder = currentOrder || {};
  const {
    subtotal = 0,
    shippingCost = 0,
    totalPrice = 0,
    status: currentStatus = "Unknown",
  } = safeOrder;
  const cartItems = Array.isArray(safeOrder.cart) ? safeOrder.cart : [];

  const getStatusColor = (status) => {
    /* As defined previously */
    switch (status) {
      case ORDER_STATUSES.PROCESSING:
        return "bg-blue-100 text-blue-800";
      case ORDER_STATUSES.TRANSFERRED:
      case ORDER_STATUSES.SHIPPING:
      case ORDER_STATUSES.RECEIVED:
      case ORDER_STATUSES.ON_THE_WAY:
        return "bg-purple-100 text-purple-800";
      case ORDER_STATUSES.DELIVERED:
        return "bg-green-100 text-green-800";
      case ORDER_STATUSES.CANCELLED:
      case ORDER_STATUSES.REFUND_REJECTED:
        return "bg-red-100 text-red-800";
      case ORDER_STATUSES.PROCESSING_REFUND:
      case ORDER_STATUSES.REFUND_APPROVED:
      case ORDER_STATUSES.REFUND_SUCCESS:
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className={`${styles.section} py-8 font-sans`}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            to="/profile"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium group"
          >
            <ArrowLeft
              size={18}
              className="mr-1 group-hover:-translate-x-1 transition-transform"
            />{" "}
            My Orders
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">
            Order Details
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-600 shrink-0" />{" "}
                Order #{safeOrder._id?.slice(-8) || "N/A"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Placed:{" "}
                {safeOrder.createdAt
                  ? format(new Date(safeOrder.createdAt), "PP 'at' p")
                  : "N/A"}
              </p>
            </div>
            <div className="mt-2 md:mt-0 text-left md:text-right">
              <p className="text-sm text-gray-600 mb-1">Status:</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  currentStatus
                )}`}
              >
                {currentStatus}
              </span>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-2">
                Total: EGP {totalPrice.toFixed(2)}
              </p>
            </div>
          </div>
          {/* Tracking Link Logic */}
          {safeOrder._id &&
            ![
              ORDER_STATUSES.PROCESSING,
              ORDER_STATUSES.CANCELLED,
              ORDER_STATUSES.PROCESSING_REFUND,
              ORDER_STATUSES.REFUND_APPROVED,
              ORDER_STATUSES.REFUND_REJECTED,
              ORDER_STATUSES.REFUND_SUCCESS,
              ORDER_STATUSES.DELIVERED,
            ].includes(currentStatus) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to={`/user/track/order/${safeOrder._id}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Truck size={16} className="mr-1.5" /> Track
                </Link>
              </div>
            )}
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Items ({cartItems.length})
          </h2>
          <div className="space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item, index) => (
                <div
                  key={item._id || `item-${index}`}
                  className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row gap-4 items-start"
                >
                  <div className="w-full sm:w-24 h-24 shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                    {item.designImage?.url ? (
                      <img
                        src={item.designImage.url}
                        alt={item.DesignTitle || "Design"}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-full h-full flex-col items-center justify-center text-center text-gray-400 ${
                        item.designImage?.url ? "hidden" : "flex"
                      } p-1`}
                    >
                      <ImageOff
                        size={24}
                        title={
                          item.designImage?.url ? "Load Error" : "URL Missing"
                        }
                      />
                      <span className="text-xs block mt-1">
                        {item.designImage?.url ? "Img Error" : "No Image"}
                      </span>
                    </div>
                  </div>
                  <div className="grow">
                    <h3 className="text-md font-semibold text-gray-800 mb-1 leading-snug">
                      {item.DesignTitle || "(No Title)"}
                    </h3>
                    <p className="text-xs text-gray-500 mb-1">
                      Type: {item.ProductType || "N/A"}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mb-2">
                      <span className="font-medium text-gray-700">
                        Color:{" "}
                        <span className="font-normal text-gray-600">
                          {item.ProductColor || "N/A"}
                        </span>
                      </span>
                      <span className="font-medium text-gray-700">
                        Size:{" "}
                        <span className="font-normal text-gray-600">
                          {item.size || "N/A"}
                        </span>
                      </span>
                    </div>
                    {item.designSpecs && (
                      <details className="mt-2 text-xs cursor-pointer group">
                        <summary className="font-medium text-gray-600 hover:text-black list-none flex items-center group-open:mb-1">
                          Specs{" "}
                          <span className="ml-1 transform group-open:rotate-90 transition-transform">
                            →
                          </span>
                        </summary>
                        <div className="mt-1 bg-gray-50 p-2 rounded border text-gray-700 font-mono text-[11px]">
                          X: {item.designSpecs.positionX ?? "?"}% | Y:{" "}
                          {item.designSpecs.positionY ?? "?"}% | Scale:{" "}
                          {item.designSpecs.scale ?? "?"}x | Rot:{" "}
                          {item.designSpecs.rotation ?? "?"}°
                        </div>
                      </details>
                    )}
                  </div>
                  <div className="w-full sm:w-auto text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                    <p className="text-sm text-gray-600">
                      EGP {(item.price ?? 0).toFixed(2)} x {item.qty || 1}
                    </p>
                    <p className="text-md font-semibold text-gray-800 mt-1">
                      EGP {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
                <PackageIcon size={32} className="mx-auto mb-2" />
                No items.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="text-blue-600 shrink-0" size={18} /> Shipping
            </h3>
            {safeOrder.shippingAddress ? (
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  {safeOrder.shippingAddress.address1 || "(No Addr 1)"}
                  {safeOrder.shippingAddress.address2
                    ? `, ${safeOrder.shippingAddress.address2}`
                    : ""}
                </p>
                <p>
                  {safeOrder.shippingAddress.city || "(No city)"},{" "}
                  {safeOrder.shippingAddress.country || "(No country)"}{" "}
                  {safeOrder.shippingAddress.postalCode || ""}
                </p>
                <p className="flex items-center pt-1 gap-1.5">
                  <Phone size={14} className="text-gray-500 shrink-0" />{" "}
                  {safeOrder.shippingAddress.phoneNumber || "(No phone)"}
                </p>
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Address missing.</div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="text-blue-600 shrink-0" size={18} />{" "}
              Payment
            </h3>
            {safeOrder.paymentInfo ? (
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-500">Method:</p>
                  <p className="font-medium text-gray-700">
                    {safeOrder.paymentInfo.type || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Status:</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      safeOrder.paymentInfo.status?.toLowerCase() ===
                      "succeeded"
                        ? "bg-green-100 text-green-800"
                        : safeOrder.paymentInfo.status === "Processing"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {safeOrder.paymentInfo.status || "N/A"}
                  </span>
                </div>
                {safeOrder.paidAt && (
                  <div>
                    <p className="text-gray-500">Paid On:</p>
                    <p className="font-medium text-gray-700">
                      {format(new Date(safeOrder.paidAt), "PPp")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Payment info missing.</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>EGP {shippingCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-800 font-bold pt-2 border-t border-gray-200 mt-2 text-md">
              <span>Total</span>
              <span>EGP {totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {safeOrder.statusHistory?.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Clock className="text-blue-600 shrink-0" size={18} /> History
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {[...safeOrder.statusHistory].reverse().map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="flex flex-col items-center mt-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        i === 0 ? "bg-blue-500" : "bg-gray-300"
                      }`}
                    ></div>
                    {i < safeOrder.statusHistory.length - 1 && (
                      <div className="w-px h-full bg-gray-200 mt-1 grow min-h-[10px]"></div>
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
                      <p className="text-xs text-gray-600 mt-0.5 italic bg-gray-50 p-1 rounded border border-gray-100">
                        "{s.details}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserOrderDetails;

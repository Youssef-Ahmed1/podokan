// frontend/src/pages/UserOrderDetails.jsx
import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrdersOfUser, clearErrors } from "../../redux/actions/order";
import Loader from "../../components/Layout/Loader";
import styles from "../../styles/styles";

const UserOrderDetails = () => {
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user?._id) {
      dispatch(getAllOrdersOfUser());
    }
  }, [dispatch, user?._id, isAuthenticated, navigate, error]);

  useEffect(() => {
    setCurrentOrder(orders?.find((order) => order._id === id) || null);
  }, [orders, id]);

  if (isLoading && !currentOrder) return <Loader />; // Show loader only if order isn't already found

  if (!currentOrder && !isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Info size={48} className="mx-auto text-orange-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Order Not Found</h2>
        <p className="text-gray-600 mt-2">
          Could not find details for order ID: {id}.
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center mt-6 text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Orders
        </Link>
      </div>
    );
  }

  // Ensure order exists before destructuring/calculating
  if (!currentOrder) return null; // Or a minimal loading/error state

  const subtotal =
    currentOrder.subtotal ??
    currentOrder.cart?.reduce((t, i) => t + (i.price || 0) * (i.qty || 1), 0) ??
    0;
  const shippingCost =
    currentOrder.shippingCost ??
    currentOrder.shippingAddress?.shippingPrice ??
    0;
  const total = currentOrder.totalPrice ?? subtotal + shippingCost;

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
            Back to My Orders
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-2">
            Order Details
          </h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center">
                <ShoppingBag size={20} className="mr-2 text-blue-600" /> Order #
                {currentOrder._id.slice(-8)}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Placed: {format(new Date(currentOrder.createdAt), "PP 'at' p")}
              </p>
            </div>
            <div className="mt-2 md:mt-0 text-left md:text-right">
              <p className="text-sm text-gray-600 mb-1">Status:</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  currentOrder.status === "Processing"
                    ? "bg-blue-100 text-blue-800"
                    : currentOrder.status === "Delivered"
                    ? "bg-green-100 text-green-800"
                    : currentOrder.status === "Cancelled"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentOrder.status}
              </span>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-2">
                Total: EGP {total.toFixed(2)}
              </p>
            </div>
          </div>
          {currentOrder.status !== "Processing" &&
            currentOrder.status !== "Cancelled" &&
            !currentOrder.status.includes("Refund") && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  to={`/user/track/order/${currentOrder._id}`}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Truck size={16} className="mr-1.5" /> Track Shipment
                </Link>
              </div>
            )}
        </div>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Items ({currentOrder.cart?.length || 0})
          </h2>
          <div className="space-y-4">
            {currentOrder.cart?.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row gap-4"
              >
                <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  {item.designImage?.url ? (
                    <img
                      src={item.designImage.url}
                      alt={item.DesignTitle}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <AlertTriangle size={24} className="text-gray-400" />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-md font-semibold text-gray-800 mb-1">
                    {item.DesignTitle || "N/A"}
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
                </div>
                <div className="w-full sm:w-auto text-left sm:text-right flex-shrink-0 mt-2 sm:mt-0">
                  <p className="text-sm text-gray-600">
                    EGP {item.price?.toFixed(2)} x {item.qty}
                  </p>
                  <p className="text-md font-semibold text-gray-800 mt-1">
                    EGP {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <MapPin className="mr-2 text-blue-600" size={18} /> Shipping
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                {currentOrder.shippingAddress?.address1 || ""}
                {currentOrder.shippingAddress?.address2
                  ? `, ${currentOrder.shippingAddress.address2}`
                  : ""}
              </p>
              <p>
                {currentOrder.shippingAddress?.city || ""},{" "}
                {currentOrder.shippingAddress?.country || ""}{" "}
                {currentOrder.shippingAddress?.postalCode || ""}
              </p>
              <p className="flex items-center pt-1">
                <Phone size={14} className="mr-1.5 text-gray-500" />{" "}
                {currentOrder.shippingAddress?.phoneNumber || "N/A"}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <CreditCard className="mr-2 text-blue-600" size={18} /> Payment
            </h3>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-500">Method:</p>
                <p className="font-medium text-gray-700">
                  {currentOrder.paymentInfo?.type || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Status:</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentOrder.paymentInfo?.status?.toLowerCase() ===
                    "succeeded"
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {currentOrder.paymentInfo?.status || "Processing"}
                </span>
              </div>
            </div>
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
              <span>EGP {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        {currentOrder.statusHistory &&
          currentOrder.statusHistory.length > 1 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="mr-2 text-blue-600" size={18} /> History
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {currentOrder.statusHistory
                  .slice()
                  .reverse()
                  .map((s, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div
                        className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          i === 0 ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      ></div>
                      <div>
                        <p className="font-medium text-gray-700">{s.status}</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(s.timestamp), "PPp")}
                        </p>
                        {s.details &&
                          !s.updatedBy?.includes("admin:") &&
                          !s.updatedBy?.includes("seller:") && (
                            <p className="text-xs text-gray-600 mt-0.5 italic bg-gray-50 p-1 rounded">
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

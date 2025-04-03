// frontend/src/pages/UserOrderDetails.jsx
import React, { useEffect } from "react";
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
import { getOrderDetails, clearErrors } from "../redux/actions/order"; // Adjust path if needed
import Loader from "../components/Layout/Loader"; // Adjust path if needed
import styles from "../styles/styles"; // Adjust path if needed

const UserOrderDetails = () => {
  const {
    order: currentOrder,
    isDetailLoading,
    error: detailError,
  } = useSelector((state) => state.order);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams(); // Order ID from URL

  // Effect to fetch order details
  useEffect(() => {
    dispatch(clearErrors()); // Clear previous errors on mount/ID change
    if (!isAuthenticated) {
      toast.info("Please login to view order details.");
      navigate("/login");
    } else if (id) {
      dispatch(getOrderDetails(id)); // Fetch details for the specific order
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, id, isAuthenticated, navigate]); // Re-run if these change

  // Effect to handle errors from the Redux state
  useEffect(() => {
    if (detailError) {
      toast.error(detailError);
      if (
        detailError.includes("not found") ||
        detailError.includes("Forbidden")
      ) {
        navigate("/profile"); // Redirect to orders list on critical errors
      }
      dispatch(clearErrors()); // Clear error after handling
    }
  }, [detailError, dispatch, navigate]);

  // --- Render Logic ---

  // Loading State
  if (isDetailLoading) {
    return <Loader />;
  }

  // Order Not Found or Error State
  if (!currentOrder && !isDetailLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <Info size={48} className="mx-auto text-orange-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Order Details Unavailable
        </h2>
        <p className="text-gray-600 mt-2">
          Could not load details for order ID: {id}. It may not exist or you may
          not have permission.
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center mt-6 text-blue-600 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to My Orders
        </Link>
      </div>
    );
  }

  // Calculations (safe with defaults)
  const subtotal = currentOrder.subtotal ?? 0;
  const shippingCost = currentOrder.shippingCost ?? 0;
  const total = currentOrder.totalPrice ?? subtotal + shippingCost;
  const cartItems = currentOrder.cart || [];

  return (
    <div className={`${styles.section} py-8 font-sans`}>
      {" "}
      {/* Ensure styles.section provides padding etc. */}
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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

        {/* Order Summary Box */}
        <div className="bg-white rounded-lg shadow-sm p-5 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 flex items-center gap-2">
                <ShoppingBag
                  size={20}
                  className="text-blue-600 flex-shrink-0"
                />{" "}
                Order #{currentOrder._id?.slice(-8) || "N/A"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Placed:{" "}
                {currentOrder.createdAt
                  ? format(new Date(currentOrder.createdAt), "PP 'at' p")
                  : "N/A"}
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
                    : currentOrder.status?.includes("Refund")
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentOrder.status || "Unknown"}
              </span>
              <p className="text-lg md:text-xl font-bold text-gray-800 mt-2">
                Total: EGP {total.toFixed(2)}
              </p>
            </div>
          </div>
          {/* Track Order Link */}
          {currentOrder.status !== "Processing" &&
            currentOrder.status !== "Cancelled" &&
            !currentOrder.status?.includes("Refund") && (
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

        {/* Items Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Items ({cartItems.length})
          </h2>
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item._id || Math.random()}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row gap-4 items-start"
              >
                <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                  {item.designImage?.url ? (
                    <>
                      <img
                        src={item.designImage.url}
                        alt={item.DesignTitle || "Design"}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          if (e.target.nextSibling)
                            e.target.nextSibling.style.display = "flex";
                        }}
                      />
                      {/* Fallback shown on error */}
                      <div className="w-full h-full items-center justify-center text-center text-gray-400 hidden">
                        <AlertTriangle size={24} />
                        <span className="text-xs block mt-1">
                          Image
                          <br />
                          Error
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-center text-gray-400">
                      <AlertTriangle size={24} title="Image URL Missing" />
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-md font-semibold text-gray-800 mb-1 leading-snug">
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
                    EGP {(item.price ?? 0).toFixed(2)} x {item.qty || 1}
                  </p>
                  <p className="text-md font-semibold text-gray-800 mt-1">
                    EGP {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping & Payment */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="text-blue-600 flex-shrink-0" size={18} />{" "}
              Shipping Address
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <p>
                {currentOrder.shippingAddress?.address1 || "N/A"}
                {currentOrder.shippingAddress?.address2
                  ? `, ${currentOrder.shippingAddress.address2}`
                  : ""}
              </p>
              <p>
                {currentOrder.shippingAddress?.city || "N/A"},{" "}
                {currentOrder.shippingAddress?.country || "N/A"}{" "}
                {currentOrder.shippingAddress?.postalCode || ""}
              </p>
              <p className="flex items-center pt-1 gap-1.5">
                <Phone size={14} className="text-gray-500 flex-shrink-0" />{" "}
                {currentOrder.shippingAddress?.phoneNumber || "N/A"}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <CreditCard className="text-blue-600 flex-shrink-0" size={18} />{" "}
              Payment Information
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
              {currentOrder.paidAt && (
                <div>
                  <p className="text-gray-500">Paid On:</p>
                  <p className="font-medium text-gray-700">
                    {format(new Date(currentOrder.paidAt), "PPp")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Order Summary
          </h3>
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

        {/* History */}
        {currentOrder.statusHistory &&
          currentOrder.statusHistory.length > 0 && (
            <div className="mt-6 bg-white rounded-lg shadow-sm p-5 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="text-blue-600 flex-shrink-0" size={18} />{" "}
                Order History
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {[...currentOrder.statusHistory].reverse().map((s, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div
                      className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        index === 0 ? "bg-blue-500" : "bg-gray-300"
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

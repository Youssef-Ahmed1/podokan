import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  Download,
  Clock,
  Package,
  Truck,
  CreditCard,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrdersOfUser } from "./../redux/actions/order";

const UserOrderDetails = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [currentOrder, setCurrentOrder] = useState(null);

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (orders?.length && id) {
      const foundOrder = orders.find((order) => order._id === id);
      if (foundOrder) {
        setCurrentOrder(foundOrder);
      } else {
        toast.error("Order not found");
      }
    }
  }, [orders, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
        <p className="text-gray-600 mt-2">
          The order you're looking for could not be found.
        </p>
        <Link
          to="/profile"
          className="inline-flex items-center mt-4 text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Orders
        </Link>
      </div>
    );
  }

  // Calculate order totals
  const subtotal =
    currentOrder.subtotal ||
    currentOrder.cart.reduce(
      (total, item) => total + item.price * (item.qty || 1),
      0
    );

  const shippingCost =
    currentOrder.shippingCost ||
    currentOrder.shippingAddress?.shippingPrice ||
    50;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header with Back Link */}
      <div className="mb-8">
        <Link
          to="/profile"
          className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft size={16} className="mr-1" />
          Back to Orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
      </div>

      {/* Order Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{currentOrder._id.slice(0, 8)}
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  currentOrder.status === "Processing"
                    ? "bg-blue-100 text-blue-800"
                    : currentOrder.status === "Delivered"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {currentOrder.status}
              </span>
              <span className="text-gray-500">
                {format(new Date(currentOrder.createdAt), "PPP")}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <span className="text-lg font-bold text-purple-600">
              Total: EGP {currentOrder.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="mr-2 text-purple-600" size={20} />
          Order Timeline
        </h2>
        <div className="space-y-4">
          <div className="flex">
            <div className="flex flex-col items-center mr-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div className="h-full w-0.5 bg-gray-200"></div>
            </div>
            <div>
              <p className="font-medium">Order Placed</p>
              <p className="text-gray-500 text-sm">
                {format(new Date(currentOrder.createdAt), "PPP p")}
              </p>
            </div>
          </div>

          {currentOrder.statusHistory?.map((status, index) => (
            <div key={index} className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div
                  className={`h-full w-0.5 ${
                    index === currentOrder.statusHistory.length - 1
                      ? "bg-white"
                      : "bg-gray-200"
                  }`}
                ></div>
              </div>
              <div>
                <p className="font-medium">{status.status}</p>
                <p className="text-gray-500 text-sm">
                  {format(new Date(status.timestamp), "PPP p")}
                </p>
                {status.details && (
                  <p className="text-gray-600 text-sm mt-1">{status.details}</p>
                )}
              </div>
            </div>
          ))}

          {currentOrder.deliveredAt && (
            <div className="flex">
              <div className="flex flex-col items-center mr-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div>
                <p className="font-medium">Delivered</p>
                <p className="text-gray-500 text-sm">
                  {format(new Date(currentOrder.deliveredAt), "PPP p")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Items */}
      {currentOrder.cart?.map((item) => (
        <div key={item._id} className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image with Design */}
            <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden">
              {item.designImage ? (
                <img
                  src={item.designImage?.url || item.designImage}
                  alt={item.DesignTitle || "Product Design"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <AlertTriangle size={48} className="text-gray-400" />
                  <span className="text-gray-400 ml-2">
                    No design preview available
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {item.DesignTitle || "Design"}
                </h2>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600">Product Type:</p>
                    <p className="font-medium capitalize">
                      {item.ProductType || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Size:</p>
                    <p className="font-medium">
                      {item.size && item.size !== "One Size"
                        ? item.size
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Color:</p>
                    <p className="font-medium">
                      {item.ProductColor && item.ProductColor !== "Default"
                        ? item.ProductColor
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-600">Quantity:</p>
                    <p className="font-medium">{item.qty || 1}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Shipping & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold">Shipping Details</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">
                {currentOrder.shippingAddress?.address1 || "N/A"}
              </p>
              {currentOrder.shippingAddress?.address2 && (
                <p className="text-gray-600">
                  {currentOrder.shippingAddress.address2}
                </p>
              )}
              <p className="text-gray-600 mt-2">
                {currentOrder.shippingAddress?.city || "N/A"},
                {currentOrder.shippingAddress?.country || "N/A"}
                {currentOrder.shippingAddress?.postalCode
                  ? ` ${currentOrder.shippingAddress.postalCode}`
                  : ""}
              </p>
              <p className="text-gray-600 mt-2">
                Phone: {currentOrder.shippingAddress?.phoneNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold">Payment Details</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Method:</p>
              <p className="font-medium mt-1">
                {currentOrder.paymentInfo?.type || "Cash On Delivery"}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Status:</p>
              <span
                className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                  currentOrder.paymentInfo?.status === "succeeded" ||
                  currentOrder.paymentInfo?.status === "Succeeded"
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
    </div>
  );
};

export default UserOrderDetails;

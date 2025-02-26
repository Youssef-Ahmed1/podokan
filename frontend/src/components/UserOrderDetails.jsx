// UserOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Package, Truck, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { toast } from "react-toastify";

const UserOrderDetails = () => {
  const {
    orders,
    isLoading,
    error: orderError,
  } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!user) {
          toast.error("Please login to view order details");
          return;
        }

        const result = await dispatch(getAllOrdersOfUser());
        if (!result?.success) {
          throw new Error(result?.message || "Failed to fetch orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
        } else {
          toast.error(err.message || "Failed to load order details");
        }
      }
    };

    fetchOrders();
  }, [dispatch, user, retryCount]);

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

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setError(null);
        await dispatch(getAllOrdersOfUser());
      } catch (err) {
        setError(err.message || "Failed to fetch order details");
        toast.error("Failed to fetch order details");
      } finally {
        setIsInitialLoading(false);
      }
    };

    if (user?._id) {
      fetchOrder();
    }
  }, [dispatch, user]);

  if (isLoading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Show error state
  if (orderError && !currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-600">{orderError}</p>
          <button
            onClick={() => setRetryCount(0)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!currentOrder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
      </div>
    );
  }

  // Calculate order totals with explicit shipping cost
  const subtotal = currentOrder.cart.reduce(
    (total, item) => total + item.price * (item.qty || 1),
    0
  );

  // Use stored shipping cost or default to 50
  const shippingCost =
    currentOrder.shippingCost ||
    currentOrder.shippingAddress?.shippingPrice ||
    50;

  const total = currentOrder.totalPrice || subtotal + shippingCost;

  // Render order details
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
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
                {new Date(currentOrder.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0">
            <span className="text-lg font-bold text-purple-600">
              Total: EGP {total.toFixed(2)}
            </span>
          </div>
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
                  src={
                    typeof item.designImage === "string"
                      ? item.designImage
                      : item.designImage.url
                  }
                  alt={item.DesignTitle || "Product Design"}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">
                    No design preview available
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {item.DesignTitle || "Untitled Design"}
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
                      {item.size &&
                      item.size !== "One Size" &&
                      item.size !== "Default"
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

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Item Price:</p>
                <p className="text-xl font-bold text-purple-600">
                  EGP {(item.price || 0).toFixed(2)}
                </p>
                {item.qty > 1 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Total: EGP{" "}
                    {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>EGP {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>EGP {shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t font-bold">
            <span>Total</span>
            <span>EGP {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

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

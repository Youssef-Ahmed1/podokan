// UserOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { Package, Truck, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { toast } from 'react-toastify';
const UserOrderDetails = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (user) {
      dispatch(getAllOrdersOfUser());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (orders && id) {
      const foundOrder = orders.find((order) => order._id === id);
      setCurrentOrder(foundOrder);
    }
  }, [orders, id]);


  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setError(null);
        await dispatch(getAllOrdersOfUser());
      } catch (err) {
        setError(err.message || 'Failed to fetch order details');
        toast.error('Failed to fetch order details');
      } finally {
        setIsInitialLoading(false);
      }
    };
  
    if (user?._id) {
      fetchOrder();
    }
  }, [dispatch, user]);

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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold">
          Order #{currentOrder._id.slice(0, 8)}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            currentOrder.status === "Processing" ? "bg-blue-100 text-blue-800" :
            currentOrder.status === "Delivered" ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {currentOrder.status}
          </span>
          <span className="text-gray-500">
            {new Date(currentOrder.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Product Details */}
      {currentOrder.cart.map((item) => (
        <div key={item._id} className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image with Design */}
            <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden">
  {item.designImage ? (
    <img
      src={typeof item.designImage === 'string' ? item.designImage : item.designImage.url}
      alt={item.DesignTitle}
      className="w-full h-full object-contain"
    />
  ) : (
    <div className="flex items-center justify-center h-full">
      <span className="text-gray-400">No design preview available</span>
    </div>
  )}
</div>



            {/* Product Info */}
            <div className="space-y-6">
  <div>
    <h2 className="text-2xl font-bold text-gray-900">
      {item.DesignTitle}
    </h2>
  </div>

  <div className="bg-gray-50 p-4 rounded-lg">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-gray-600">Product Type:</p>
        <p className="font-medium capitalize">{item.ProductType}</p>
      </div>
      <div>
        <p className="text-gray-600">Size:</p>
        <p className="font-medium">{item.size || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-600">Color:</p>
        <p className="font-medium">{item.ProductColor || 'N/A'}</p>
      </div>
      <div>
        <p className="text-gray-600">Quantity:</p>
        <p className="font-medium">{item.qty}</p>
      </div>
    </div>
  </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Price per item:</p>
                <p className="text-xl font-bold text-purple-600">
                  EGP {item.price?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Order Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
  <h3 className="text-xl font-bold mb-4">Order Summary</h3>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span className="text-gray-600">Subtotal</span>
      <span>EGP {(currentOrder.totalPrice - 50).toFixed(2)}</span>
    </div>
    <div className="flex justify-between">
      <span className="text-gray-600">Shipping</span>
      <span>EGP 50.00</span>
    </div>
    <div className="flex justify-between pt-2 border-t">
      <span className="font-bold">Total</span>
      <span className="font-bold">
        EGP {currentOrder.totalPrice.toFixed(2)}
      </span>
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
              <p className="font-medium">{currentOrder.shippingAddress?.address1}</p>
              {currentOrder.shippingAddress?.address2 && (
                <p className="text-gray-600">{currentOrder.shippingAddress.address2}</p>
              )}
              <p className="text-gray-600 mt-2">
                Phone: {currentOrder.shippingAddress?.phoneNumber}
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
              <p className="font-medium mt-1">{currentOrder.paymentInfo?.type}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Status:</p>
              <span className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                currentOrder.paymentInfo?.status === "succeeded" 
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {currentOrder.paymentInfo?.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetails;
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Truck, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { useParams } from "react-router-dom";

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();

  const order = orders?.find((item) => item._id === id);
  const cartItem = order?.cart?.[0];

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Helper function to construct Cloudinary URL correctly
  const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    return `https://res.cloudinary.com/dkot9tyjm/image/upload/${publicId}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold">
          Order #{order._id.slice(0, 8)}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            order.status === "Processing" ? "bg-blue-100 text-blue-800" :
            order.status === "Delivered" ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {order.status}
          </span>
          <span className="text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Product Details */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image with Design */}
          <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={`/${cartItem?.ProductType?.toLowerCase()}-${cartItem?.ProductColor?.toLowerCase()}.png`}
                className="w-full h-full object-contain"
                alt="Product base"
              />
              {cartItem?.designImage?.public_id && (
                <img
                  src={getCloudinaryUrl(cartItem.designImage.public_id)}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-w-[60%] max-h-[60%]"
                  style={{
                    mixBlendMode: cartItem?.ProductColor?.toLowerCase() === 'white' ? 'multiply' : 'screen'
                  }}
                  alt="Design"
                />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {cartItem?.DesignTitle}
              </h2>
            </div>

            {/* Product Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Product Type:</p>
                  <p className="font-medium capitalize">{cartItem?.ProductType}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Color:</p>
                  <p className="font-medium capitalize">{cartItem?.ProductColor}</p>
                </div>

                <div>
                  <p className="text-gray-600">Size:</p>
                  <p className="font-medium">{cartItem?.designSpecs?.size}</p>
                </div>

                <div>
                  <p className="text-gray-600">Quantity:</p>
                  <p className="font-medium">{cartItem?.qty}</p>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Total Price:</p>
              <p className="text-2xl font-bold text-purple-600">
                EGP {order.totalPrice?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold">Shipping Details</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{order.shippingAddress?.address1}</p>
              <p className="text-gray-600">{order.shippingAddress?.city}</p>
              <p className="text-gray-600">{order.shippingAddress?.phoneNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Package className="text-purple-600 w-5 h-5" />
              <span className="text-sm font-medium">
                Delivery date will be confirmed soon
              </span>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold">Payment Details</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Method:</p>
              <p className="font-medium mt-1">Cash On Delivery</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Status:</p>
              <span className="inline-block px-2 py-1 rounded-full text-sm mt-1 bg-yellow-100 text-yellow-800">
                Processing
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetails;
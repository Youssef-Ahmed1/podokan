import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Truck, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { useParams } from "react-router-dom";

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const order = orders?.find((item) => item._id === id);
  const cartItem = order?.cart?.[0];

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  // Helper function to construct proper Cloudinary URL
  const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    // Remove any existing URL structure and just use the public ID
    const cleanPublicId = publicId.split('/').pop();
    return `https://res.cloudinary.com/dkot9tyjm/image/upload/v1/${cleanPublicId}`;
  };

  // Helper function to get product base image
  const getProductBaseImage = (type, color) => {
    if (!type || !color) return null;
    return `/images/${type}-${color}-front.png`;
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 py-8 bg-gray-50"
    >
      {/* Order Header */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-900">
          Order #{order._id.slice(0, 8)}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            order.status === "Delivered" ? "bg-green-100 text-green-800" :
            order.status === "Processing" ? "bg-blue-100 text-blue-800" :
            "bg-gray-100 text-gray-800"
          }`}>
            {order.status}
          </span>
          <span className="text-gray-500">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>
      </motion.div>

      {/* Product Details */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-xl shadow-sm p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product Image with Design */}
            <div className="relative aspect-square rounded-lg bg-gray-50 overflow-hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isImageLoaded ? 1 : 0 }}
                className="relative w-full h-full"
              >
                {/* Base Product Image */}
                <img
                  src={getProductBaseImage(cartItem?.ProductType, cartItem?.ProductColor)}
                  className="w-full h-full object-contain"
                  alt="Product base"
                  onLoad={() => setIsImageLoaded(true)}
                  onError={(e) => {
                    e.target.src = '/fallback-product-image.png';
                    setImageError(true);
                  }}
                />

                {/* Design Overlay */}
                {cartItem?.designImage?.url && !imageError && (
                  <motion.img
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    src={getCloudinaryUrl(cartItem.designImage.url)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      maxWidth: '60%',
                      transform: `translate(-50%, -50%) 
                                scale(${cartItem.designSpecs?.scale || 1}) 
                                rotate(${cartItem.designSpecs?.rotation || 0}deg)`,
                      mixBlendMode: cartItem.ProductColor === 'white' ? 'multiply' : 'screen'
                    }}
                    alt="Design overlay"
                    onError={() => setImageError(true)}
                  />
                )}
              </motion.div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {cartItem?.DesignTitle || "Custom Design"}
                </h2>
                <p className="text-gray-500 mt-1">
                  {cartItem?.ProductType} - {cartItem?.ProductColor}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm text-gray-500">Size</span>
                  <p className="font-medium mt-1">{cartItem?.designSpecs?.size || "N/A"}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm text-gray-500">Quantity</span>
                  <p className="font-medium mt-1">{cartItem?.qty || 1}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500">Total Price</span>
                <p className="text-xl font-bold text-purple-600 mt-1">
                  EGP {order.totalPrice?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Truck className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold">Shipping Details</h3>
          </div>
          <div className="space-y-4">
            {order.shippingAddress && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{order.shippingAddress.address1}</p>
                <p className="text-gray-500">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p className="text-gray-500">{order.shippingAddress.phoneNumber}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Package className="text-purple-600 w-5 h-5" />
              <span className="text-sm font-medium">
                {order.estimatedDelivery 
                  ? `Estimated delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}`
                  : 'Delivery date will be confirmed soon'}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-purple-600 w-6 h-6" />
            <h3 className="text-lg font-semibold">Payment Details</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium mt-1">{order.paymentInfo?.type || "N/A"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Payment Status</p>
              <span className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                order.paymentInfo?.status === "Succeeded"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {order.paymentInfo?.status || "Pending"}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default UserOrderDetails;
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Truck, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { useParams } from "react-router-dom";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
  </div>
);

const UserOrderDetails = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  // Handle loading state
  if (isLoading || !orders) {
    return <LoadingSpinner />;
  }

  const order = orders.find((item) => item._id === id);
  
  // Handle case where order is not found
  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
      </div>
    );
  }

<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
  const cartItem = order.cart[0];
=======
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
  // Helper function to construct Cloudinary URL correctly
  const getCloudinaryUrl = (publicId) => {
    if (!publicId) return null;
    return `https://res.cloudinary.com/dkot9tyjm/image/upload/${publicId}`;
  };
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)

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
<<<<<<< HEAD
            {cartItem.designImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={cartItem.designImage}
                  className="w-4/5 h-4/5 object-contain"
                  style={{
                    mixBlendMode: 'multiply'
                  }}
                  alt={cartItem.DesignTitle}
                  onError={(e) => {
                    console.error("Error loading design image");
                    e.target.src = ""; // Clear broken image
                  }}
                />
              </div>
            )}
=======
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
>>>>>>> parent of 22e0b32d (save)
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
                {cartItem.DesignTitle}
=======
                {cartItem?.DesignTitle}
>>>>>>> parent of 22e0b32d (save)
=======
                {cartItem?.DesignTitle}
>>>>>>> parent of 22e0b32d (save)
=======
                {cartItem?.DesignTitle}
>>>>>>> parent of 22e0b32d (save)
=======
                {cartItem?.DesignTitle}
>>>>>>> parent of 22e0b32d (save)
              </h2>
            </div>

            {/* Product Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Product Type:</p>
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
                  <p className="font-medium capitalize">{cartItem.ProductType}</p>
                </div>
                
                <div>
=======
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
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
>>>>>>> parent of 22e0b32d (save)
                  <p className="text-gray-600">Quantity:</p>
                  <p className="font-medium">{cartItem.qty}</p>
                </div>
              </div>
            </div>

            {/* Price Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">Item Price:</p>
                  <p className="text-xl font-bold text-purple-600">
                    EGP {cartItem.price?.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Total Price:</p>
                  <p className="text-2xl font-bold text-purple-600">
                    EGP {order.totalPrice?.toFixed(2)}
                  </p>
                </div>
              </div>
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
              {order.shippingAddress?.address2 && (
                <p className="text-gray-600">{order.shippingAddress.address2}</p>
              )}
              <p className="text-gray-600 mt-2">
                Phone: {order.shippingAddress?.phoneNumber}
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
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
              <p className="font-medium mt-1">{order.paymentInfo?.type}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Status:</p>
              <span className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                order.paymentInfo?.status === "succeeded" 
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {order.paymentInfo?.status}
=======
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
              <p className="font-medium mt-1">Cash On Delivery</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Status:</p>
              <span className="inline-block px-2 py-1 rounded-full text-sm mt-1 bg-yellow-100 text-yellow-800">
                Processing
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
=======
>>>>>>> parent of 22e0b32d (save)
              </span>
            </div>
            {order.deliveryStatus && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600">Delivery Status:</p>
                <span className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                  order.deliveryStatus.isDelivered 
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {order.deliveryStatus.isDelivered ? "Delivered" : "Pending"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetails;
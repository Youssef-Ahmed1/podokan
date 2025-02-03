import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Package, Truck, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { useParams } from "react-router-dom";

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [productImage, setProductImage] = useState(null);

  const order = orders?.find((item) => item._id === id);
  const cartItem = order?.cart?.[0];

  useEffect(() => {
    if (user?._id) {
      dispatch(getAllOrdersOfUser(user._id));
    }
  }, [dispatch, user?._id]);

  useEffect(() => {
    // Load product base image
    if (cartItem?.ProductType && cartItem?.ProductColor) {
      const img = new Image();
      img.src = `/images/${cartItem.ProductType.toLowerCase()}-${cartItem.ProductColor.toLowerCase()}.png`;
      img.onload = () => setProductImage(img.src);
      img.onerror = () => setProductImage('/fallback-product-image.png');
    }
  }, [cartItem?.ProductType, cartItem?.ProductColor]);

  if (!order) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

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
            {productImage && (
              <div className="relative w-full h-full">
                <img
                  src={productImage}
                  className="w-full h-full object-contain"
                  alt="Product base"
                />
                {cartItem?.designImage?.url && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `translate(-50%, -50%) scale(${cartItem.designSpecs?.scale || 1})`
                    }}
                  >
                    <img
                      src={cartItem.designImage.url}
                      className="max-w-[60%] max-h-[60%]"
                      style={{
                        mixBlendMode: cartItem.ProductColor?.toLowerCase() === 'white' ? 'multiply' : 'screen'
                      }}
                      alt="Design"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {cartItem?.DesignTitle || "Custom Design"}
              </h2>
            </div>

            {/* Product Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Product Type:</p>
                  <p className="font-medium capitalize">{cartItem?.ProductType || 'N/A'}</p>
                </div>
                
                <div>
                  <p className="text-gray-600">Color:</p>
                  <p className="font-medium capitalize">{cartItem?.ProductColor || 'N/A'}</p>
                </div>

                <div>
                  <p className="text-gray-600">Size:</p>
                  <p className="font-medium">
                    {cartItem?.designSpecs?.size || cartItem?.size || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-600">Quantity:</p>
                  <p className="font-medium">{cartItem?.qty || 1}</p>
                </div>
              </div>
            </div>

            {/* Design Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Design Specifications</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Position X:</p>
                  <p className="font-medium">{cartItem?.designSpecs?.positionX || '50'}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Position Y:</p>
                  <p className="font-medium">{cartItem?.designSpecs?.positionY || '50'}%</p>
                </div>
                <div>
                  <p className="text-gray-600">Scale:</p>
                  <p className="font-medium">{cartItem?.designSpecs?.scale || '1'}x</p>
                </div>
                <div>
                  <p className="text-gray-600">Rotation:</p>
                  <p className="font-medium">{cartItem?.designSpecs?.rotation || '0'}°</p>
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
                {order.estimatedDelivery 
                  ? `Estimated delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}`
                  : 'Delivery date will be confirmed soon'}
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
              <p className="font-medium mt-1">{order.paymentInfo?.type || "Cash On Delivery"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600">Payment Status:</p>
              <span className={`inline-block px-2 py-1 rounded-full text-sm mt-1 ${
                order.paymentInfo?.status === "Succeeded" 
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {order.paymentInfo?.status || "Processing"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetails;
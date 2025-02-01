import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BsFillBagFill, BsTagFill } from "react-icons/bs";
import { Truck, Package, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { useParams } from "react-router-dom";

const CLOUDINARY_BASE = 'https://res.cloudinary.com/dkot9tyjm/image/upload';
const CLOUDINARY_VERSION = 'v1728392918';
const VIEWS = ['front', 'back'];
const COLORS = ['white', 'black'];

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const order = orders?.find((item) => item._id === id);
  const cartItem = order?.cart?.[0];

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  if (!order) return <div className="text-center p-8 text-xl">Loading order details...</div>;

  // Construct Cloudinary URLs
  const baseProductImage = `${CLOUDINARY_BASE}/${CLOUDINARY_VERSION}/${cartItem?.ProductType}-${cartItem?.ProductColor}-${VIEWS[0]}.png`;
  const designImageUrl = `${CLOUDINARY_BASE}/${CLOUDINARY_VERSION}/${cartItem?.designImage}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Order Header */}
      <div className="flex items-center gap-4 mb-8">
        <BsFillBagFill className="text-3xl text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">Order #{order._id.slice(0, 8)}</h1>
          <p className="text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Product Preview */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product Image with Design */}
          <div className="relative border-2 border-gray-100 rounded-lg p-4">
            <img
              src={baseProductImage}
              className="w-full h-96 object-contain"
              alt="Product base"
            />
            <img
              src={designImageUrl}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                width: `${cartItem?.designSpecs?.scale * 100}%`,
                transform: `translate(
                  ${cartItem?.designSpecs?.positionX}%, 
                  ${cartItem?.designSpecs?.positionY}%
                )`
              }}
              alt="Product design"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{cartItem?.DesignTitle}</h2>
            
            {/* Pricing Details */}
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
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between font-bold">
                  <span>Total Price:</span>
                  <span className="text-purple-600">EGP{order.totalPrice}</span>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-600 mb-3">{order.productSnapshot?.description}</p>
              {order.productSnapshot?.designTags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {order.productSnapshot.designTags.map((tag) => (
                    <span key={tag} className="bg-purple-100 px-2 py-1 rounded-full text-sm">
                      <BsTagFill className="inline mr-1" /> {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Shipping Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="text-purple-600 w-6 h-6" />
            <h3 className="text-xl font-semibold">Shipping Details</h3>
          </div>
          <div className="space-y-2">
            <p>{order.shippingAddress?.address1}</p>
            <p>{order.shippingAddress?.city}</p>
            <p>Phone: {order.shippingAddress?.phoneNumber}</p>
            <div className="mt-4 bg-blue-50 p-3 rounded-lg">
              <p className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <span className="font-medium">
                  {order.status === 'Delivered' 
                    ? `Delivered on ${new Date(order.deliveredAt).toLocaleDateString()}`
                    : order.estimatedDelivery 
                      ? `Estimated delivery: ${new Date(order.estimatedDelivery).toLocaleDateString()}`
                      : 'Processing your order'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-purple-600 w-6 h-6" />
            <h3 className="text-xl font-semibold">Payment Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Method:</span>
              <span className="capitalize">{order.paymentInfo?.type}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={`px-2 py-1 rounded ${
                order.paymentInfo?.status === 'Succeeded' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {order.paymentInfo?.status}
              </span>
            </div>
            <div className="pt-2 border-t mt-4">
              <div className="flex justify-between font-bold">
                <span>Total Paid:</span>
                <span className="text-purple-600">EGP{order.totalPrice}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetails;
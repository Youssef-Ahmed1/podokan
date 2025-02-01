import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { BsFillBagFill, BsTagFill } from "react-icons/bs";
import { Truck, Package, ShoppingCart, Info, Shirt, CreditCard } from "lucide-react";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { useParams } from "react-router-dom";

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [loadingImage, setLoadingImage] = useState(true);
  const data = orders?.find((item) => item._id === id);

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  const renderProductPreview = (item) => (
    <motion.div 
      className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Product Image Container */}
        <div className="flex-1 relative">
          <div className={`absolute inset-0 bg-gray-200 rounded-xl ${loadingImage ? 'animate-pulse' : ''}`} />
          <div className="relative z-10">
            <img
              src={`/product-templates/${item.ProductType}-${item.ProductColor}.png`}
              className="w-full h-96 object-contain"
              alt="Product base"
            />
            <img
              src={item.designImage?.url}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                width: `${item.designSpecs?.scale * 100 || 100}%`,
                transform: `rotate(${item.designSpecs?.rotation || 0}deg)`,
                mixBlendMode: item.ProductColor === 'white' ? 'multiply' : 'overlay'
              }}
              alt="Product design"
              onLoad={() => setLoadingImage(false)}
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="flex-1 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{item.DesignTitle}</h1>
          
          {/* Pricing Card */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="text-purple-600" />
              <h3 className="text-xl font-semibold">Pricing Details</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Original Price:</span>
                <span className="line-through text-gray-500">EGP{item.originalPrice}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-green-600">{item.discountPercentage}% OFF</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-3">
                <span>You Paid:</span>
                <span className="text-purple-600">EGP{item.price}</span>
              </div>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Shirt className="text-purple-600" />
              <h3 className="text-xl font-semibold">Product Specifications</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Selected Size:</p>
                <div className="flex gap-2 mt-2">
                  {['S', 'M', 'L', 'XL'].map((size) => (
                    <span
                      key={size}
                      className={`px-3 py-1 rounded-full ${
                        size === item.size
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-gray-600">Selected Color:</p>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: item.ProductColor }}
                  />
                  <span className="capitalize">{item.ProductColor}</span>
                </div>
              </div>

              <div className="col-span-2">
                <p className="text-gray-600">Product Tags:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(item.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full"
                    >
                      <BsTagFill className="text-gray-500" /> {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderShippingDetails = () => (
    <motion.div
      className="bg-white p-6 rounded-2xl shadow-md mt-8"
      initial={{ y: 20 }}
      animate={{ y: 0 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Truck className="text-purple-600" />
        <h3 className="text-xl font-semibold">Shipping & Delivery</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className="text-gray-600">Shipping Address:</p>
          <p className="mt-1 font-medium">
            {data?.shippingAddress?.address1}, {data?.shippingAddress?.city}
          </p>
        </div>

        <div>
          <p className="text-gray-600">Contact Information:</p>
          <p className="mt-1 font-medium">{data?.shippingAddress?.phoneNumber}</p>
        </div>

        <div className="md:col-span-2">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="flex items-center gap-2 text-sm">
              <Package className="flex-shrink-0" />
              {data?.status === 'Delivered'
                ? `Delivered on ${new Date(data.deliveredAt).toLocaleDateString()}`
                : 'Expected delivery within 5-7 business days'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (!data) return <div className="text-center p-8 text-xl">Loading order details...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <BsFillBagFill className="text-3xl text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Order Summary</h1>
      </div>

      {data?.cart?.map((item, index) => (
        <div key={index}>
          {renderProductPreview(item)}
        </div>
      ))}

      {renderShippingDetails()}

      {/* Payment Details */}
      <motion.div
        className="bg-white p-6 rounded-2xl shadow-md mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="text-purple-600" />
          <h3 className="text-xl font-semibold">Payment Summary</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-gray-600">Payment Method:</p>
            <p className="mt-1 font-medium">{data?.paymentInfo?.type}</p>
          </div>

          <div>
            <p className="text-gray-600">Total Amount Paid:</p>
            <p className="mt-1 font-bold text-purple-600 text-xl">EGP{data?.totalPrice}</p>
          </div>

          <div className="md:col-span-2">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="flex items-center gap-2 text-sm">
                <span className="font-medium">Payment Status:</span>
                <span className={`px-3 py-1 rounded-full ${
                  data?.paymentInfo?.status === 'Succeeded'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {data?.paymentInfo?.status}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserOrderDetails;
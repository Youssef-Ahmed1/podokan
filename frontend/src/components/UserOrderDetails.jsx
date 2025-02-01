import React, { useEffect, useState } from "react";
import { BsFillBagFill, BsInfoCircle } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { server } from "../server";
import { RxCross1 } from "react-icons/rx";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import axios from "axios";
import { toast } from "react-toastify";
import { Clock, CheckCircle, Truck, Package, Info } from "lucide-react";
import { formatDistance, format } from 'date-fns';

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [openReview, setOpenReview] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(1);
  const [loadingImage, setLoadingImage] = useState(true);

  const { id } = useParams();
  const data = orders && orders.find((item) => item._id === id);

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  const statusStyles = {
    Processing: "bg-yellow-100 text-yellow-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
    default: "bg-gray-100 text-gray-800"
  };

  const renderProductPreview = (item) => (
    <motion.div 
      className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1">
          <div className={`absolute inset-0 bg-gray-200 rounded-xl ${loadingImage ? 'animate-pulse' : ''}`} />
          <img
            src={item.designImage?.url || item.designImage}
            alt="Product design"
            className={`w-full h-96 object-contain rounded-xl transition-opacity ${
              loadingImage ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setLoadingImage(false)}
          />
        </div>
        
        <div className="flex-1 space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">{item.DesignTitle}</h3>
          <div className="grid grid-cols-2 gap-4 text-gray-600">
            <div>
              <label className="block text-sm font-medium">Color:</label>
              <p className="font-medium text-gray-900">
                {item.ProductColor || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium">Size:</label>
              <p className="font-medium text-gray-900">
                {data?.productSnapshot?.size || 'Standard'}
              </p>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium">Design Details:</label>
              <p className="text-gray-900 mt-1">
                {data?.productSnapshot?.description || 'Custom clothing design'}
              </p>
            </div>
          </div>
          
          {item.designSpecs && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Info size={16} /> Design Specifications
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Position X: {item.designSpecs.positionX}%</div>
                <div>Position Y: {item.designSpecs.positionY}%</div>
                <div>Scale: {item.designSpecs.scale}x</div>
                <div>Rotation: {item.designSpecs.rotation}°</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderDeliveryStatus = () => {
    if (!data) return null;

    return (
      <motion.div 
        className="bg-indigo-50 p-6 rounded-2xl mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <Truck className="text-indigo-600 flex-shrink-0" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-indigo-900">
              Delivery Status:{" "}
              <span className={`px-3 py-1 rounded-full text-sm ${
                statusStyles[data.status] || statusStyles.default
              }`}>
                {data.status}
              </span>
            </h3>
            
            {data.estimatedDelivery && (
              <p className="text-gray-600 mt-2">
                Estimated Delivery:{" "}
                <span className="font-medium">
                  {format(new Date(data.estimatedDelivery), "PP")}
                </span>
              </p>
            )}
            
            {data.deliveredAt && (
              <p className="text-green-600 mt-2 flex items-center gap-2">
                <CheckCircle size={16} />
                Delivered on {format(new Date(data.deliveredAt), "PP")}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const reviewHandler = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${server}/product/create-new-review`,
        {
          user,
          rating,
          comment,
          productId: selectedItem?._id,
          orderId: id,
        },
        { withCredentials: true }
      );
      toast.success("Review submitted successfully!");
      dispatch(getAllOrdersOfUser(user._id));
      setComment("");
      setRating(1);
      setOpenReview(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    }
  };

  const refundHandler = async () => {
    try {
      await axios.put(`${server}/order/order-refund/${id}`, {
        status: "Processing refund"
      });
      toast.success("Refund request submitted!");
      dispatch(getAllOrdersOfUser(user._id));
    } catch (error) {
      toast.error(error.response?.data?.message || "Refund request failed");
    }
  };

  if (!data) return <div className="text-center p-8">Loading order details...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-8">
        <BsFillBagFill className="text-3xl text-purple-600" />
        <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
      </div>

      {renderDeliveryStatus()}

      <div className="space-y-8">
        {data.cart.map((item, index) => (
          <div key={index}>
            {renderProductPreview(item)}
            
            {!item.isReviewed && data.status === "Delivered" && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                onClick={() => {
                  setOpenReview(true);
                  setSelectedItem(item);
                }}
              >
                Write a Review
              </motion.button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Shipping Details</h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium">Address:</span>{" "}
              {data.shippingAddress.address1}, {data.shippingAddress.address2}
            </p>
            <p>
              <span className="font-medium">City:</span> {data.shippingAddress.city}
            </p>
            <p>
              <span className="font-medium">Phone:</span> {data.shippingAddress.phoneNumber}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-bold mb-4 text-gray-900">Payment Information</h3>
          <div className="space-y-2">
            <p className="flex justify-between">
              <span className="font-medium">Total Price:</span>
              <span className="font-bold text-purple-600">EGP{data.totalPrice}</span>
            </p>
            <p className="flex justify-between">
              <span className="font-medium">Payment Status:</span>
              <span className={`px-2 py-1 rounded ${
                data.paymentInfo?.status === "Succeeded" 
                  ? "bg-green-100 text-green-800" 
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {data.paymentInfo?.status || "Pending"}
              </span>
            </p>
            {data.status === "Delivered" && (
              <button
                onClick={refundHandler}
                className="w-full mt-4 bg-red-100 text-red-600 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors"
              >
                Request Refund
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {openReview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Leave a Review</h2>
                <button onClick={() => setOpenReview(false)}>
                  <RxCross1 className="text-2xl hover:text-gray-600" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={selectedItem?.designImage?.url}
                  alt="Product"
                  className="w-20 h-20 object-contain rounded-lg"
                />
                <div>
                  <h4 className="font-medium">{selectedItem?.DesignTitle}</h4>
                  <p className="text-gray-600">
                    EGP{selectedItem?.discountPrice} x {selectedItem?.qty}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onClick={() => setRating(i)}
                        className={`p-2 rounded ${
                          rating >= i
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        {i <= rating ? <AiFillStar /> : <AiOutlineStar />}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-2 font-medium">Comments</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="4"
                  />
                </div>

                <button
                  onClick={reviewHandler}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default UserOrderDetails;
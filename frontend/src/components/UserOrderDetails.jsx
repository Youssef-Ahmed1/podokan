// UserOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { BsFillBagFill } from "react-icons/bs";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styles from "../styles/styles";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { server } from "../server";
import { RxCross1 } from "react-icons/rx";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import axios from "axios";
import { toast } from "react-toastify";
import { Clock, Package, Truck } from "lucide-react";

const UserOrderDetails = () => {
  const { orders } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(1);

  const { id } = useParams();

  useEffect(() => {
    dispatch(getAllOrdersOfUser(user._id));
  }, [dispatch, user._id]);

  const data = orders && orders.find((item) => item._id === id);

  const reviewHandler = async (e) => {
    e.preventDefault();
    await axios
      .put(
        `${server}/product/create-new-review`,
        {
          user,
          rating,
          comment,
          productId: selectedItem?._id,
          orderId: id,
        },
        { withCredentials: true }
      )
      .then((res) => {
        toast.success(res.data.message);
        dispatch(getAllOrdersOfUser(user._id));
        setComment("");
        setRating(null);
        setOpen(false);
      })
      .catch((error) => {
        toast.error(error.response.data.message);
      });
  };

  const renderOrderStatus = () => {
    if (!data?.estimatedDelivery) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-700">
              We're preparing your order. We'll notify you with a delivery date soon.
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-blue-600" />
          <span className="text-blue-700">
            Estimated delivery: {new Date(data.estimatedDelivery).toLocaleDateString()}
          </span>
        </div>
      </div>
    );
  };

  const refundHandler = async () => {
    await axios.put(`${server}/order/order-refund/${id}`, {
      status: "Processing refund"
    }).then((res) => {
       toast.success(res.data.message);
       dispatch(getAllOrdersOfUser(user._id));
    }).catch((error) => {
      toast.error(error.response.data.message);
    })
  };

  return (
    <div className={`py-4 min-h-screen ${styles.section}`}>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center">
          <BsFillBagFill size={30} color="crimson" />
          <h1 className="pl-2 text-[25px]">Order Details</h1>
        </div>
      </div>

      {renderOrderStatus()}

      {/* Product Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        {data?.productSnapshot && (
          <>
            <h3 className="text-xl font-bold mb-4">{data.productSnapshot.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-gray-600 block">Color:</label>
                  <p className="font-medium">{data.productSnapshot.color}</p>
                </div>
                <div>
                  <label className="text-gray-600 block">Size:</label>
                  <p className="font-medium">{data.productSnapshot.size}</p>
                </div>
                <div>
                  <label className="text-gray-600 block">Design Tags:</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {data.productSnapshot.designTags?.map((tag, index) => (
                      <span 
                        key={index}
                        className="bg-gray-100 px-2 py-1 rounded text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {data.productSnapshot.description && (
                <div>
                  <label className="text-gray-600 block">Description:</label>
                  <p className="mt-1">{data.productSnapshot.description}</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order Items */}
      <div className="space-y-4">
        {data?.cart.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-4 flex items-start">
            <img
              src={item.designImage?.url || item.designImage}
              alt={item.DesignTitle}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="flex-1 ml-4">
              <h5 className="text-lg font-medium">{item.DesignTitle}</h5>
              <p className="text-gray-600">
                EGP{item.discountPrice} x {item.qty}
              </p>
              {!item.isReviewed && data?.status === "Delivered" && (
                <button
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={() => setOpen(true) || setSelectedItem(item)}
                >
                  Write a review
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-end">
              <RxCross1
                size={24}
                onClick={() => setOpen(false)}
                className="cursor-pointer"
              />
            </div>
            <h2 className="text-2xl font-medium text-center mb-6">
              Write a Review
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <img
                src={selectedItem?.designImage?.url || selectedItem?.designImage}
                alt=""
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div>
                <h4 className="font-medium">{selectedItem?.DesignTitle}</h4>
                <p className="text-gray-600">
                  EGP{selectedItem?.discountPrice} x {selectedItem?.qty}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2">
                Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) =>
                  rating >= i ? (
                    <AiFillStar
                      key={i}
                      className="cursor-pointer"
                      color="rgb(246,186,0)"
                      size={28}
                      onClick={() => setRating(i)}
                    />
                  ) : (
                    <AiOutlineStar
                      key={i}
                      className="cursor-pointer"
                      color="rgb(246,186,0)"
                      size={28}
                      onClick={() => setRating(i)}
                    />
                  )
                )}
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block font-medium mb-2">
                Comment
                <span className="ml-1 text-sm text-gray-500">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your thoughts about the product..."
                className="w-full border rounded-lg p-3 h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="5"
              ></textarea>
            </div>
            
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={reviewHandler}
            >
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* Order Summary */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-600">Order ID: #{data?._id?.slice(0, 8)}</p>
            <p className="text-gray-600">
              Placed on: {data?.createdAt?.slice(0, 10)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">
              Total Price: EGP{data?.totalPrice}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-lg mb-2">Shipping Address</h4>
            <div className="space-y-1 text-gray-600">
              <p>{data?.shippingAddress?.address1}</p>
              <p>{data?.shippingAddress?.address2}</p>
              <p>{data?.shippingAddress?.city}</p>
              <p>{data?.shippingAddress?.phoneNumber}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-2">Payment Information</h4>
            <p className="text-gray-600">
              Status: {data?.paymentInfo?.status ? data?.paymentInfo?.status : "Not Paid"}
            </p>
            {data?.status === "Delivered" && (
              <button
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={refundHandler}
              >
                Request Refund
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserOrderDetails;
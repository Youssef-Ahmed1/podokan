import React, { useEffect, useState } from "react";
import { BsFillBagFill } from "react-icons/bs";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import styles from "../styles/styles";
import { getAllOrdersOfUser } from "../redux/actions/order";
import { server } from "../server";
import { RxCross1 } from "react-icons/rx";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import axios from "axios";
import { toast } from "react-toastify";
import { DesignScalingManager } from '../utils/designScaling';
import { Timeline } from '../components/Order/Timeline';
import { Download, Clock, CheckCircle, Truck, Package } from "lucide-react";
import { formatDistance } from 'date-fns';

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
  const renderDeliveryStatus = () => {
    if (!data.estimatedDelivery) {
      return (
        <div className="bg-yellow-100 p-4 rounded-lg mb-6">
          <Clock className="inline-block mr-2" />
          We're preparing your order. We'll notify you with a delivery date soon.
        </div>
      );
    }

    const daysRemaining = Math.ceil(
      (new Date(data.estimatedDelivery) - new Date()) / (1000 * 60 * 60 * 24)
    );

    return (
      <div className="bg-blue-100 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Truck className="text-blue-600" />
          <span className="font-semibold">
            {daysRemaining > 0 
              ? `Estimated delivery in ${daysRemaining} days`
              : 'Your order should arrive today!'}
          </span>
        </div>
        <div className="text-sm">
          Expected by: {new Date(data.estimatedDelivery).toLocaleDateString()}
          {data.adminUpdates.length > 0 && (
            <span className="text-gray-600 ml-2">
              (Last updated {formatDistance(
                new Date(data.adminUpdates.slice(-1)[0].updatedAt), 
                new Date(), 
                { addSuffix: true }
              )})
            </span>
          )}
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
  <div className="container mx-auto p-4">
      {renderDeliveryStatus()}
      
      {/* Product Preview */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">
          {data.productSnapshot.title}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <img
              src={data.productSnapshot.designImage}
              className="w-full h-auto max-h-96 object-contain"
              alt="Product design"
            />
             <p className="mb-4">{data.productSnapshot.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-600">Color:</label>
                <p className="font-medium">{data.productSnapshot.color}</p>
              </div>
              <div>
                <label className="text-gray-600">Size:</label>
                <p className="font-medium">{data.productSnapshot.size}</p>
              </div>
              <div className="col-span-2">
                <label className="text-gray-600">Design Tags:</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {data.productSnapshot.designTags.map(tag => (
                    <span 
                      key={tag}
                      className="bg-gray-100 px-2 py-1 rounded text-sm"
                    >
                      {tag}
                    </span>
                  ))}
          </div>
          </div>
          </div>
          </div>
          </div>
          </div>
          </div>
          
          
      <div className="w-full flex items-center justify-between pt-6">
        <h5 className="text-[#00000084]">
          Order ID: <span>#{data?._id?.slice(0, 8)}</span>
        </h5>
        <h5 className="text-[#00000084]">
          Placed on: <span>{data?.createdAt?.slice(0, 10)}</span>
        </h5>
      </div>

      {/* order items */}
      <br />
      <br />
      {data &&
        data?.cart.map((item, index) => (
          <div key={index} className="w-full flex items-start mb-5">
            <img
              src={item.designImage?.url || item.designImage}
              alt=""
              className="w-[80px] h-[80px] object-cover"
            />
            <div className="w-full pl-3">
              <h5 className="text-[20px]">{item.DesignTitle}</h5>
              <h5 className="text-[20px] text-[#00000091]">
                egp{item.discountPrice} x {item.qty}
              </h5>
            </div>
            {!item.isReviewed && data?.status === "Delivered" && (
              <div
                className={`${styles.button} text-[#fff]`}
                onClick={() => setOpen(true) || setSelectedItem(item)}
              >
                Write a review
              </div>
            )}
          </div>
        ))}

      {/* review popup */}
      {open && (
        <div className="fixed inset-0 bg-[#0005] z-50 flex items-center justify-center">
          <div className="w-[50%] max-w-[500px] bg-white shadow rounded-md p-5">
            <div className="w-full flex justify-end">
              <RxCross1
                size={30}
                onClick={() => setOpen(false)}
                className="cursor-pointer"
              />
            </div>
            <h2 className="text-[30px] font-[500] font-Poppins text-center">
              Give a Review
            </h2>
            <div className="w-full flex mt-5">
              <img
                src={selectedItem?.designImage?.url || selectedItem?.designImage}
                alt=""
                className="w-[80px] h-[80px] object-cover"
              />
              <div className="pl-3">
                <h4 className="text-[20px]">{selectedItem?.DesignTitle}</h4>
                <h4 className="text-[20px]">
                  egp{selectedItem?.discountPrice} x {selectedItem?.qty}
                </h4>
              </div>
            </div>
            <br />
            <h5 className="text-[20px] font-[500]">
              Give a Rating <span className="text-red-500">*</span>
            </h5>
            <div className="flex w-full pt-1">
              {[1, 2, 3, 4, 5].map((i) =>
                rating >= i ? (
                  <AiFillStar
                    key={i}
                    className="mr-1 cursor-pointer"
                    color="rgb(246,186,0)"
                    size={25}
                    onClick={() => setRating(i)}
                  />
                ) : (
                  <AiOutlineStar
                    key={i}
                    className="mr-1 cursor-pointer"
                    color="rgb(246,186,0)"
                    size={25}
                    onClick={() => setRating(i)}
                  />
                )
              )}
            </div>
            <br />
            <div className="w-full">
              <label className="block text-[20px] font-[500]">
                Write a comment
                <span className="ml-1 font-[400] text-[16px] text-[#00000052]">
                  (optional)
                </span>
              </label>
              <textarea
                name="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was your product? Write your expression about it!"
                className="mt-2 w-full border p-2 outline-none"
                rows="5"
              ></textarea>
            </div>
            <div
              className={`${styles.button} text-white text-[20px] mt-5`}
              onClick={reviewHandler}
            >
              Submit
            </div>
          </div>
        </div>
      )}

      <div className="border-t w-full text-right">
        <h5 className="pt-3 text-[18px]">
          Total Price: <strong>EGP{data?.totalPrice}</strong>
        </h5>
      </div>
      <br />
      <br />
      <div className="w-full flex flex-col md:flex-row">
        <div className="w-full md:w-[60%]">
          <h4 className="pt-3 text-[20px] font-[600]">Shipping Address:</h4>
          <h4 className="pt-3 text-[20px]">
            {data?.shippingAddress.address1} {data?.shippingAddress.address2}
          </h4>
          <h4 className="text-[20px]">{data?.shippingAddress.city}</h4>
          <h4 className="text-[20px]">{data?.shippingAddress.phoneNumber}</h4>
        </div>
        <div className="w-full md:w-[40%] mt-5 md:mt-0">
          <h4 className="pt-3 text-[20px]">Payment Info:</h4>
          <h4>
            Status: {data?.paymentInfo?.status ? data?.paymentInfo?.status : "Not Paid"}
          </h4>
          {data?.status === "Delivered" && (
            <div
              className={`${styles.button} text-white mt-5`}
              onClick={refundHandler}
            >
              Give a Refund
            </div>
          )}
        </div>
      </div>
      <br />
      <Link to="/">
        <div className={`${styles.button} text-white`}>Send Message</div>
      </Link>
      <br />
      <br />
    </div>
    
  );
};

export default UserOrderDetails;
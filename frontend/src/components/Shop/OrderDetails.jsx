//OrderDetails.jsx

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams, useNavigate } from "react-router-dom";
import { BsFillBagFill } from "react-icons/bs";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import styles from "../../styles/styles";

const OrderDetails = () => {
  const { seller } = useSelector((state) => state.seller);
  const { shopOrders, isLoading } = useSelector((state) => state.order);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [sellerItems, setSellerItems] = useState([]);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSellerOrders = async () => {
      try {
        await dispatch(getAllOrdersOfShop());

        // If we already have order data, try to find the specific order
        if (shopOrders && shopOrders.length > 0) {
          findSellerOrder();
        }
      } catch (err) {
        console.error("Error fetching seller orders:", err);
        setError("Failed to load orders");
      }
    };

    const findSellerOrder = () => {
      // Find this specific order in the orders list
      const foundOrder = shopOrders.find((order) => order._id === id);

      if (foundOrder) {
        setOrder(foundOrder);
        setStatus(foundOrder.status);

        // Filter the cart to only include this seller's items
        if (foundOrder.cart && Array.isArray(foundOrder.cart)) {
          const sellerProducts = foundOrder.cart.filter((item) => {
            const itemShopId = item.shopId?.toString?.() || item.shopId;
            const currentSellerId = seller?._id?.toString();
            return itemShopId === currentSellerId;
          });

          setSellerItems(sellerProducts);
        }
      } else {
        // If order not found in redux state, fetch it directly
        fetchOrderDirectly();
      }

      setLoadingOrder(false);
    };

    const fetchOrderDirectly = async () => {
      try {
        setLoadingOrder(true);
        const response = await axios.get(
          `${server}/order/get-seller-order/${id}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          const orderData = response.data.order;
          setOrder(orderData);
          setStatus(orderData.status);

          // Filter to only include this seller's items
          if (orderData.cart && Array.isArray(orderData.cart)) {
            const sellerProducts = orderData.cart.filter((item) => {
              const itemShopId = item.shopId?.toString?.() || item.shopId;
              const currentSellerId = seller?._id?.toString();
              return itemShopId === currentSellerId;
            });

            setSellerItems(sellerProducts);
          }
        } else {
          setError("Order not found");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoadingOrder(false);
      }
    };

    // Check if seller exists before trying to fetch orders
    if (seller && seller._id) {
      if (shopOrders && shopOrders.length > 0) {
        findSellerOrder();
      } else {
        fetchSellerOrders();
      }
    } else {
      setError("Seller authentication required");
      setLoadingOrder(false);
    }
  }, [dispatch, id, seller, shopOrders]);

  const orderUpdateHandler = async () => {
    try {
      const response = await axios.put(
        `${server}/order/update-order-status/${id}`,
        { status },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast.success("Order status updated successfully!");
        dispatch(getAllOrdersOfShop());
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    }
  };

  if (isLoading || loadingOrder) {
    return (
      <div className="w-full flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-b-2 border-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
        <button
          onClick={() => navigate("/dashboard-orders")}
          className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full min-h-screen flex flex-col justify-center items-center">
        <p className="text-xl text-gray-600">Order not found</p>
        <Link
          to="/dashboard-orders"
          className="mt-4 text-blue-500 hover:underline"
        >
          Return to orders
        </Link>
      </div>
    );
  }

  // Calculate seller subtotal (only items from this seller)
  const sellerSubtotal = sellerItems.reduce(
    (total, item) => total + item.price * (item.qty || 1),
    0
  );

  return (
    <div className="w-full p-8">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center">
          <BsFillBagFill size={30} color="crimson" />
          <h1 className="pl-2 text-[25px] font-semibold">Order Details</h1>
        </div>
        <Link to="/dashboard-orders">
          <div
            className={`${styles.button} !bg-[#fce1e6] !rounded-[4px] text-[#e94560] font-[600] !h-[45px] text-[18px]`}
          >
            Order List
          </div>
        </Link>
      </div>

      <div className="w-full flex items-center justify-between pt-6">
        <h5 className="text-[#00000084]">
          Order ID:{" "}
          <span className="font-medium">#{order._id?.slice(0, 8)}</span>
        </h5>
        <h5 className="text-[#00000084]">
          Placed on:{" "}
          <span className="font-medium">
            {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </h5>
      </div>

      {/* Order items - Only show this seller's items */}
      <div className="mt-8">
        <h3 className="text-[18px] font-semibold mb-4">
          Your Products in This Order
        </h3>

        {sellerItems.length === 0 ? (
          <div className="w-full bg-orange-100 p-4 rounded-lg">
            <p className="text-orange-700">
              No items from your shop in this order.
            </p>
          </div>
        ) : (
          sellerItems.map((item, index) => (
            <div
              key={index}
              className="w-full flex items-start mb-5 border-b pb-5"
            >
              <div className="w-[80px] h-[80px] bg-gray-200 rounded-md overflow-hidden">
                {item.designImage?.url || item.designImage ? (
                  <img
                    src={item.designImage?.url || item.designImage}
                    alt={item.DesignTitle || "Product"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}
              </div>

              <div className="w-full pl-4">
                <h5 className="text-[20px]">
                  {item.DesignTitle || "Untitled Design"}
                </h5>
                <p className="text-gray-600">
                  Type: {item.ProductType || "N/A"} |
                  {item.ProductColor && item.ProductColor !== "Default"
                    ? ` Color: ${item.ProductColor} |`
                    : ""}
                  {item.size && item.size !== "One Size"
                    ? ` Size: ${item.size} |`
                    : ""}
                  Quantity: {item.qty || 1}
                </p>
                <h5 className="pt-1 text-[18px] text-gray-800">
                  EGP {item.price?.toFixed(2) || "0.00"} x {item.qty || 1}
                </h5>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Order Summary - Only show this seller's portion */}
      {sellerItems.length > 0 && (
        <div className="border-t w-full text-right mt-4 pt-4">
          <h5 className="text-[18px]">
            Your Subtotal: <strong>EGP {sellerSubtotal.toFixed(2)}</strong>
          </h5>
          <p className="text-sm text-gray-500">
            (This only includes items from your shop)
          </p>
        </div>
      )}

      {/* Customer Info */}
      <div className="w-full mt-8 800px:flex items-center">
        <div className="w-full 800px:w-[60%]">
          <h4 className="pt-3 text-[20px] font-[600]">Shipping Address:</h4>
          <h4 className="pt-3 text-[20px]">
            {order?.shippingAddress?.address1 || "N/A"}
            {order?.shippingAddress?.address2
              ? ` ${order.shippingAddress.address2}`
              : ""}
          </h4>
          <h4 className="text-[20px]">
            {order?.shippingAddress?.country || "N/A"}
          </h4>
          <h4 className="text-[20px]">
            {order?.shippingAddress?.city || "N/A"}
          </h4>
          <h4 className="text-[20px]">
            {order?.user?.phoneNumber ||
              order?.shippingAddress?.phoneNumber ||
              "N/A"}
          </h4>
        </div>
        <div className="w-full 800px:w-[40%]">
          <h4 className="pt-3 text-[20px]">Payment Info:</h4>
          <h4>
            Status:{" "}
            {order?.paymentInfo?.status ? order.paymentInfo.status : "Not Paid"}
          </h4>
          <h4>Method: {order?.paymentInfo?.type || "Cash On Delivery"}</h4>
        </div>
      </div>

      {/* Order Status Update */}
      <div className="mt-8">
        <h4 className="pt-3 text-[20px] font-[600]">Order Status:</h4>
        <div className="mt-2 flex items-center">
          <div className="pr-4">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                order.status === "Processing"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "Delivered"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {order.status}
            </span>
          </div>

          {order?.status !== "Processing refund" &&
            order?.status !== "Refund Success" && (
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-[200px] border h-[35px] rounded-[5px]"
              >
                {[
                  "Processing",
                  "Transferred to delivery partner",
                  "Shipping",
                  "Received",
                  "On the way",
                  "Delivered",
                ]
                  .slice(
                    [
                      "Processing",
                      "Transferred to delivery partner",
                      "Shipping",
                      "Received",
                      "On the way",
                      "Delivered",
                    ].indexOf(order?.status) || 0
                  )
                  .map((option, index) => (
                    <option value={option} key={index}>
                      {option}
                    </option>
                  ))}
              </select>
            )}

          {order?.status === "Processing refund" ||
          order?.status === "Refund Success" ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-[200px] border h-[35px] rounded-[5px]"
            >
              {["Processing refund", "Refund Success"]
                .slice(
                  ["Processing refund", "Refund Success"].indexOf(
                    order?.status
                  ) || 0
                )
                .map((option, index) => (
                  <option value={option} key={index}>
                    {option}
                  </option>
                ))}
            </select>
          ) : null}

          <button
            className={`${styles.button} ml-4 !bg-[#FCE1E6] !rounded-[4px] text-[#E94560] font-[600] !h-[35px] text-[16px]`}
            onClick={orderUpdateHandler}
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

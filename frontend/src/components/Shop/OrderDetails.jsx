import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { BsFillBagFill } from "react-icons/bs";
import { Download, Clock, Truck } from "lucide-react";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { DesignDownloader } from "../../utils/designDownload";
import { toast } from "react-toastify";
import styles from "../../styles/styles";

const OrderDetails = () => {
  const dispatch = useDispatch();
  const { id } = useParams();
  const { seller } = useSelector((state) => state.seller);
  const { shopOrders, isLoading } = useSelector((state) => state.order);

  const [order, setOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [status, setStatus] = useState("");

  useEffect(() => {
    dispatch(getAllOrdersOfShop());
  }, [dispatch]);

  useEffect(() => {
    if (shopOrders?.length > 0 && id) {
      const foundOrder = shopOrders.find((o) => o._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setStatus(foundOrder.status);

        // Filter to only show items from this seller's shop
        const sellerItems = foundOrder.cart.filter(
          (item) => item.shopId === seller._id
        );
        foundOrder.sellerItems = sellerItems;
      }
    }
  }, [shopOrders, id, seller]);

  const handleDownloadDesign = async (item) => {
    try {
      // Create a complete design data object
      const designData = {
        imageUrl: item.designImage?.url || item.designImage,
        mockupUrl: item.mockupImage?.url || null,
        orderId: order._id,
        itemId: item._id,
        specs: {
          order: {
            orderId: order._id,
            orderDate: order.createdAt,
            quantity: item.qty || 1,
            price: {
              itemPrice: item.price || 0,
              subtotal: (item.price || 0) * (item.qty || 1),
              shippingCost: 0, // Seller only sees product cost
              total: (item.price || 0) * (item.qty || 1),
            },
          },
          product: {
            title: item.DesignTitle || "Untitled",
            type: item.ProductType || "Product",
            color: item.ProductColor || "N/A",
            size: item.size || "N/A",
          },
          design: {
            position: {
              positionX: item.designSpecs?.positionX || 50,
              positionY: item.designSpecs?.positionY || 50,
              scale: item.designSpecs?.scale || 1,
              rotation: item.designSpecs?.rotation || 0,
            },
          },
          seller: {
            name: seller?.name || "Unknown",
            email: seller?.email || "N/A",
          },
          customer: {
            name: order.user?.name || "Anonymous",
            email: order.user?.email || "N/A",
            address: order.shippingAddress?.address1 || "N/A",
          },
        },
      };

      await DesignDownloader.downloadSingleDesign(designData);
      toast.success("Design downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download design");
    }
  };

  const handleStatusUpdate = async () => {
    // Implement status update logic
    toast.success("Status updated successfully");
  };

  if (isLoading) {
    return (
      <div className="w-full h-[80vh] flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="w-full h-[80vh] flex flex-col items-center justify-center">
        <p className="text-[20px] text-red-500">Order not found</p>
        <Link to="/dashboard-orders" className="mt-4 text-blue-500">
          Return to orders
        </Link>
      </div>
    );
  }

  // Get only this seller's items from the order
  const sellerItems = order.cart.filter(
    (item) => item.shopId && item.shopId.toString() === seller._id.toString()
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

      {/* Order header */}
      <div className="w-full flex flex-col md:flex-row items-start justify-between mt-8">
        <div className="md:w-2/3">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div>
              <h5 className="text-[#00000084]">
                Order ID:{" "}
                <span className="font-medium">#{order._id.slice(0, 8)}</span>
              </h5>
              <h5 className="text-[#00000084] mt-1">
                Placed on:{" "}
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </h5>
            </div>
            <div className="md:ml-6">
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
          </div>

          <div className="mt-4">
            <h4 className="font-medium">Customer Information:</h4>
            <p className="text-[#00000084]">
              Name: {order.user?.name || "N/A"}
            </p>
            <p className="text-[#00000084]">
              Email: {order.user?.email || "N/A"}
            </p>
            <p className="text-[#00000084]">
              Phone: {order.shippingAddress?.phoneNumber || "N/A"}
            </p>
          </div>
        </div>

        <div className="md:w-1/3 mt-6 md:mt-0">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium">Shipping Address:</h4>
            <p className="mt-2">
              {order.shippingAddress?.address1 || "N/A"}
              {order.shippingAddress?.address2
                ? `, ${order.shippingAddress.address2}`
                : ""}
            </p>
            <p>
              {order.shippingAddress?.city || "N/A"},
              {order.shippingAddress?.country || "N/A"}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <h4 className="font-medium">Payment Information:</h4>
            <p className="mt-2">
              Method: {order.paymentInfo?.type || "Cash On Delivery"}
            </p>
            <p>
              Status:{" "}
              <span
                className={
                  order.paymentInfo?.status === "Succeeded"
                    ? "text-green-600"
                    : "text-yellow-600"
                }
              >
                {order.paymentInfo?.status || "Processing"}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="w-full flex border-b mt-8">
        <div
          className={`px-4 py-2 cursor-pointer ${
            activeTab === "details"
              ? "border-b-2 border-blue-500 text-blue-500"
              : ""
          }`}
          onClick={() => setActiveTab("details")}
        >
          Order Items
        </div>
        <div
          className={`px-4 py-2 cursor-pointer ${
            activeTab === "status"
              ? "border-b-2 border-blue-500 text-blue-500"
              : ""
          }`}
          onClick={() => setActiveTab("status")}
        >
          Status Update
        </div>
      </div>

      {/* Content based on active tab */}
      <div className="mt-6">
        {activeTab === "details" ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Your Items in This Order
            </h2>

            {sellerItems.length === 0 ? (
              <p>No items from your shop in this order.</p>
            ) : (
              <div className="space-y-4">
                {sellerItems.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center"
                  >
                    <div className="flex gap-4 w-full md:w-auto">
                      {item.designImage?.url || item.designImage ? (
                        <img
                          src={item.designImage?.url || item.designImage}
                          alt={item.DesignTitle || "Product design"}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">No image</span>
                        </div>
                      )}

                      <div>
                        <h3 className="font-semibold">
                          {item.DesignTitle || "Untitled Design"}
                        </h3>
                        <div className="text-gray-600 space-y-1 mt-1">
                          <p>Type: {item.ProductType || "N/A"}</p>
                          <p>Color: {item.ProductColor || "N/A"}</p>
                          <p>Size: {item.size || "N/A"}</p>
                          <p>Quantity: {item.qty || 1}</p>
                          <p className="font-medium">
                            Price: EGP {(item.price || 0).toFixed(2)}
                            {item.qty > 1
                              ? ` (EGP ${((item.price || 0) * item.qty).toFixed(
                                  2
                                )} total)`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownloadDesign(item)}
                      className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full md:w-auto justify-center"
                    >
                      <Download size={18} />
                      Download Design
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Seller order summary - only showing this seller's items */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">
                Order Summary (Your Items)
              </h3>

              <div className="flex justify-between items-center">
                <span>Total Items:</span>
                <span>{sellerItems.length}</span>
              </div>

              <div className="flex justify-between items-center mt-1">
                <span>Total Quantity:</span>
                <span>
                  {sellerItems.reduce((sum, item) => sum + (item.qty || 1), 0)}
                </span>
              </div>

              <div className="flex justify-between items-center mt-1 font-medium">
                <span>Subtotal:</span>
                <span>
                  EGP{" "}
                  {sellerItems
                    .reduce(
                      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
                      0
                    )
                    .toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-300 font-bold">
                <span>Your Earnings:</span>
                <span className="text-green-600">
                  EGP{" "}
                  {(
                    sellerItems.reduce(
                      (sum, item) => sum + (item.price || 0) * (item.qty || 1),
                      0
                    ) * 0.8
                  ).toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                (After platform fee of 20%)
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-4">
                Current Status:{" "}
                <span className="font-medium">{order.status}</span>
              </p>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">
                  Update Status:
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
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
              </div>

              <button
                onClick={handleStatusUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Status
              </button>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-2">Order Timeline</h3>
              <div className="border-l-2 border-gray-200 ml-4 pl-4 space-y-6">
                {order.statusHistory && order.statusHistory.length > 0 ? (
                  order.statusHistory.map((history, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500"></div>
                      <div>
                        <p className="font-medium">{history.status}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock size={14} className="mr-1" />
                          {new Date(history.timestamp).toLocaleString()}
                        </div>
                        {history.details && (
                          <p className="text-sm mt-1">{history.details}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="relative">
                    <div className="absolute -left-6 mt-1 w-3 h-3 rounded-full bg-blue-500"></div>
                    <div>
                      <p className="font-medium">{order.status}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock size={14} className="mr-1" />
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;

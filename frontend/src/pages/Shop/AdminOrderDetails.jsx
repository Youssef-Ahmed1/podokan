// AdminOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfAdmin, updateOrderStatus } from "../../redux/actions/order";
import { Download, Package, Truck, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import { Timeline } from '../../components/Order/Timeline';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { adminOrders, isLoading } = useSelector((state) => state.order);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await dispatch(getAllOrdersOfAdmin());
      } catch (error) {
        toast.error("Failed to fetch orders");
        navigate("/admin-dashboard");
      }
    };
    fetchOrders();
  }, [dispatch, navigate]);

  // Set order and status when adminOrders changes
  useEffect(() => {
    if (adminOrders) {
      const foundOrder = adminOrders.find(o => o._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setStatus(foundOrder.status);
      }
    }
  }, [adminOrders, id]);

  const handleStatusUpdate = async () => {
    try {
      setIsUpdating(true);
      await dispatch(updateOrderStatus(id, status));
      toast.success("Order status updated successfully");
      // Refresh orders to get updated data
      dispatch(getAllOrdersOfAdmin());
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDownloadDesign = async (item) => {
    try {
      if (!item.designImage?.url) {
        throw new Error("No design available for download");
      }
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = item.designImage.url;
      link.download = `design-${item._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Design downloaded successfully");
    } catch (error) {
      toast.error(error.message || "Failed to download design");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Order not found</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* Order Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Order #{order._id.slice(0, 8)}
          </h1>
          <p className="text-gray-600">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Order Timeline */}
        <Timeline status={order.status} deliveryDate={order.estimatedDelivery} />

        {/* Status Update Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Update Order Status</h2>
          <div className="flex items-center gap-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={isUpdating}
            >
              <option value="Processing">Processing</option>
              <option value="Transferred to delivery partner">Transferred to delivery partner</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isUpdating ? "Updating..." : "Update Status"}
            </button>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
            <p><span className="font-medium">Name:</span> {order.user?.name}</p>
            <p><span className="font-medium">Email:</span> {order.user?.email}</p>
            <p><span className="font-medium">Phone:</span> {order.shippingAddress?.phoneNumber}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Shipping Address</h2>
            <p>{order.shippingAddress?.address1}</p>
            {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
            <p>{order.shippingAddress?.city}, {order.shippingAddress?.zipCode}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          {order.cart?.map((item, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.DesignTitle}</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-gray-600">Product Type:</p>
                      <p className="font-medium">{item.ProductType}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Size:</p>
                      <p className="font-medium">{item.size}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Color:</p>
                      <p className="font-medium">{item.ProductColor}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Quantity:</p>
                      <p className="font-medium">{item.qty}</p>
                    </div>
                  </div>
                  <p className="mt-2">
                    <span className="text-gray-600">Price:</span>
                    <span className="font-medium"> EGP {item.price?.toFixed(2)}</span>
                  </p>
                </div>

                {item.designImage?.url && (
                  <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-center">
                    <img
                      src={item.designImage.url}
                      alt="Design Preview"
                      className="w-32 h-32 object-contain bg-white rounded-lg"
                    />
                    <button
                      onClick={() => handleDownloadDesign(item)}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download size={16} />
                      Download Design
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Payment Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="text-blue-600" />
              <h2 className="text-lg font-semibold">Payment Details</h2>
            </div>
            <p><span className="font-medium">Method:</span> {order.paymentInfo?.type}</p>
            <p><span className="font-medium">Status:</span> {order.paymentInfo?.status}</p>
            <p className="mt-2 text-xl font-bold">
              Total: EGP {order.totalPrice?.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="text-blue-600" />
              <h2 className="text-lg font-semibold">Delivery Information</h2>
            </div>
            <p>
              <span className="font-medium">Status:</span>{" "}
              <span className={`px-2 py-1 rounded-full text-sm ${
                order.status === "Delivered" ? "bg-green-100 text-green-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {order.status}
              </span>
            </p>
            {order.estimatedDelivery && (
              <p><span className="font-medium">Estimated Delivery:</span> {
                new Date(order.estimatedDelivery).toLocaleDateString()
              }</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
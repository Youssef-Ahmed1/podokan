// src/pages/Admin/AdminOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../../server";
import { getAllOrdersOfAdmin } from "../../redux/actions/order";
import {
  Package,
  Truck,
  CheckCircle,
  RefreshCw,
  XCircle,
  DollarSign,
  Clock,
  Download,
} from "lucide-react";
import Loader from "../../components/Layout/Loader";

const ORDER_STATUSES = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  TRANSFERRED: 'Transferred to delivery partner',
  DELIVERED: 'Delivered',
  REFUND_PROCESSING: 'Refund Processing',
  REFUND_SUCCESS: 'Refund Success',
  CANCELLED: 'Cancelled'
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { adminOrders, adminOrderLoading } = useSelector((state) => state.order);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);

  useEffect(() => {
    if (adminOrders) {
      const foundOrder = adminOrders.find((item) => item._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setStatus(foundOrder.status);
      }
    } else {
      dispatch(getAllOrdersOfAdmin());
    }
  }, [dispatch, adminOrders, id]);

  const handleStatusUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${server}/order/update-order-status/${id}`,
        { status },
        { withCredentials: true }
      );
      
      if (response.data.success) {
        toast.success("Order status updated successfully");
        dispatch(getAllOrdersOfAdmin());
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating status");
    } finally {
      setLoading(false);
    }
  };

  const downloadDesign = async (item) => {
    try {
      setDownloadLoading(true);
      const response = await fetch(item.designImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${item.DesignTitle}-design.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Design downloaded successfully");
    } catch (error) {
      toast.error("Error downloading design");
    } finally {
      setDownloadLoading(false);
    }
  };

  const getStatusColor = (currentStatus) => {
    const colors = {
      [ORDER_STATUSES.PENDING]: "bg-yellow-100 text-yellow-800",
      [ORDER_STATUSES.PROCESSING]: "bg-blue-100 text-blue-800",
      [ORDER_STATUSES.TRANSFERRED]: "bg-purple-100 text-purple-800",
      [ORDER_STATUSES.DELIVERED]: "bg-green-100 text-green-800",
      [ORDER_STATUSES.REFUND_PROCESSING]: "bg-orange-100 text-orange-800",
      [ORDER_STATUSES.REFUND_SUCCESS]: "bg-teal-100 text-teal-800",
      [ORDER_STATUSES.CANCELLED]: "bg-red-100 text-red-800",
    };
    return colors[currentStatus] || "bg-gray-100 text-gray-800";
  };

  if (adminOrderLoading || !order) return <Loader />;

  return (
    <div className="w-full min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Order Details
              </h1>
              <p className="text-gray-600">ID: #{order._id}</p>
              <p className="text-gray-600">
                Placed on: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => navigate("/admin-orders")}
                className="px-4 py-2 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Back to Orders
              </button>
              <button
                onClick={handleStatusUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>

          {/* Status Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Order Status</h2>
            <div className="flex items-center gap-4">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-64 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(ORDER_STATUSES).map((statusOption) => (
                  <option key={statusOption} value={statusOption}>
                    {statusOption}
                  </option>
                ))}
              </select>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                Current: {order.status}
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {order.user.name}</p>
                <p><span className="font-medium">Email:</span> {order.user.email}</p>
                <p><span className="font-medium">Phone:</span> {order.shippingAddress.phoneNumber}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
              <div className="space-y-2">
                <p>{order.shippingAddress.address1}</p>
                <p>{order.shippingAddress.address2}</p>
                <p>{order.shippingAddress.city}</p>
                <p>{order.shippingAddress.zipCode}</p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Order Items</h2>
            <div className="space-y-4">
              {order.cart.map((item) => (
                <div
                  key={item._id}
                  className="flex flex-col md:flex-row items-start gap-6 bg-gray-50 rounded-lg p-6"
                >
                  <div className="relative w-full md:w-48 h-48">
                    {/* Product Preview with Design */}
                    <div className="w-full h-full relative">
                      {item.designImage && (
                        <div
                          className="absolute inset-0"
                          style={{
                            top: `${item.DesignPosition?.y || 40}%`,
                            left: `${item.DesignPosition?.x || 50}%`,
                            transform: `translate(-50%, -50%) scale(${item.DesignScale || 1})`,
                          }}
                        >
                          <img
                            src={item.designImage}
                            alt="Design"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium">{item.DesignTitle}</h3>
                        <p className="text-gray-600">Type: {item.ProductType}</p>
                        <p className="text-gray-600">Color: {item.ProductColor}</p>
                        <p className="text-gray-600">Quantity: {item.qty}</p>
                        <p className="text-gray-600">Price: EGP{item.price}</p>
                      </div>
                      <button
                        onClick={() => downloadDesign(item)}
                        disabled={downloadLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        <Download size={20} />
                        {downloadLoading ? "Downloading..." : "Download Design"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Payment Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p><span className="font-medium">Payment Status:</span> {order.paymentInfo.status}</p>
                <p><span className="font-medium">Payment Type:</span> {order.paymentInfo.type}</p>
                <p><span className="font-medium">Payment ID:</span> {order.paymentInfo.id}</p>
              </div>
              <div>
                <p><span className="font-medium">Subtotal:</span> EGP{order.totalPrice}</p>
                {order.status === ORDER_STATUSES.DELIVERED && (
                  <p><span className="font-medium">Service Charge (10%):</span> EGP{(order.totalPrice * 0.1).toFixed(2)}</p>
                )}
                <p className="font-semibold mt-2">Total: EGP{order.totalPrice}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
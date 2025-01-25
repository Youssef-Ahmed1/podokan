import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../../server";
import { getAllOrdersOfAdmin } from "../../redux/actions/order";
import { Download, Clock, CheckCircle, Truck, Package } from "lucide-react";
import Loader from "../../components/Layout/Loader";
import pdfMake from "pdfmake/build/pdfmake";
import { DesignScalingManager } from "../../utils/designScaling";

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const STATUS_TIMELINE = [
  { status: 'Processing', icon: <Package />, color: 'bg-blue-500' },
  { status: 'Shipped', icon: <Truck />, color: 'bg-purple-500' },
  { status: 'Delivered', icon: <CheckCircle />, color: 'bg-green-500' }
];

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { adminOrders } = useSelector((state) => state.order);
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [downloading, setDownloading] = useState({ design: false, specs: false });
  const [deliveryDate, setDeliveryDate] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  useEffect(() => {
    const foundOrder = adminOrders?.find(o => o._id === id);
    if (foundOrder) {
      setOrder(foundOrder);
      setStatus(foundOrder.status);
    }
  }, [adminOrders, id]);
  useEffect(() => {
    if (order) setDeliveryDate(order.estimatedDelivery);
  }, [order]);

  // Date update handler
  const handleDateUpdate = async () => {
    try {
      setIsUpdating(true);
      const { data } = await axios.put(
        `${server}/order/set-delivery/${order._id}`,
        { deliveryDate },
        { withCredentials: true }
      );
      
      setOrder(prev => ({
        ...prev,
        estimatedDelivery: data.newDeliveryDate,
        adminUpdates: [...prev.adminUpdates, data.update]
      }));
      
      toast.success('Delivery date updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };
  const handleStatusUpdate = async () => {
    try {
      await axios.put(`${server}/order/update-order-status/${id}`, { status }, { withCredentials: true });
      toast.success("Order status updated");
      dispatch(getAllOrdersOfAdmin());
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    }
  };

  const downloadDesign = async () => {
    setDownloading(prev => ({ ...prev, design: true }));
    try {
      const response = await axios.get(`${server}/order/download-design/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `design-${id}.png`;
      document.body.appendChild(link);
      link.click();
    } finally {
      setDownloading(prev => ({ ...prev, design: false }));
    }
  };

  const generateSpecsPDF = () => {
    setDownloading(prev => ({ ...prev, specs: true }));
    try {
      const docDefinition = {
        content: [
          { text: 'Production Specifications', style: 'header' },
          `Order: #${order._id.slice(0,8)}`,
          `Customer: ${order.user.name}`,
          `Seller: ${order.shop.name}`,
          { text: 'Design Details', style: 'subheader' },
          ...order.cart.map(item => ({
            ul: [
              `Product: ${item.DesignTitle}`,
              `Type: ${item.ProductType}`,
              `Size: ${item.designSpecs.size}`,
              `Position: X${item.designSpecs.positionX}%, Y${item.designSpecs.positionY}%`,
              `Scale: ${item.designSpecs.scale}x`
            ]
          }))
        ],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          subheader: { fontSize: 14, bold: true, margin: [0, 10, 0, 5] }
        }
      };
      pdfMake.createPdf(docDefinition).download(`specs-${id}.pdf`);
    } finally {
      setDownloading(prev => ({ ...prev, specs: false }));
    }
  };

  if (!order) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order._id.slice(0,8)}</h1>
            <p className="text-gray-600 mt-2">
              Placed on: {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <button
              onClick={() => navigate("/admin-orders")}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Back to Orders
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="relative h-24 mb-8">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2"></div>
          {STATUS_TIMELINE.map((stage, index) => (
            <div
              key={stage.status}
              className="absolute top-1/2 transform -translate-y-1/2"
              style={{ left: `${(index / (STATUS_TIMELINE.length - 1)) * 100}%` }}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                ${order.status === stage.status ? stage.color : 'bg-gray-300'} 
                ${order.status === stage.status ? 'scale-125' : 'scale-100'} 
                transition-transform duration-300`}>
                {stage.icon}
              </div>
              <p className="text-center mt-2 text-sm text-gray-600">{stage.status}</p>
            </div>
          ))}
        </div>

        {/* Order Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer & Design Info */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Customer Details</h2>
              <p className="mb-2"><span className="font-medium">Name:</span> {order.user.name}</p>
              <p className="mb-2"><span className="font-medium">Email:</span> {order.user.email}</p>
              <p className="mb-2"><span className="font-medium">Phone:</span> {order.shippingAddress.phoneNumber}</p>
              <p className="font-medium">Address:</p>
              <p>{order.shippingAddress.address1}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Design Specifications</h2>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={downloadDesign}
                  disabled={downloading.design}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  {downloading.design ? 'Downloading...' : 'Design File'}
                </button>
                <button
                  onClick={generateSpecsPDF}
                  disabled={downloading.specs}
                  className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  {downloading.specs ? 'Generating...' : 'Tech Specs'}
                </button>
              </div>
            </div>
          </div>

          {/* Order Management */}
          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Order Management</h2>
              <div className="space-y-4">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white"
                >
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancel Order</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  className="w-full p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Status
                </button>
              </div>
            </div>
            <div className="p-4">
      {/* Delivery Control Section */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-xl font-bold mb-4">Delivery Management</h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <DatePicker
            selected={deliveryDate}
            onChange={date => setDeliveryDate(date)}
            minDate={new Date()}
            placeholderText="Select delivery date"
            className="border p-2 rounded w-full md:w-64"
            popperPlacement="bottom-start"
          />
          
          <button
            onClick={handleDateUpdate}
            disabled={!deliveryDate || isUpdating}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isUpdating ? 'Updating...' : 'Set Delivery Date'}
          </button>
        </div>

        {/* Update History */}
        {order.adminUpdates.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Update History:</h4>
            <div className="space-y-2">
              {order.adminUpdates.map((update, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded">
                  {new Date(update.updatedAt).toLocaleString()}: 
                  Changed from {update.previousDate?.toLocaleDateString() || 'N/A'} 
                  to {update.newDate.toLocaleDateString()}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  
            <div className="bg-gray-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Status:</span> {order.paymentInfo.status}</p>
                <p><span className="font-medium">Method:</span> {order.paymentInfo.type}</p>
                <p><span className="font-medium">Total:</span> EGP{order.totalPrice}</p>
                {order.status === 'Delivered' && (
                  <p><span className="font-medium">Service Fee:</span> EGP{(order.totalPrice * 0.1).toFixed(2)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOrderDetails;
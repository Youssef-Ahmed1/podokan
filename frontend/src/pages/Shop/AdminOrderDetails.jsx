import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfAdmin,updateOrderStatus } from "../../redux/actions/order";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { Timeline } from '../../components/Order/Timeline';
import { DesignScalingManager, DESIGN_CONFIG } from '../../utils/designScaling';
import { Download, Package } from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { motion } from 'framer-motion';
import { DesignDownloader } from '../../utils/designDownload.jsx';

//.


const DesignPreview = ({ item }) => {
  // Add default values for undefined properties
  const position = item.DesignPosition || { x: 50, y: 40 };
  const scale = item.DesignScale || 0.8;
  
  const designStyles = DesignScalingManager.getDesignStyles(
    position,
    scale,
    item.ProductColor || 'white',
    item.ProductView || 'front'
  );

  return (
    <div className="relative w-full h-64">
      <img
        src={`/images/${item.ProductType}-${item.ProductColor || 'white'}.png`}
        alt={item.ProductType}
        className="w-full h-full object-contain"
      />
      {item.designImage?.url && (
        <div style={designStyles.container}>
          <img
            src={item.designImage.url}
            alt="Design"
            style={designStyles.image}
          />
        </div>
      )}
    </div>
  );
};

const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { adminOrders, adminOrderLoading } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

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
    setIsLoading(true);
    try {
      await dispatch(updateOrderStatus(id, status));
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update order status");
    } finally {
      setIsLoading(false);
    }
  };

const handleDownloadSpecs = async () => {
  try {
    setIsLoading(true);
    await DesignDownloader.downloadOrderDesigns(order);
    toast.success('Designs package downloaded successfully!');
  } catch (error) {
    toast.error('Failed to download designs package');
  } finally {
    setIsLoading(false);
  }
};
  if (adminOrderLoading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Order #{order._id}</h1>
        
        <Timeline status={order.status} deliveryDate={order.estimatedDelivery} />


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Customer Details</h2>
            <p><span className="font-medium">Name:</span> {order.user.name}</p>
            <p><span className="font-medium">Email:</span> {order.user.email}</p>
            <p><span className="font-medium">Phone:</span> {order.shippingAddress.phoneNumber}</p>
            <p><span className="font-medium">Address:</span> {order.shippingAddress.address1}, {order.shippingAddress.city}</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Order Summary</h2>
            <p><span className="font-medium">Total Items:</span> {order.cart.length}</p>
            <p><span className="font-medium">Total Price:</span> ${order.totalPrice.toFixed(2)}</p>
            <p><span className="font-medium">Payment Status:</span> {order.paymentInfo.status}</p>
            <p><span className="font-medium">Order Status:</span> {order.status}</p>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          {order.cart.map((item, index) => (
  <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
    <h3 className="text-lg font-medium">{item.DesignTitle}</h3>
    {/* Only render design preview if design data exists */}
    {item.designImage?.url && (
      <div className="relative w-full h-64">
        <img
          src={`/images/${item.ProductType}-${item.ProductColor || 'white'}.png`}
          alt={item.ProductType}
          className="w-full h-full object-contain"
        />
        <div
          style={DesignScalingManager.getDesignStyles(
            item.DesignPosition || { x: 50, y: 40 },
            item.DesignScale || 0.8,
            item.ProductColor || 'white',
            item.ProductView || 'front'
          ).container}
        >
          <img
            src={item.designImage.url}
            alt="Design"
            style={DesignScalingManager.getDesignStyles(
              item.DesignPosition || { x: 50, y: 40 },
              item.DesignScale || 0.8,
              item.ProductColor || 'white',
              item.ProductView || 'front'
            ).image}
          />
        </div>
      </div>
    )}
    <p>Type: {item.ProductType}</p>
    <p>Color: {item.ProductColor}</p>
    <p>Size: {item.size}</p>
    <p>Quantity: {item.qty}</p>
  </div>
))}

        </div>
        <button 
      onClick={async (item) => {
        try {
          await DesignDownloader.downloadSingleDesign(item);
          toast.success('Design downloaded successfully!');
        } catch (error) {
          toast.error('Failed to download design');
        }
      }}
      className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    >
      <Download size={16} />
      Download This Design
    </button>
    
        <div className="mt-6 flex justify-between items-center">
          <div>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="mr-4 p-2 border rounded"
            >
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
            </select>
            <button 
              onClick={handleStatusUpdate}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
          <button 
            onClick={handleDownloadSpecs}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center disabled:opacity-50"
          >
            <Package className="mr-2" />
            {isLoading ? 'Downloading...' : 'Download All Specs (ZIP)'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminOrderDetails;
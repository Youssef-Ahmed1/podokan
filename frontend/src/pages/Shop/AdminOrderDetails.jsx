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


//.

const DesignPreview = ({ item }) => {
  const designStyles = DesignScalingManager.getDesignStyles(
    { x: item.designSpecs.positionX, y: item.designSpecs.positionY },
    item.designSpecs.scale,
    item.ProductColor,
    item.ProductType
  );

  return (
    <div className="relative w-full h-64">
      <img
        src={`/images/${item.ProductType}-${item.ProductColor}.png`}
        alt={item.ProductType}
        className="w-full h-full object-contain"
      />
      <div style={designStyles.container}>
        <img
          src={item.designImage.url}
          alt="Design"
          style={designStyles.image}
        />
      </div>
    </div>
  );
};
const AdminOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("");
  const { adminOrders, adminOrderLoading, isLoading , setIsLoading} = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (adminOrders) {
      const foundOrder = adminOrders.find(o => o._id === id);
      setOrder(foundOrder);
      setStatus(foundOrder?.status);
    }
  }, [adminOrders, id]);


 
  const handleStatusUpdate = async () => {
    try {
      await dispatch(updateOrderStatus(id, status));
      toast.success("Order status updated");
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleDownloadSpecs = async () => {
    try {
      const response = await axios.get(`${server}/order/download-specs/${id}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order-${id}-specs.zip`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      toast.error("Error downloading specs");
    }
  };

  if (adminOrderLoading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  const downloadAllSpecs = async () => {
    setIsLoading(true);
    try {
      const zip = new JSZip();
      
      for (const item of order.cart) {
        // Create a JSON file with product specs
        const specs = {
          productType: item.ProductType,
          productColor: item.ProductColor,
          designPosition: item.DesignPosition,
          designScale: item.DesignScale,
          size: item.size,
        };
        zip.file(`${item._id}-specs.json`, JSON.stringify(specs, null, 2));

        // Download and add the design image
        const designResponse = await axios.get(item.designImage.url, { responseType: 'arraybuffer' });
        zip.file(`${item._id}-design.png`, designResponse.data);

        // Create and add the composite image (product with design)
        const compositeImage = await createCompositeImage(item);
        zip.file(`${item._id}-composite.png`, compositeImage);
      }
      
      const content = await zip.generateAsync({type: "blob"});
      saveAs(content, `order-${id}-specs.zip`);
      
    } catch (error) {
      toast.error("Error downloading specs");
    } finally {
      setIsLoading(false);
    }
  };

  const createCompositeImage = async (item) => {
    const productImage = await loadImage(`/images/${item.ProductType}-${item.ProductColor}.png`);
    const designImage = await loadImage(item.designImage.url);
    
    const canvas = document.createElement('canvas');
    canvas.width = productImage.width;
    canvas.height = productImage.height;
    const ctx = canvas.getContext('2d');

    // Draw product image
    ctx.drawImage(productImage, 0, 0);

    // Apply design image
    const designStyles = DesignScalingManager.getDesignStyles(
      item.DesignPosition,
      item.DesignScale,
      item.ProductColor,
      item.ProductView
    );

    const designWidth = productImage.width * parseFloat(designStyles.container.width) / 100;
    const designHeight = designWidth / parseFloat(designStyles.container.aspectRatio);
    const designX = (productImage.width * item.DesignPosition.x / 100) - (designWidth / 2);
    const designY = (productImage.height * item.DesignPosition.y / 100) - (designHeight / 2);

    ctx.globalCompositeOperation = designStyles.container.mixBlendMode;
    ctx.drawImage(designImage, designX, designY, designWidth, designHeight);

    return canvas.toDataURL('image/png');
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  if (!order) return <div>Loading...</div>;

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
              <div className="relative w-full h-64">
                <img
                  src={`/images/${item.ProductType}-${item.ProductColor}.png`}
                  alt={item.ProductType}
                  className="w-full h-full object-contain"
                />
                <div
                  style={DesignScalingManager.getDesignStyles(
                    item.DesignPosition,
                    item.DesignScale,
                    item.ProductColor,
                    item.ProductView
                  ).container}
                >
                  <img
                    src={item.designImage.url}
                    alt="Design"
                    style={DesignScalingManager.getDesignStyles(
                      item.DesignPosition,
                      item.DesignScale,
                      item.ProductColor,
                      item.ProductView
                    ).image}
                  />
                </div>
              </div>
              <p>Type: {item.ProductType}</p>
              <p>Color: {item.ProductColor}</p>
              <p>Size: {item.size}</p>
              <p>Quantity: {item.qty}</p>
            </div>
          ))}
        </div>

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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
          >
            <Package className="mr-2" />
            Download All Specs (ZIP)
          </button>
        </div>
      </motion.div>
    </div>
  );
};


export default AdminOrderDetails;
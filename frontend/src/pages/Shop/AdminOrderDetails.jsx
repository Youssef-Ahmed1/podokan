// AdminOrderDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Download, Package } from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrdersOfAdmin } from "../../redux/actions/order";
import { DesignDownloader } from "../../utils/designDownload";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { adminOrders, isLoading } = useSelector((state) => state.order);
  const [order, setOrder] = useState(null);

  useEffect(() => {
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (adminOrders) {
      const foundOrder = adminOrders.find(o => o._id === id);
      setOrder(foundOrder);
    }
  }, [adminOrders, id]);

  const handleDownloadDesign = async (item) => {
    try {
      const designData = {
        imageUrl: item.designImage?.url || item.designImage,
        orderId: order._id,
        itemId: item._id,
        specs: {
          order: {
            orderId: order._id,
            orderDate: order.createdAt,
            quantity: item.qty || 1,
            price: item.price
          },
          product: {
            title: item.DesignTitle || 'Untitled',
            type: item.ProductType || 'Hoodie',
            color: item.ProductColor || 'N/A',
            size: item.size || 'N/A'
          },
          design: {
            position: item.designSpecs || { x: 50, y: 40 },
            scale: item.designSpecs?.scale || 1
          }
        }
      };
  
      await DesignDownloader.downloadSingleDesign(designData);
      toast.success("Design downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download design");
    }
  };
  

  const handleDownloadAllDesigns = async () => {
    try {
      if (!order) throw new Error("Order not found");
      await DesignDownloader.downloadOrderDesigns(order);
      toast.success("All designs downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(error.message || "Failed to download designs");
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4">
        <div className="text-center text-red-500">Order not found</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        {/* Order Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Order #{order._id}
              </h1>
              <p className="text-gray-600">
                {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleDownloadAllDesigns}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download size={20} />
              Download All Designs
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.cart.map((item) => (
              <div
                key={item._id}
                className="border rounded-lg p-4 flex justify-between items-center"
              >
                <div className="flex gap-4">
                  {item.designImage?.url && (
                    <img
                      src={item.designImage.url}
                      alt="Design"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{item.DesignTitle}</h3>
                    <p className="text-gray-600">
                      {item.ProductType} - {item.size} - {item.ProductColor}
                    </p>
                    <p className="text-gray-600">Quantity: {item.qty}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadDesign(item)}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <Download size={16} />
                  Download Design
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>EGP {order.totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>EGP {order.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
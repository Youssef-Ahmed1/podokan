// AdminOrderDetails.jsx - Add function to update product details
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Download, Package, Truck, CreditCard, Edit, Save } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  getAllOrdersOfAdmin,
  updateOrderStatus,
} from "../../redux/actions/order";
import { DesignDownloader } from "../../utils/designDownload";
import { server } from "../../server";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { adminOrders, isLoading } = useSelector((state) => state.order);
  const [order, setOrder] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editValues, setEditValues] = useState({
    color: "",
    size: "",
  });

  useEffect(() => {
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (adminOrders) {
      const foundOrder = adminOrders.find((o) => o._id === id);
      if (foundOrder) {
        setOrder(foundOrder);
        setStatusUpdate(foundOrder.status);
      }
    }
  }, [adminOrders, id]);

  const handleDownloadDesign = async (item) => {
    try {
      // Calculate shipping and totals for accurate download data
      const subtotal = item.price * (item.qty || 1);
      const shippingCost = order.totalPrice - order.subtotal || 0;

      // Create design data with exact positioning from item
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
              itemPrice: item.price,
              subtotal: subtotal,
              shippingCost: shippingCost,
              total: order.totalPrice,
            },
          },
          product: {
            title: item.DesignTitle || "Untitled",
            type: item.ProductType || "Hoodie",
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
            name: item.shopName || "Unknown",
            email: item.shopEmail || "N/A",
          },
          customer: {
            name: order.user?.name || "Anonymous",
            email: order.user?.email || "N/A",
            address: order.shippingAddress?.address1 || "N/A",
          },
          shipping: {
            address: order.shippingAddress?.address1 || "N/A",
            city: order.shippingAddress?.city || "N/A",
            country: order.shippingAddress?.country || "N/A",
            shippingPrice: shippingCost,
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

  const handleStatusChange = async () => {
    if (statusUpdate && statusUpdate !== order.status) {
      try {
        await dispatch(updateOrderStatus(order._id, statusUpdate));
        toast.success("Order status updated");
        dispatch(getAllOrdersOfAdmin()); // Refresh orders
      } catch (error) {
        toast.error("Failed to update status");
      }
    }
  };

  const startEditingItem = (item) => {
    setEditingItem(item._id);
    setEditValues({
      color: item.ProductColor || "",
      size: item.size || "",
    });
  };

  const saveItemDetails = async () => {
    if (!editingItem) return;

    try {
      const response = await axios.put(
        `${server}/order/update-item-details/${order._id}/${editingItem}`,
        {
          ProductColor: editValues.color,
          size: editValues.size,
        },
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Product details updated");

        // Update local order state
        setOrder((prevOrder) => {
          const updatedCart = prevOrder.cart.map((item) => {
            if (item._id === editingItem) {
              return {
                ...item,
                ProductColor: editValues.color,
                size: editValues.size,
              };
            }
            return item;
          });

          return {
            ...prevOrder,
            cart: updatedCart,
          };
        });

        setEditingItem(null);
      } else {
        throw new Error(response.data.message || "Failed to update details");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update product details");
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

  // Calculate order totals
  const subtotal =
    order.subtotal ||
    order.cart.reduce((total, item) => total + item.price * (item.qty || 1), 0);
  const shippingCost = order.totalPrice - subtotal;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg">
        {/* Order Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Order #{order._id.slice(0, 8)}
              </h1>
              <p className="text-gray-600">
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    order.status === "Processing"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "Delivered"
                      ? "bg-green-100 text-green-800"
                      : order.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>

                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="ml-2 p-1 border rounded text-sm"
                >
                  <option value="Processing">Processing</option>
                  <option value="Transferred to delivery partner">
                    Transferred
                  </option>
                  <option value="Shipping">Shipping</option>
                  <option value="Received">Received</option>
                  <option value="On the way">On the way</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <button
                  onClick={handleStatusChange}
                  className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-sm"
                >
                  Update
                </button>
              </div>
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
              <div key={item._id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex gap-4">
                    {(item.designImage?.url || item.designImage) && (
                      <img
                        src={item.designImage?.url || item.designImage}
                        alt="Design"
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">
                        {item.DesignTitle || "Untitled Design"}
                      </h3>

                      {editingItem === item._id ? (
                        <div className="mt-2 space-y-2">
                          <div>
                            <label className="block text-sm text-gray-600">
                              Product Type
                            </label>
                            <p className="font-medium">
                              {item.ProductType || "N/A"}
                            </p>
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600">
                              Color
                            </label>
                            <input
                              type="text"
                              value={editValues.color}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  color: e.target.value,
                                })
                              }
                              className="p-1 border rounded w-full"
                            />
                          </div>

                          <div>
                            <label className="block text-sm text-gray-600">
                              Size
                            </label>
                            <input
                              type="text"
                              value={editValues.size}
                              onChange={(e) =>
                                setEditValues({
                                  ...editValues,
                                  size: e.target.value,
                                })
                              }
                              className="p-1 border rounded w-full"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={saveItemDetails}
                              className="px-3 py-1 bg-green-500 text-white rounded-lg flex items-center"
                            >
                              <Save size={16} className="mr-1" />
                              Save
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="px-3 py-1 bg-gray-300 rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-600">
                            {item.ProductType || "N/A"}
                            {item.size ? ` - ${item.size}` : " - N/A"}
                            {item.ProductColor
                              ? ` - ${item.ProductColor}`
                              : " - N/A"}
                          </p>
                          <p className="text-gray-600">
                            Quantity: {item.qty || 1}
                          </p>
                          <p className="font-medium">
                            Price: EGP {(item.price || 0).toFixed(2)}
                          </p>

                          <button
                            onClick={() => startEditingItem(item)}
                            className="mt-2 flex items-center text-blue-500 text-sm"
                          >
                            <Edit size={14} className="mr-1" />
                            Edit Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadDesign(item)}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                  >
                    <Download size={16} />
                    Download Design
                  </button>
                </div>

                {/* Display design specs */}
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">Design Position:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm bg-gray-50 p-2 rounded">
                    <div>
                      <span className="text-gray-500">X Position:</span>{" "}
                      {item.designSpecs?.positionX || 50}%
                    </div>
                    <div>
                      <span className="text-gray-500">Y Position:</span>{" "}
                      {item.designSpecs?.positionY || 50}%
                    </div>
                    <div>
                      <span className="text-gray-500">Scale:</span>{" "}
                      {item.designSpecs?.scale || 1}x
                    </div>
                    <div>
                      <span className="text-gray-500">Rotation:</span>{" "}
                      {item.designSpecs?.rotation || 0}°
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer and Shipping Info */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Package className="text-blue-600" size={20} />
              <h3 className="font-semibold">Customer Information</h3>
            </div>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600">Name:</span>{" "}
                {order.user?.name || "N/A"}
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{" "}
                {order.user?.email || "N/A"}
              </p>
              <p>
                <span className="text-gray-600">Phone:</span>{" "}
                {order.shippingAddress?.phoneNumber || "N/A"}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="text-blue-600" size={20} />
              <h3 className="font-semibold">Shipping Address</h3>
            </div>
            <div className="space-y-2">
              <p>{order.shippingAddress?.address1 || "N/A"}</p>
              {order.shippingAddress?.address2 && (
                <p>{order.shippingAddress.address2}</p>
              )}
              <p>
                {order.shippingAddress?.city || "N/A"},
                {order.shippingAddress?.country || "N/A"}
                {order.shippingAddress?.postalCode
                  ? ` ${order.shippingAddress.postalCode}`
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="text-blue-600" size={20} />
            <h3 className="font-semibold">Payment Information</h3>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Payment Method:</p>
                <p className="font-medium">
                  {order.paymentInfo?.type || "Cash On Delivery"}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Payment Status:</p>
                <p
                  className={`font-medium ${
                    order.paymentInfo?.status === "Succeeded"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }`}
                >
                  {order.paymentInfo?.status || "Processing"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-6 bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>EGP {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>EGP {shippingCost.toFixed(2)}</span>
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

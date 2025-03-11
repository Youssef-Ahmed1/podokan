import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  Package,
  Truck,
  Download,
  Edit,
  Check,
  X,
  Clock,
  CreditCard,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  adminUpdateOrderStatus,
  adminDownloadDesign,
  getAllOrdersOfAdmin,
} from "../../redux/actions/order";
import axios from "axios";
import { server } from "../../server";
import { DesignDownloader } from "../../utils/designDownload";
const StatusUpdateModal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
};

const AdminOrderDetails = () => {
  const { orders, isLoading } = useSelector((state) => state.order);
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingItemId, setDownloadingItemId] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fix: Moved user selector above where it's used
  const isAdmin = user && user.role && user.role.toLowerCase() === "admin";

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // If orders not loaded, fetch them
        if (!orders || orders.length === 0) {
          console.log("No orders loaded, fetching from API...");
          await dispatch(getAllOrdersOfAdmin());
        } else {
          console.log("Using cached orders, count:", orders.length);
        }

        // Find the order from the loaded orders after re-fetch
        const foundOrder = orders.find((order) => order._id === id);
        if (foundOrder) {
          console.log("Order found in cache:", foundOrder._id);
          setOrder(foundOrder);
        } else {
          console.log("Order not found in cache, trying direct API fetch");
          // Try direct fetch as fallback
          const { data } = await axios.get(
            `${server}/order/admin/order/${id}`,
            {
              withCredentials: true,
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          if (data.success && data.order) {
            setOrder(data.order);
          }
        }
      } catch (error) {
        console.error("Error fetching order details:", error);
        toast.error("Failed to load order details");
      }
    };

    fetchOrder();
  }, [dispatch, orders, id]);

  // Fix: Corrected handleDownloadDesign to use the item directly
  const handleDownloadDesign = async (item) => {
    try {
      setIsDownloading(true);
      setDownloadingItemId(item._id);

      const { data } = await axios.get(
        `${server}/order/download-design/${order._id}/${item._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          timeout: 30000,
        }
      );

      if (!data.success) throw new Error(data.message);

      await DesignDownloader.downloadSingleDesign({
        ...data.designData,
        imageUrl: data.designUrl,
        specs: {
          ...data.designData.specs,
          product: {
            type: item.ProductType,
            color: item.ProductColor,
            size: item.size,
          },
        },
      });

      toast.success("Design package downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      toast.error(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
      setDownloadingItemId(null);
    }
  };
  // Handle status update
  const handleUpdateStatus = async () => {
    try {
      setIsUpdatingStatus(true);

      await dispatch(adminUpdateOrderStatus(order._id, newStatus));

      toast.success(`Order status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error(error.message || "Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Order not found</h2>
        <p className="text-gray-600 mt-2">
          The order you're looking for could not be found.
        </p>
      </div>
    );
  }

  // Calculate order totals
  const subtotal =
    order.subtotal ||
    order.cart.reduce((total, item) => total + item.price * (item.qty || 1), 0);

  const shippingCost =
    order.shippingCost || order.shippingAddress?.shippingPrice || 50;

  const total = order.totalPrice || subtotal + shippingCost;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Order Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Order #{order._id.slice(0, 8)}
            </h1>
            <p className="text-gray-500 mt-1">
              {format(new Date(order.createdAt), "PPP p")}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-col md:flex-row items-start md:items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
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
            <button
              onClick={() => {
                setNewStatus(order.status);
                setShowStatusModal(true);
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium flex items-center"
            >
              <Edit size={14} className="mr-1" />
              Update Status
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <Package className="text-blue-500 mr-2" size={20} />
              <h3 className="font-semibold">Order Summary</h3>
            </div>
            <p className="text-gray-600">Items: {order.cart.length}</p>
            <p className="text-gray-600">
              Total Quantity:{" "}
              {order.cart.reduce((sum, item) => sum + (item.qty || 1), 0)}
            </p>
            <p className="mt-2 font-bold">Total: EGP {total.toFixed(2)}</p>
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <CreditCard className="text-blue-500 mr-2" size={20} />
              <h3 className="font-semibold">Payment Info</h3>
            </div>
            <p className="text-gray-600">
              Method: {order.paymentInfo?.type || "Cash On Delivery"}
            </p>
            <p className="text-gray-600">
              Status:{" "}
              <span
                className={
                  order.paymentInfo?.status === "succeeded" ||
                  order.paymentInfo?.status === "Succeeded"
                    ? "text-green-600 font-medium"
                    : "text-yellow-600 font-medium"
                }
              >
                {order.paymentInfo?.status || "Processing"}
              </span>
            </p>
            {order.paidAt && (
              <p className="text-gray-600">
                Paid on: {format(new Date(order.paidAt), "PPP")}
              </p>
            )}
          </div>

          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center mb-2">
              <Clock className="text-blue-500 mr-2" size={20} />
              <h3 className="font-semibold">Timeline</h3>
            </div>
            <p className="text-gray-600">
              Created: {format(new Date(order.createdAt), "PPP")}
            </p>
            {order.deliveredAt && (
              <p className="text-gray-600">
                Delivered: {format(new Date(order.deliveredAt), "PPP")}
              </p>
            )}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <p className="text-gray-600">
                Last Update:{" "}
                {format(
                  new Date(
                    order.statusHistory[
                      order.statusHistory.length - 1
                    ].timestamp
                  ),
                  "PPP"
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Contact Details</h3>
            <p className="text-gray-700 font-medium">
              {order.user?.name || "N/A"}
            </p>
            <p className="text-gray-600">{order.user?.email || "N/A"}</p>
            <p className="text-gray-600">
              {order.shippingAddress?.phoneNumber || "N/A"}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Shipping Address</h3>
            <p className="text-gray-700">
              {order.shippingAddress?.address1 || "N/A"}
            </p>
            {order.shippingAddress?.address2 && (
              <p className="text-gray-700">{order.shippingAddress.address2}</p>
            )}
            <p className="text-gray-700">
              {order.shippingAddress?.city || "N/A"},
              {order.shippingAddress?.country || "N/A"}
              {order.shippingAddress?.postalCode
                ? ` ${order.shippingAddress.postalCode}`
                : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <h2 className="text-xl font-bold mb-4">Order Items</h2>
      {order.cart.map((item) => (
        <div key={item._id} className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {item.designImage ? (
                <img
                  src={item.designImage.url || item.designImage}
                  alt={item.DesignTitle || "Product"}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <AlertTriangle size={48} className="text-gray-400" />
              )}
            </div>

            {/* Product Details */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">
                    {item.DesignTitle || "Untitled Design"}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {item.ProductType || "N/A"}
                    </span>
                    {item.ProductColor && item.ProductColor !== "Default" ? (
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        Color: {item.ProductColor}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        Color: N/A
                      </span>
                    )}
                    {item.size && item.size !== "One Size" ? (
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        Size: {item.size}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                        Size: N/A
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    EGP {item.price?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-gray-500 text-sm">Qty: {item.qty || 1}</p>
                  <p className="text-gray-600 mt-1">
                    Total: EGP{" "}
                    {((item.price || 0) * (item.qty || 1)).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Design Specifications */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Design Specifications</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Position X</p>
                    <p className="font-medium">
                      {item.designSpecs?.positionX || 50}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Position Y</p>
                    <p className="font-medium">
                      {item.designSpecs?.positionY || 50}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Scale</p>
                    <p className="font-medium">
                      {item.designSpecs?.scale || 1}x
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Rotation</p>
                    <p className="font-medium">
                      {item.designSpecs?.rotation || 0}°
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {isAdmin && (
                  <button
                    onClick={() => handleDownloadDesign(item)}
                    disabled={isDownloading && downloadingItemId === item._id}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-blue-300"
                  >
                    {isDownloading && downloadingItemId === item._id ? (
                      <>
                        <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-1"></span>
                        Downloading...
                      </>
                    ) : (
                      <>
                        <Download size={18} className="inline-block mr-1" />
                        Download Design
                      </>
                    )}
                  </button>
                )}

                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg flex items-center hover:bg-purple-700">
                  <Printer size={18} className="mr-2" />
                  Print Ready File
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Order Totals */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Order Summary</h2>
        <div className="border-t pt-4">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Subtotal</span>
            <span>EGP {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Shipping</span>
            <span>EGP {shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-2 border-t border-gray-200 font-bold text-lg">
            <span>Total</span>
            <span>EGP {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Status History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Status History</h2>
          <div className="space-y-4">
            {order.statusHistory.map((status, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-blue-100 rounded-full p-2 mr-3">
                  <Clock size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{status.status}</p>
                  <p className="text-gray-500 text-sm">
                    {format(new Date(status.timestamp), "PPP p")}
                  </p>
                  {status.details && (
                    <p className="text-gray-600 mt-1">{status.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      <StatusUpdateModal
        open={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Order Status"
      >
        <div className="p-4">
          <label className="block text-gray-700 mb-2">Select New Status</label>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Processing">Processing</option>
            <option value="Transferred to delivery partner">
              Transferred to delivery partner
            </option>
            <option value="Shipping">Shipping</option>
            <option value="Received">Received</option>
            <option value="On the way">On the way</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <div className="flex justify-end mt-6 gap-2">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md flex items-center"
            >
              <X size={18} className="mr-1" />
              Cancel
            </button>

            <button
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus || newStatus === order.status}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center disabled:bg-blue-300"
            >
              {isUpdatingStatus ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-1" />
                  Update Status
                </>
              )}
            </button>
          </div>
        </div>
      </StatusUpdateModal>
    </div>
  );
};

export default AdminOrderDetails;
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfAdmin, updateOrderStatus } from "../redux/actions/order";
import { Link } from "react-router-dom";
import { DownloadCloud, Eye, Filter, Search } from 'lucide-react';
import { toast } from "react-toastify";

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  const { adminOrders, isLoading, error } = useSelector((state) => state.order);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await dispatch(getAllOrdersOfAdmin());
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch orders");
      }
    };
    fetchOrders();
  }, [dispatch]);

  // Filter and search logic
  const filteredOrders =
    adminOrders?.filter((order) => {
      const matchesSearch =
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cart?.[0]?.DesignTitle?.toLowerCase().includes(
          searchTerm.toLowerCase()
        );

      const matchesFilter =
        filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesFilter;
    }) || [];

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  const handleDownload = async (orderId) => {
    try {
      // Implement your download logic here
      toast.success("Design downloaded successfully");
    } catch (error) {
      toast.error("Failed to download design");
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus(orderId, newStatus));
      toast.success("Order status updated successfully");
      // Refresh orders
      dispatch(getAllOrdersOfAdmin());
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Orders Management
          </h1>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search orders by ID, customer name, or design..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="Processing">Processing</option>
                <option value="Transferred to delivery partner">
                  Transferred
                </option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid gap-4">
          {currentOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Order #{order._id.slice(0, 8)}
                  </h3>
                  <p className="text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
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
                    <select
                      onChange={(e) =>
                        handleStatusUpdate(order._id, e.target.value)
                      }
                      className="px-2 py-1 border border-gray-200 rounded-lg text-sm"
                      value={order.status}
                    >
                      <option value="Processing">Processing</option>
                      <option value="Transferred to delivery partner">
                        Transferred
                      </option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Link to={`/admin/order/${order._id}`}>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye size={20} />
                      View Details
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDownload(order._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <DownloadCloud size={20} />
                    Download Design
                  </button>
                </div>
              </div>

              {/* Order Summary */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-600">
                      Customer: {order.user?.name}
                    </p>
                    <p className="text-gray-600">
                      Items: {order.cart?.length || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-800">
                      Total: EGP {order.totalPrice?.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-4 py-2 rounded-lg ${
                  currentPage === index + 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardOrders;
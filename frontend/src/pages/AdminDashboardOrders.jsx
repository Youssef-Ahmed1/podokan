import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfAdmin } from "../redux/actions/order";
import { Link } from "react-router-dom";
import { DownloadCloud, Eye, Filter, Search } from 'lucide-react';
import Loader from "../components/Layout/Loader";
import { DesignDownloader } from '../utils/designDownload';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  const { adminOrders, adminOrderLoading } = useSelector((state) => state.order)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await dispatch(getAllOrdersOfAdmin());
      } catch (error) {
        toast.error("Failed to fetch orders. Please try again.");
        // Optionally redirect to login if authentication failed
        if (error?.response?.status === 401) {
          navigate("/admin-login");
        }
      }
    };
    fetchOrders();
  }, [dispatch]);

  // Filter and search logic
  const filteredOrders = adminOrders?.filter(order => {
    const matchesSearch = order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders?.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil((filteredOrders?.length || 0) / ordersPerPage);

  // Status badge style
  const getStatusStyle = (status) => {
    const styles = {
      "Processing": "bg-blue-100 text-blue-800",
      "Transferred to delivery partner": "bg-yellow-100 text-yellow-800",
      "Delivered": "bg-green-100 text-green-800",
      "Refund Processing": "bg-orange-100 text-orange-800",
      "Refund Success": "bg-purple-100 text-purple-800",
      "Cancelled": "bg-red-100 text-red-800"
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };
  const handleDownload = async (item) => {
    try {
      const result = await DesignDownloader.downloadSingleDesign(item);
      if (result) {
        toast.success('Design downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download design');
    }
  };
  const handleBulkDownload = async () => {
    try {
      setIsLoading(true);
      const results = await DesignDownloader.downloadOrderDesigns(order);
      
      // Show summary toast
      if (results.success.length > 0) {
        toast.success(`Successfully downloaded ${results.success.length} designs`);
      }
      if (results.failed.length > 0) {
        toast.warning(`Failed to download ${results.failed.length} designs`);
      }
    } catch (error) {
      console.error('Bulk download error:', error);
      toast.error(error.message || 'Failed to download designs');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="w-full p-4 min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Orders Management</h1>
          
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search orders..."
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
                <option value="Transferred to delivery partner">Transferred</option>
                <option value="Delivered">Delivered</option>
                <option value="Refund Processing">Refund Processing</option>
                <option value="Refund Success">Refund Success</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <Filter size={20} />
                Filter
              </button>
            </div>
          </div>

     {/* Orders Grid */}
     {adminOrderLoading ? (
          <Loader />
        ) : (
          <div className="grid gap-4">
            {currentOrders?.map((order) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        Order #{order._id.slice(0, 8)}
                      </h3>
                      <p className="text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getStatusStyle(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    
                    <div className="flex gap-3">
                  <Link to={`/admin/order/${order._id}`}>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Eye size={20} />
                      View Details
                    </button>
                  </Link>
                  <button 
  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
  onClick={() => handleDownload(order)}
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
                        <p className="text-gray-600">Items: {order.cart?.length || 0}</p>
                        <p className="text-gray-600">Customer: {order.user?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-800">
                          Total: EGP{order.totalPrice}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {[...Array(totalPages)].map((_, index) => (
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
    </div>
  );
};

export default AdminDashboardOrders;
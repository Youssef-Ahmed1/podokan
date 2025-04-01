import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  adminUpdateOrderStatus,
  clearErrors,
} from "../../redux/actions/order";
import { Link } from "react-router-dom";
import {
  Eye,
  Search,
  AlertCircle,
  Package,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../components/Layout/Loader"; // Corrected relative path
import { format } from "date-fns";
import { ORDER_STATUSES } from "../constants/orderStatuses";

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  const {
    adminOrders = [],
    isLoading,
    error,
    isUpdating,
  } = useSelector((state) => state.order);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 15; // Keep 15 for admin view

  useEffect(() => {
    // Fetch data on mount
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

  useEffect(() => {
    // Show and clear error from Redux state
    if (error) {
      toast.error(`Error: ${error}`, { autoClose: 5000 });
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // Memoized filtering
  const filteredOrders = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    return adminOrders.filter((order) => {
      if (!order?._id) return false;
      const lowerSearch = searchTerm.toLowerCase();
      const idMatch = order._id.toLowerCase().includes(lowerSearch);
      const customerMatch =
        order.user?.name?.toLowerCase().includes(lowerSearch) || false;
      const designMatch =
        order.cart?.some((item) =>
          item?.DesignTitle?.toLowerCase().includes(lowerSearch)
        ) || false;
      const statusMatch =
        filterStatus === "all" || order.status === filterStatus;
      return (idMatch || customerMatch || designMatch) && statusMatch;
    });
  }, [adminOrders, searchTerm, filterStatus]);

  // Pagination Calculation
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Handlers
  const paginate = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const handleRefresh = () => dispatch(getAllOrdersOfAdmin());
  const handleStatusUpdate = (orderId, newStatus, currentStatus) => {
    if (newStatus !== currentStatus && !isUpdating) {
      dispatch(adminUpdateOrderStatus(orderId, newStatus));
    }
  };

  // Initial Loading State
  if (isLoading && !adminOrders?.length) return <Loader />;

  // Conditional Rendering Component/Function
  const renderContent = () => {
    if (!isLoading && error && !adminOrders?.length) {
      // Failed initial load
      return (
        <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            Failed to Load
          </h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className="mr-2" /> Retry
          </button>
        </div>
      );
    }
    if (!isLoading && !error && !adminOrders?.length) {
      // Load successful, but no orders
      return (
        <div className="p-6 text-center bg-blue-50 rounded-lg border border-blue-100">
          <Package size={48} className="mx-auto text-blue-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Orders Found
          </h2>
          <p className="text-gray-500">System has no orders.</p>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto hover:bg-blue-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className="mr-2" /> Refresh
          </button>
        </div>
      );
    }
    if (filteredOrders.length === 0) {
      // Orders exist, but none match filter
      return (
        <div className="p-6 text-center bg-white rounded-lg shadow border border-gray-200">
          <Search size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No Matching Orders
          </h2>
          <p className="text-gray-500">No orders found for filter.</p>
        </div>
      );
    }
    // Render Table
    return (
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total (EGP)</th>
              <th className="px-4 py-3 min-w-[200px]">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr
                key={order._id}
                className="bg-white border-b hover:bg-gray-50"
              >
                <td className="px-4 py-2 font-medium">
                  #{order._id.slice(-8)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {format(new Date(order.createdAt), "PP")}
                </td>
                <td
                  className="px-4 py-2 truncate max-w-[150px]"
                  title={order.user?.name}
                >
                  {order.user?.name || "N/A"}
                </td>
                <td className="px-4 py-2 text-center">
                  {order.cart?.length || 0}
                </td>
                <td className="px-4 py-2 font-medium text-right">
                  {order.totalPrice?.toFixed(2)}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(
                        order._id,
                        e.target.value,
                        order.status
                      )
                    }
                    disabled={isUpdating}
                    className="w-full p-1 border border-gray-300 rounded-md text-xs focus:ring-blue-400 bg-white disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {Object.values(ORDER_STATUSES).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <Link
                    to={`/admin/order/${order._id}`}
                    title="View"
                    className="inline-block p-1.5 text-blue-600 hover:bg-blue-100 rounded-full"
                  >
                    <Eye size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders ({filteredOrders.length})
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-300 text-sm"
            >
              <option value="all">All Statuses</option>{" "}
              {Object.values(ORDER_STATUSES).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {/* Error message shown only if data exists but refresh failed */}
          {error && adminOrders?.length > 0 && (
            <p className="text-red-500 text-sm mt-2">
              Error fetching updates: {error}
            </p>
          )}
        </div>

        {renderMainContent()}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 text-sm">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              <ChevronLeft size={14} className="mr-1" /> Prev
            </button>
            <span>
              {" "}
              Page {currentPage} of {totalPages}{" "}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center"
            >
              Next <ChevronRight size={14} className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardOrders;

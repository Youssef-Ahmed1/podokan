// AdminDashboardOrders.jsx

import React, { useEffect, useState, useMemo } from "react"; // useMemo added
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  adminUpdateOrderStatus,
  clearErrors,
} from "../redux/actions/order"; 
import { Link } from "react-router-dom";
import { DownloadCloud, Eye, Filter, Search, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../components/Layout/Loader"; // Assuming Loader path

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  // Use state slice 'order' as defined in reducer setup
  const {
    adminOrders,
    isLoading,
    error: orderError,
  } = useSelector((state) => state.order);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [localError, setLocalError] = useState(null);
  const ordersPerPage = 10;

  useEffect(() => {
    setLocalError(null); // Clear local error on mount/reload
    dispatch(clearErrors()); // Clear Redux error on mount/reload

    const fetchOrders = () => {
      dispatch(getAllOrdersOfAdmin()).catch((err) => {
        console.error("Failed to fetch admin orders on load:", err);
        // Error is toasted by action, set local error based on Redux state
      });
    };
    fetchOrders();

    // Cleanup errors on unmount
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  // Sync Redux error to local state
  useEffect(() => {
    if (orderError) {
      setLocalError(orderError);
    }
  }, [orderError]);

  // Filter and search logic - Use memoization for performance
  const safeAdminOrders = useMemo(
    () => (Array.isArray(adminOrders) ? adminOrders : []),
    [adminOrders]
  );
  const filteredOrders = useMemo(() => {
    return safeAdminOrders.filter((order) => {
      if (!order || !order._id) return false;
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch =
        order._id.toLowerCase().includes(lowerSearch) ||
        order.user?.name?.toLowerCase().includes(lowerSearch) ||
        order.cart?.some((item) =>
          item?.DesignTitle?.toLowerCase().includes(lowerSearch)
        ); // Check cart safely

      const matchesFilter =
        filterStatus === "all" || order.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [safeAdminOrders, searchTerm, filterStatus]);

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Paginate function
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Example handleDownload (assuming action exists or implement logic)
  const handleDownload = async (orderId, itemId) => {
    toast.info("Download not implemented yet.");
    // try {
    //    await dispatch(adminDownloadDesign(orderId, itemId)); // Dispatch your download action
    // } catch (error) {
    //    // Toast handled by action
    // }
  };

  // ** FIX: Use the CORRECT imported action 'adminUpdateOrderStatus' **
  const handleStatusUpdate = async (orderId, newStatus) => {
    console.log(`Admin updating order ${orderId} to status ${newStatus}`);
    try {
      // Use the specific admin action
      await dispatch(adminUpdateOrderStatus(orderId, newStatus)); // <--- CHANGE HERE
      // Success toast handled by action
      // The action should refresh the order list in Redux state automatically
    } catch (error) {
      // Error toast handled by action
      console.error("Admin Status update dispatch failed:", error);
    }
  };

  // Handler to refresh orders manually
  const refreshOrders = () => {
    setLocalError(null);
    dispatch(clearErrors());
    setCurrentPage(1); // Reset to first page on refresh
    dispatch(getAllOrdersOfAdmin()).catch((err) =>
      console.error("Manual refresh failed:", err)
    );
  };

  // ----- Render Logic -----

  if (isLoading && safeAdminOrders.length === 0) {
    // Show loader only on initial load
    return <Loader />;
  }

  // Handle Error State
  if (localError && safeAdminOrders.length === 0) {
    // Show error primarily if initial load fails
    return (
      <div className="w-full p-6 text-center">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-lg mx-auto"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{localError}</span>
        </div>
        <button
          onClick={refreshOrders}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded flex items-center mx-auto"
        >
          <RefreshCw size={16} className="mr-2" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Orders Management
          </h1>
          <button
            onClick={refreshOrders}
            disabled={isLoading}
            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            title="Refresh Orders"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
            ) : (
              <RefreshCw size={20} />
            )}
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search orders by ID, customer, design..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none transition min-w-[150px]"
            >
              <option value="all">All Statuses</option>
              <option value="Processing">Processing</option>
              <option value="Transferred to delivery partner">
                Transferred
              </option>
              <option value="Shipping">Shipping</option>
              <option value="Received">Received</option>
              <option value="On the way">On the way</option>
              <option value="Delivered">Delivered</option>
              <option value="Processing refund">Processing Refund</option>
              <option value="Refund Approved">Refund Approved</option>
              <option value="Refund Rejected">Refund Rejected</option>
              <option value="Refund Success">Refund Success</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table/Grid */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              No orders match the current criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Order
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Customer
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Items
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Total
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/order/${order._id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          #{order._id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Simplified status dropdown directly in the table */}
                        <select
                          onChange={(e) =>
                            handleStatusUpdate(order._id, e.target.value)
                          }
                          className="px-2 py-1 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full"
                          value={order.status} // Reflect current status
                          // Add styling based on status maybe?
                        >
                          <option value="Processing">Processing</option>
                          <option value="Transferred to delivery partner">
                            Transferred
                          </option>
                          <option value="Shipping">Shipping</option>
                          <option value="Received">Received</option>
                          <option value="On the way">On the way</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Processing refund">
                            Processing Refund
                          </option>
                          <option value="Refund Approved">
                            Refund Approved
                          </option>
                          <option value="Refund Rejected">
                            Refund Rejected
                          </option>
                          <option value="Refund Success">Refund Success</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                        {order.cart?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        EGP {(order.totalPrice ?? 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                        <Link
                          to={`/admin/order/${order._id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <Eye size={18} className="inline" />
                        </Link>
                        {/* Add simplified download icon if needed, details view has better context */}
                        {/* <button onClick={() => handleDownload(order._id, order.cart?.[0]?._id)} // Example: download first item
                                    className="text-blue-600 hover:text-blue-900" title="Download Design (First Item)">
                                   <DownloadCloud size={18} className="inline"/>
                               </button> */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && filteredOrders.length > 0 && (
          <div className="mt-6 flex justify-center items-center space-x-1">
            {/* Previous Button */}
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>

            {/* Page Numbers Logic (Example: show limited pages) */}
            {Array.from({ length: totalPages }, (_, index) => index + 1)
              // Basic pagination - show current, first, last, and neighbors
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
              )
              .map((page, index, arr) => (
                <React.Fragment key={page}>
                  {index > 0 && page !== arr[index - 1] + 1 && (
                    <span className="px-2 py-1 text-sm text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => paginate(page)}
                    className={`px-3 py-1 rounded-md text-sm font-medium border ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600 z-10"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}

            {/* Next Button */}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardOrders;

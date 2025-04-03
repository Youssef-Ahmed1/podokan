import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Eye,
  RefreshCw,
  Search,
  Frown,
  Info,
  Package,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrdersOfShop, clearErrors } from "../../redux/actions/order"; // Adjust path
import Loader from "../../components/Layout/Loader"; // Adjust path
import { format } from "date-fns";
import { ORDER_STATUSES } from "../../constants/orderStatuses.js"; // Adjust path

const AllOrders = () => {
  const dispatch = useDispatch();
  const {
    shopOrders = [],
    isLoading,
    error,
  } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10); // Items per page

  const fetchOrders = useCallback(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop());
    } else {
      console.warn("Seller info not available for fetching orders.");
    }
  }, [dispatch, seller?._id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]); // Fetch on mount/seller change

  useEffect(() => {
    // Handle errors
    if (error) {
      toast.error(`Error fetching orders: ${error}`);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(shopOrders)) return [];
    return shopOrders.filter((order) => {
      if (!order?._id) return false;
      const lowerSearch = searchTerm.toLowerCase();
      const idMatch =
        order._id.toLowerCase().includes(lowerSearch) ||
        order._id.slice(-8).toLowerCase().includes(lowerSearch);
      const customerMatch =
        order.user?.name?.toLowerCase().includes(lowerSearch) || false;
      const designMatch =
        order.cart?.some((item) =>
          item?.DesignTitle?.toLowerCase().includes(lowerSearch)
        ) || false; // Search seller's items
      const statusMatch =
        filterStatus === "all" || order.status === filterStatus;
      return (idMatch || customerMatch || designMatch) && statusMatch;
    });
  }, [shopOrders, searchTerm, filterStatus]);

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginate = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRefresh = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setCurrentPage(1);
    fetchOrders();
  };

  if (isLoading && shopOrders.length === 0) return <Loader />;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header & Controls */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {" "}
              My Shop Orders ({filteredOrders.length}){" "}
            </h1>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
              title="Refresh Orders"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
              />
            </button>
          </div>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm transition-colors"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-300 focus:border-blue-300 text-sm transition-colors"
            >
              <option value="all">All Statuses</option>
              {Object.values(ORDER_STATUSES).map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          {error && shopOrders.length > 0 && (
            <p className="text-red-500 text-xs mt-2 pl-1">
              Could not refresh orders: {error}
            </p>
          )}
        </div>

        {/* Orders List / Status Messages */}
        <div className="space-y-4">
          {!isLoading && error && shopOrders.length === 0 ? (
            <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
              <Frown size={48} className="mx-auto text-red-400 mb-4" />
              <h2 className="text-xl font-semibold text-red-700 mb-2">
                Failed to Load Orders
              </h2>
              <p className="text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" /> Retry
              </button>
            </div>
          ) : !isLoading && shopOrders.length === 0 ? (
            <div className="p-6 text-center bg-blue-50 rounded-lg border border-blue-100">
              <Package size={48} className="mx-auto text-blue-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No Orders Yet
              </h2>
              <p className="text-gray-500">You haven't received any orders.</p>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={16} className="mr-2" /> Refresh
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-lg shadow border border-gray-200">
              <Info size={48} className="mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No Matching Orders
              </h2>
              <p className="text-gray-500">
                No orders found for the current filter.
              </p>
            </div>
          ) : (
            currentOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 overflow-hidden"
              >
                <div className="p-4 md:p-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
                    <div>
                      <Link
                        to={`/order/${order._id}`}
                        className="hover:underline"
                      >
                        <h3 className="text-md font-semibold text-gray-800 inline-flex items-center gap-1.5">
                          <Package size={16} className="text-gray-500" /> Order
                          #{order._id.slice(-8)}
                        </h3>
                      </Link>
                      <p className="text-gray-500 text-xs mt-1">
                        {format(new Date(order.createdAt), "PP 'at' p")}
                      </p>
                      <p className="text-gray-700 mt-1 text-xs">
                        Customer: {order.user?.name || "N/A"}
                      </p>
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-2 mt-2 md:mt-0 w-full md:w-auto">
                      <span
                        className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${
                          order.status === "Processing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "Cancelled" ||
                              order.status === "Refund Rejected"
                            ? "bg-red-100 text-red-800"
                            : order.status?.includes("Refund")
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {order.status}
                      </span>
                      <Link to={`/order/${order._id}`}>
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md flex items-center hover:bg-blue-700 transition-colors">
                          <Eye size={14} className="mr-1" /> View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                  {order.cart?.length > 0 && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      <h4 className="text-xs font-medium text-gray-600 mb-2">
                        Your Item(s):
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {order.cart.map((item) => (
                          <div
                            key={item._id || Math.random()}
                            className="flex items-start gap-2 bg-gray-50 p-2 rounded text-xs border border-gray-100"
                          >
                            {item.designImage?.url && (
                              <div className="w-10 h-10 rounded bg-white border border-gray-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                <img
                                  src={item.designImage.url}
                                  alt={item.DesignTitle || "Design"}
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                            )}
                            <div className="overflow-hidden flex-grow">
                              <p
                                className="font-medium text-gray-800 truncate"
                                title={item.DesignTitle}
                              >
                                {item.DesignTitle || "Untitled"}
                              </p>
                              <p className="text-gray-500 truncate">
                                {item.ProductType} - {item.ProductColor} -{" "}
                                {item.size}
                              </p>
                              <p className="text-gray-600 mt-0.5">
                                Qty: {item.qty} &times; EGP{" "}
                                {(item.price ?? 0).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end items-center mt-3 pt-3 border-t border-gray-100">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Order Total</p>
                      <p className="text-md font-semibold text-gray-800">
                        EGP {(order.totalPrice ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6 text-sm">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors"
            >
              <ArrowLeft size={14} className="mr-1" /> Prev
            </button>
            <span className="text-gray-600">
              {" "}
              Page {currentPage} of {totalPages}{" "}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center transition-colors"
            >
              Next <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrders;

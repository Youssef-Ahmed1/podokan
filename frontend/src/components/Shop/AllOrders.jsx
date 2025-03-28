import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Eye, RefreshCw, Search, PackageOpen } from "lucide-react"; // Replaced Clock with PackageOpen
import { toast } from "react-toastify";
import { getAllOrdersOfShop, clearErrors } from "../../redux/actions/order"; // Import clearErrors
import Loader from "../Layout/Loader"; // Assuming Loader component exists

const AllOrders = () => {
  const dispatch = useDispatch();
  // Get relevant state: orders, loading status, and error message
  const {
    shopOrders,
    isLoading,
    error: orderError,
  } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller); // To check if seller is loaded

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [localError, setLocalError] = useState(null); // Use local state for UI errors

  // Memoized function to load orders
  const loadOrders = useCallback(async () => {
    console.log("Attempting to load shop orders...");
    setLocalError(null); // Clear previous errors
    dispatch(clearErrors()); // Clear redux error state

    try {
      // The action now handles token checks and returns a shape component can use
      await dispatch(getAllOrdersOfShop());
      console.log("getAllOrdersOfShop dispatched");
      // Redux state (shopOrders, isLoading, orderError) will update automatically
    } catch (err) {
      // Error is already handled and toasted within the action,
      // but we might set local error based on the redux state later
      console.error("Error caught in component after dispatch:", err);
      // No need to toast again here, action does it.
    }
  }, [dispatch]);

  // Effect to load orders when seller is available or refresh is triggered
  useEffect(() => {
    // Only load if seller info is present (avoids calls before login)
    if (seller?._id) {
      console.log("Seller loaded, initiating order fetch.");
      loadOrders();
    } else {
      console.log("Seller not loaded, skipping order fetch.");
      // Optionally set an error if seller should be loaded but isn't
      // setLocalError("Seller information is not available. Please log in again.");
    }

    // Cleanup Redux error state on unmount
    return () => {
      dispatch(clearErrors());
    };
  }, [seller, loadOrders, dispatch]); // Depend on seller and loadOrders

  // Effect to sync Redux error state to local state for display
  useEffect(() => {
    if (orderError) {
      setLocalError(orderError);
      // Don't clear Redux error here immediately, might be needed elsewhere
    }
  }, [orderError]);

  // Filter and search logic - ensure shopOrders is treated as array
  const safeShopOrders = Array.isArray(shopOrders) ? shopOrders : [];
  const filteredOrders = useMemo(() => {
    // Memoize filtering
    return safeShopOrders.filter((order) => {
      if (!order || !order._id) return false; // Basic safety check

      const orderIdMatch = order._id
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const customerNameMatch = order.user?.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      // Robust check for cart items and design title
      const designTitleMatch = order.cart?.some((item) =>
        item?.DesignTitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesSearch =
        orderIdMatch || customerNameMatch || designTitleMatch;

      const matchesFilter =
        filterStatus === "all" || order.status === filterStatus;

      return matchesSearch && matchesFilter;
    });
  }, [safeShopOrders, searchTerm, filterStatus]); // Recalculate only when dependencies change

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Function to go to specific page
  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // ----- Render Logic -----

  // Show loader if loading OR if seller isn't loaded yet (initial state)
  if (isLoading || !seller?._id) {
    // Distinguish initial load vs refresh?
    console.log(
      "Rendering Loader: isLoading=",
      isLoading,
      "seller loaded=",
      !!seller?._id
    );
    return <Loader />;
  }

  // **FIX: Show detailed error message with Retry button**
  if (localError) {
    return (
      <div className="w-full h-full flex flex-col justify-center items-center p-6 text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6 max-w-lg">
          <h3 className="font-bold text-lg mb-2">Failed to Load Orders</h3>
          <p>{localError}</p>
          <p className="mt-2 text-sm">
            This might be due to authentication issues or network problems.
          </p>
        </div>
        <button
          onClick={() => {
            setLocalError(null); // Clear local error state first
            loadOrders(); // Attempt to reload
          }}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  // **FIX: Handle case where orders array is empty AFTER successful load**
  if (safeShopOrders.length === 0) {
    return (
      <div className="w-full flex justify-center items-center p-6 text-center">
        <div className="bg-gray-50 p-8 rounded-lg shadow-sm max-w-md">
          <PackageOpen size={52} className="mx-auto text-gray-400 mb-5" />
          <h2 className="text-xl font-semibold mb-2 text-gray-700">
            No Orders Found
          </h2>
          <p className="text-gray-500">
            Your shop doesn't have any orders matching the current filters yet.
          </p>
          {filterStatus !== "all" || searchTerm !== "" ? (
            <button
              onClick={() => {
                setFilterStatus("all");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="mt-4 text-sm text-blue-600 hover:underline"
            >
              Clear Filters
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // --- Main Orders Display ---
  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header and Controls */}
        <div className="mb-6 md:flex md:justify-between md:items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Shop Orders
          </h1>
          <button
            onClick={loadOrders}
            title="Refresh Orders"
            className="p-2 rounded-full text-blue-600 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            disabled={isLoading} // Disable refresh button while loading
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600"></div>
            ) : (
              <RefreshCw size={18} />
            )}
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Design..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }} // Reset page on search
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }} // Reset page on filter change
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition duration-150"
          >
            <option value="all">All Statuses</option>
            <option value="Processing">Processing</option>
            <option value="Transferred to delivery partner">Transferred</option>
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

        {/* Orders Grid/List */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No orders match your current search or filter criteria.
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
                      Order ID
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
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 transition duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.user?.name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.status === "Delivered"
                              ? "bg-green-100 text-green-800"
                              : order.status === "Processing"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "Cancelled" ||
                                order.status === "Refund Rejected"
                              ? "bg-red-100 text-red-800"
                              : order.status?.includes("Refund")
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status || "Unknown"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {order.cart?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        EGP {order.totalPrice?.toFixed(2) || "0.00"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link
                          to={`/order/${order._id}`}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && filteredOrders.length > 0 && (
          <div className="mt-6 flex justify-center items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {/* Page Numbers (simplified) */}
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>

            {/* Next Button */}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrders;

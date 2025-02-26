// AllOrders.jsx - Production-ready version without debug tools
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Search, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { server } from "../../server";

const AllOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    orders: reduxOrders,
    isLoading: reduxLoading,
    error: reduxError,
  } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Fetch orders using multiple methods for reliability
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        // First try redux approach
        const reduxResult = await dispatch(getAllOrdersOfShop());

        if (reduxResult?.success && reduxResult?.orders?.length > 0) {
          return; // Redux was successful, no need for direct API call
        }

        // If redux didn't get orders, try direct API call as fallback
        const token =
          localStorage.getItem("seller_token") || localStorage.getItem("token");

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await axios.get(`${server}/order/get-seller-orders`, {
          withCredentials: true,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setOrders(response.data.orders || []);
        } else {
          throw new Error(response.data.message || "Failed to fetch orders");
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.message;
        setError(errorMsg);

        // Handle authentication errors
        if (
          errorMsg.includes("authentication") ||
          errorMsg.includes("token") ||
          err.response?.status === 401
        ) {
          toast.error("Authentication error. Please login again.");
          setTimeout(() => navigate("/shop-login"), 2000);
        } else {
          toast.error(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [dispatch, navigate]);

  // Use either redux data or direct API data
  const displayOrders = reduxOrders?.length > 0 ? reduxOrders : orders;

  // Filter and search
  const filteredOrders =
    displayOrders?.filter((order) => {
      // Handle search
      const searchMatches =
        order._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.cart?.[0]?.DesignTitle?.toLowerCase().includes(
          searchTerm.toLowerCase()
        );

      // Handle status filter
      const statusMatches =
        filterStatus === "all" || order.status === filterStatus;

      return searchMatches && statusMatches;
    }) || [];

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Handle refresh
  const handleRefresh = () => {
    dispatch(getAllOrdersOfShop());
  };

  if (loading || reduxLoading) {
    return (
      <div className="w-full flex justify-center items-center h-64">
        <div className="w-10 h-10 border-b-2 border-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  const showError = error || reduxError;
  if (showError && !displayOrders.length) {
    return (
      <div className="w-full p-4">
        <div className="bg-red-50 p-4 rounded-lg text-red-600 mb-4">
          {showError}
        </div>
        <button
          onClick={handleRefresh}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"
        >
          <RefreshCw size={16} className="mr-2" /> Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Shop Orders</h1>
            <button
              onClick={handleRefresh}
              className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by order ID or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
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
              <option value="Shipping">Shipping</option>
              <option value="Received">Received</option>
              <option value="On the way">On the way</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {displayOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 mb-4">No orders found for your shop</p>
            {seller?._id && (
              <p className="text-sm text-gray-400">Shop ID: {seller._id}</p>
            )}
          </div>
        ) : currentOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500">
              No orders match your search criteria
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {currentOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Order #{order._id?.slice(0, 8)}
                    </h3>
                    <p className="text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${
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
                  </div>

                  <Link to={`/dashboard/order/${order._id}`}>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Eye size={20} />
                      View Details
                    </button>
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-600">
                        Customer: {order.user?.name || "N/A"}
                      </p>

                      {order.cart && order.cart.length > 0 ? (
                        <>
                          <p className="text-gray-600">
                            Items: {order.cart.length}
                          </p>
                          <p className="text-gray-600">
                            Product: {order.cart[0]?.ProductType || "N/A"}
                          </p>
                          {order.cart[0]?.size && (
                            <p className="text-gray-600">
                              Size: {order.cart[0].size}
                            </p>
                          )}
                          {order.cart[0]?.ProductColor && (
                            <p className="text-gray-600">
                              Color: {order.cart[0].ProductColor}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-600">No items found</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-800">
                        Total: EGP {order.totalPrice?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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

export default AllOrders;

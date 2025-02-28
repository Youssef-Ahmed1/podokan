// dashboard/AllOrders.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Eye, RefreshCw, Search, Clock } from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrdersOfShop } from "../../redux/actions/order";

const AllOrders = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, loading } = useSelector((state) => state.order);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [error, setError] = useState(null);

  // Load orders using Redux
  const loadOrders = async () => {
    try {
      setError(null);
      await dispatch(getAllOrdersOfShop());
    } catch (err) {
      console.error("Error loading shop orders:", err);
      setError(err.message || "Failed to load orders");
      toast.error(err.message || "Failed to load orders");
    }
  };

  useEffect(() => {
    loadOrders();
  }, [dispatch]);

  // Filter and search
  const filteredOrders =
    orders?.filter((order) => {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 p-4 rounded-lg text-red-600 mb-4">
          {error}
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto"
        >
          <RefreshCw size={16} className="mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-gray-50 p-6 rounded-lg">
          <Clock size={48} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-gray-600">You don't have any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Shop Orders</h1>
          <button
            onClick={loadOrders}
            className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
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
            <option value="Transferred to delivery partner">Transferred</option>
            <option value="Shipping">Shipping</option>
            <option value="Received">Received</option>
            <option value="On the way">On the way</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {currentOrders.map((order) => (
          <div key={order._id} className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <div className="flex items-center">
                  <h3 className="text-lg font-semibold">
                    Order #{order._id.slice(0, 8)}
                  </h3>
                  <span
                    className={`ml-3 px-3 py-1 text-xs rounded-full font-medium ${
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
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(order.createdAt).toLocaleDateString()}{" "}
                  {new Date(order.createdAt).toLocaleTimeString()}
                </p>
                <p className="text-gray-700 mt-2">
                  Customer: {order.user?.name || "N/A"}
                </p>
              </div>

              <Link to={`/dashboard/order/${order._id}`}>
                <button className="mt-4 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded flex items-center hover:bg-blue-700">
                  <Eye size={16} className="mr-2" />
                  View Details
                </button>
              </Link>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {order.cart.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {item.designImage && (
                      <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden">
                        <img
                          src={item.designImage.url || item.designImage}
                          alt={item.DesignTitle}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">
                        {item.DesignTitle || "Design"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.ProductType || "N/A"}
                        {item.ProductColor ? ` - ${item.ProductColor}` : ""}
                        {item.size ? ` - ${item.size}` : ""}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.qty || 1} × EGP{" "}
                        {item.price?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div>
                  <p className="text-gray-600">Items: {order.cart.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Total: EGP {order.totalPrice?.toFixed(2) || "0.00"}
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
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-4 py-2 rounded ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllOrders;

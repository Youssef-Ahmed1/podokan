// frontend/src/components/Shop/AllOrders.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { Eye, RefreshCw, Search, PackageOpen } from "lucide-react";
import { toast } from "react-toastify";
import { getAllOrdersOfShop, clearErrors } from "../../redux/actions/order";
import Loader from "../Layout/Loader"; // Adjust path if necessary

const AllOrders = () => {
  const dispatch = useDispatch();
  const {
    shopOrders = [],
    isLoading = false,
    error: orderError = null,
  } = useSelector((state) => state.order || {});
  const { seller } = useSelector((state) => state.seller || {});
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [localError, setLocalError] = useState(null);

  const loadOrders = useCallback(async () => {
    console.log("Loading shop orders...");
    setLocalError(null);
    dispatch(clearErrors());
    try {
      await dispatch(getAllOrdersOfShop());
    } catch (err) {
      console.error("Comp dispatch ERR:", err);
    }
  }, [dispatch]);

  useEffect(() => {
    if (seller?._id) loadOrders();
    return () => {
      dispatch(clearErrors());
    };
  }, [seller?._id, loadOrders, dispatch]);
  useEffect(() => {
    if (orderError) setLocalError(orderError);
  }, [orderError]);

  const filteredOrders = useMemo(() => {
    return shopOrders.filter((order) => {
      if (!order?._id) return false;
      const ls = searchTerm.toLowerCase();
      const mSearch =
        order._id.toLowerCase().includes(ls) ||
        order.user?.name?.toLowerCase().includes(ls) ||
        order.cart?.some((i) => i?.DesignTitle?.toLowerCase().includes(ls));
      const mFilter = filterStatus === "all" || order.status === filterStatus;
      return mSearch && mFilter;
    });
  }, [shopOrders, searchTerm, filterStatus]);

  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(
    indexOfFirstOrder,
    indexOfLastOrder
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const paginate = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  if (isLoading || !seller?._id) return <Loader />;
  if (localError)
    return (
      <div className="...">
        <div className="...">ERR:{localError}</div>
        <button
          onClick={() => {
            setLocalError(null);
            loadOrders();
          }}
        >
          <RefreshCw />
          Try Again
        </button>
      </div>
    );
  if (shopOrders.length === 0)
    return (
      <div className="...">
        <PackageOpen />
        No Orders
      </div>
    );

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {" "}
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:flex md:justify-between md:items-center">
          {" "}
          {/* Header */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
            Shop Orders
          </h1>
          <button
            onClick={loadOrders}
            disabled={isLoading}
            className="p-2 rounded-full..."
          >
            {" "}
            {isLoading ? (
              <div className="animate-spin ..." />
            ) : (
              <RefreshCw size={18} />
            )}{" "}
          </button>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {" "}
          {/* Search/Filter */}
          <div className="relative flex-1">
            <Search />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search..."
              className="..."
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="..."
          >
            {" "}
            <option value="all">All</option> {/* Status options */}{" "}
          </select>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          {" "}
          {/* Table */}
          {filteredOrders.length === 0 ? (
            <div className="p-6 text-center ...">No matches.</div>
          ) : (
            <div className="overflow-x-auto">
              {" "}
              <table className="min-w-full divide-y">
                {" "}
                <thead className="bg-gray-50">
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Cust</th>
                    <th>Status</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Actions</th>
                  </tr>
                </thead>{" "}
                <tbody className="bg-white divide-y">
                  {" "}
                  {currentOrders.map((o) => (
                    <tr key={o._id}>
                      {" "}
                      <td>#{o._id.slice(0, 8)}</td>{" "}
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>{" "}
                      <td>{o.user?.name}</td>{" "}
                      <td>
                        <span className="..."> {o.status} </span>
                      </td>{" "}
                      <td>{o.cart?.length}</td>{" "}
                      <td>EGP {o.totalPrice?.toFixed(2)}</td>{" "}
                      <td>
                        <Link to={`/order/${o._id}`}>
                          <Eye /> View
                        </Link>
                      </td>{" "}
                    </tr>
                  ))}{" "}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {totalPages > 1 && filteredOrders.length > 0 && (
          <div className="mt-6 flex justify-center ...">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}{" "}
        {/* Pagination */}
      </div>
    </div>
  );
};
export default AllOrders;

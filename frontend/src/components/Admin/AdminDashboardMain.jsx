import React, { useEffect, useMemo, useCallback } from "react";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { MdBorderClear, MdPeopleOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  clearErrors as clearOrderErrors,
} from "../../redux/actions/order";
import {
  getAllSellers,
  clearErrors as clearSellerErrors,
} from "../../redux/actions/sellers";
import Loader from "../Layout/Loader";
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Box, CircularProgress, Typography, IconButton } from "@mui/material";
import { Eye, RefreshCw } from "lucide-react"; // Icons

const AdminDashboardMain = () => {
  const dispatch = useDispatch();
  const {
    adminOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);
  const {
    sellers = [],
    isLoading: sellersLoading,
    error: sellersError,
  } = useSelector((state) => state.seller); // Assuming seller slice exists

  const fetchDashboardData = useCallback(() => {
    dispatch(getAllOrdersOfAdmin());
    dispatch(getAllSellers()); // Fetch sellers
  }, [dispatch]);

  useEffect(() => {
    fetchDashboardData(); // Initial fetch
  }, [fetchDashboardData]);

  useEffect(() => {
    if (ordersError) {
      toast.error(`Orders Error: ${ordersError}`);
      dispatch(clearOrderErrors());
    }
    if (sellersError) {
      toast.error(`Sellers Error: ${sellersError}`);
      // Check if clearSellerErrors exists before dispatching
      if (typeof clearSellerErrors === "function") {
        dispatch(clearSellerErrors());
      }
    }
  }, [dispatch, ordersError, sellersError]);

  const dashboardStats = useMemo(() => {
    const validOrders = Array.isArray(adminOrders) ? adminOrders : [];
    const validSellers = Array.isArray(sellers) ? sellers : [];

    // Example calculation: Total value of delivered orders (adjust logic as needed)
    const totalRevenue = validOrders
      .filter((o) => o.status === "Delivered") // Filter for delivered orders
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Example: Admin's cut (e.g., 10% of total delivered revenue)
    const adminBalance = (totalRevenue * 0.1).toFixed(2);

    return {
      adminBalance,
      totalSellers: validSellers.length,
      totalOrders: validOrders.length,
      totalRevenue: totalRevenue.toFixed(2), // Add total revenue if needed
    };
  }, [adminOrders, sellers]);

  const latestOrdersRows = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    // Sort by date descending and take top 10
    return [...adminOrders] // Create a shallow copy to avoid mutating state
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map((o) => ({
        id: o._id,
        customer: o.user?.name || "N/A",
        itemsQty: o.cart?.length || 0,
        total: `EGP ${Number(o.totalPrice || 0).toFixed(2)}`,
        status: o.status || "N/A",
        date: o.createdAt ? format(new Date(o.createdAt), "PP") : "-",
      }));
  }, [adminOrders]);

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (p) => `#${p.value.slice(-6)}`,
    },
    { field: "date", headerName: "Date", width: 100 },
    { field: "customer", headerName: "Customer", width: 150, flex: 1 },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Processing"
              ? "bg-blue-100 text-blue-800"
              : p.value === "Delivered"
              ? "bg-green-100 text-green-800"
              : p.value === "Cancelled"
              ? "bg-red-100 text-red-800"
              : p.value?.includes("Refund")
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "View",
      width: 70,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <Link to={`/admin/order/${params.id}`} title="View Details">
          <IconButton size="small">
            <Eye className="text-blue-600 hover:text-blue-800" />
          </IconButton>
        </Link>
      ),
    },
  ];

  const isLoading = ordersLoading || sellersLoading;

  // Show loader only if both are loading and have no data yet
  if (isLoading && adminOrders.length === 0 && sellers.length === 0)
    return <Loader />;

  return (
    <div className="w-full p-4 md:p-6">
      <div className="flex justify-between items-center pb-4">
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
          Overview
        </h3>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw
            size={18}
            className={
              isLoading ? "animate-spin text-blue-600" : "text-gray-600"
            }
          />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <AiOutlineMoneyCollect size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Admin Earnings (Est.)
              </h4>
              <h5 className="text-xl font-semibold text-gray-800">
                EGP {dashboardStats.adminBalance}
              </h5>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <MdPeopleOutline size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Sellers
              </h4>
              <h5 className="text-xl font-semibold text-gray-800">
                {dashboardStats.totalSellers}
              </h5>
            </div>
          </div>
          <Link
            to="/admin-sellers"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block pl-1"
          >
            Manage Sellers
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full mr-4">
              <MdBorderClear size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Orders
              </h4>
              <h5 className="text-xl font-semibold text-gray-800">
                {dashboardStats.totalOrders}
              </h5>
            </div>
          </div>
          <Link
            to="/admin-orders"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block pl-1"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* Latest Orders Table */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-8">
        Latest Orders
      </h3>
      <div className="w-full bg-white rounded-lg shadow border border-gray-200">
        <Box sx={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={latestOrdersRows}
            columns={columns}
            pageSizeOptions={[10]} // Fixed page size for this view
            paginationModel={{ page: 0, pageSize: 10 }} // Control pagination model
            disableRowSelectionOnClick
            autoHeight={false} // Use the Box height
            loading={isLoading}
            slots={{
              loadingOverlay: CustomLoadingOverlay,
              noRowsOverlay: () => (
                <CustomNoRowsOverlay message="No recent orders found." />
              ),
            }}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f9fafb",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              },
              "& .MuiDataGrid-cell": { fontSize: "0.8rem" },
            }}
          />
        </Box>
      </div>
    </div>
  );
};
export default AdminDashboardMain;

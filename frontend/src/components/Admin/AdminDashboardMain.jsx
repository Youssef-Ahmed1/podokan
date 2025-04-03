// frontend/src/components/Admin/AdminDashboardMain.jsx
import React, { useEffect, useMemo, useCallback } from "react";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { MdBorderClear, MdPeopleOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  clearErrors as clearOrderErrors,
} from "../../redux/actions/order"; // Adjust path if needed
import {
  getAllSellers,
  clearErrors as clearSellerErrors,
} from "../../redux/actions/sellers"; // Adjust path if needed
import Loader from "../Layout/Loader"; // Adjust path if needed
import { format } from "date-fns";
import { toast } from "react-toastify";
import { Box, CircularProgress, Typography, IconButton } from "@mui/material";
import { Eye, RefreshCw, Package } from "lucide-react"; // Added Package icon

// --- Custom DataGrid Overlays ---
function CustomLoadingOverlay() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.7)", // Optional overlay background
      }}
    >
      <CircularProgress />
    </Box>
  );
}

function CustomNoRowsOverlay({ message = "No data available." }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        p: 2,
      }}
    >
      <Package size={48} style={{ color: "#9ca3af", marginBottom: "1rem" }} />
      <Typography variant="body1" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
}
// --- End Custom Overlays ---

const AdminDashboardMain = () => {
  const dispatch = useDispatch();
  // Select relevant state slices
  const {
    adminOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);
  const {
    sellers = [],
    isLoading: sellersLoading,
    error: sellersError,
  } = useSelector((state) => state.seller); // Assuming 'seller' slice holds sellers list

  // Fetch data using useCallback for stability
  const fetchDashboardData = useCallback(() => {
    dispatch(getAllOrdersOfAdmin());
    dispatch(getAllSellers());
  }, [dispatch]);

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle API errors
  useEffect(() => {
    if (ordersError) {
      toast.error(`Orders Fetch Error: ${ordersError}`);
      dispatch(clearOrderErrors());
    }
    if (sellersError) {
      toast.error(`Sellers Fetch Error: ${sellersError}`);
      // Ensure clearSellerErrors exists before calling
      if (typeof clearSellerErrors === "function") {
        dispatch(clearSellerErrors());
      } else {
        console.warn("clearSellerErrors action not found.");
      }
    }
  }, [dispatch, ordersError, sellersError]);

  // Calculate dashboard statistics safely
  const dashboardStats = useMemo(() => {
    const validOrders = Array.isArray(adminOrders) ? adminOrders : [];
    const validSellers = Array.isArray(sellers) ? sellers : [];

    const totalRevenue = validOrders
      .filter((o) => o.status === "Delivered") // Only count delivered orders for revenue
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

    // Example: 10% admin cut
    const adminBalance = (totalRevenue * 0.1).toFixed(2);

    return {
      adminBalance,
      totalSellers: validSellers.length,
      totalOrders: validOrders.length,
      totalRevenue: totalRevenue.toFixed(2),
    };
  }, [adminOrders, sellers]);

  // Prepare rows for the latest orders DataGrid
  const latestOrdersRows = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    return [...adminOrders] // Create copy before sorting
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Sort descending by creation date
      .slice(0, 10) // Take the first 10
      .map((o) => ({
        id: o._id,
        customer: o.user?.name || "N/A",
        itemsQty: o.cart?.length || 0,
        total: `EGP ${Number(o.totalPrice || 0).toFixed(2)}`,
        status: o.status || "N/A",
        date: o.createdAt ? format(new Date(o.createdAt), "PP") : "-", // Format date nicely
      }));
  }, [adminOrders]);

  // Define columns for the DataGrid
  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        renderCell: (p) => `#${p.value.slice(-6)}`,
      },
      { field: "date", headerName: "Date", width: 100 },
      { field: "customer", headerName: "Customer", width: 150, flex: 1 }, // Flex allows column to grow
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
        renderCell: (
          p // Conditional styling for status
        ) => (
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
            {p.value || "N/A"}
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
        renderCell: (
          params // Link to detailed order view
        ) => (
          <Link to={`/admin/order/${params.id}`} title="View Details">
            <IconButton size="small">
              <Eye className="text-blue-600 hover:text-blue-800 transition-colors" />
            </IconButton>
          </Link>
        ),
      },
    ],
    []
  ); // Empty dependency array as columns don't depend on changing state here

  // Determine overall loading state
  const isLoading = ordersLoading || sellersLoading;

  // Conditional rendering for initial loading state
  if (isLoading && adminOrders.length === 0 && sellers.length === 0) {
    return <Loader />;
  }

  // Main component render
  return (
    <div className="w-full p-4 md:p-6 bg-gray-50 min-h-screen">
      {" "}
      {/* Added bg and min-height */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b border-gray-200">
        {" "}
        {/* Added border */}
        <h3 className="text-xl md:text-2xl font-semibold text-gray-800">
          Dashboard Overview
        </h3>
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {" "}
        {/* Increased gap and margin */}
        {/* Admin Earnings Card */}
        <div className="bg-white shadow rounded-lg p-5 border border-gray-100 flex items-center gap-4">
          {" "}
          {/* Adjusted padding/gap */}
          <div className="p-3 bg-green-100 rounded-full">
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
        {/* Total Sellers Card */}
        <div className="bg-white shadow rounded-lg p-5 border border-gray-100">
          <div className="flex items-center gap-4 mb-2">
            {" "}
            {/* Added margin */}
            <div className="p-3 bg-blue-100 rounded-full">
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
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Manage Sellers
          </Link>
        </div>
        {/* Total Orders Card */}
        <div className="bg-white shadow rounded-lg p-5 border border-gray-100">
          <div className="flex items-center gap-4 mb-2">
            {" "}
            {/* Added margin */}
            <div className="p-3 bg-purple-100 rounded-full">
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
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Manage Orders
          </Link>
        </div>
      </div>
      {/* Latest Orders Table */}
      <h3 className="text-lg font-semibold text-gray-800 mb-3 mt-6">
        {" "}
        {/* Adjusted margin */}
        Latest Orders (Recent 10)
      </h3>
      <div className="w-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        {" "}
        {/* Added overflow hidden */}
        <Box sx={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={latestOrdersRows}
            columns={columns}
            pageSizeOptions={[10]} // Keep fixed size for dashboard view
            paginationModel={{ page: 0, pageSize: 10 }}
            disableRowSelectionOnClick
            autoHeight={false} // Important: Use the Box height
            loading={isLoading}
            slots={{
              loadingOverlay: CustomLoadingOverlay,
              noRowsOverlay: () => (
                <CustomNoRowsOverlay message="No recent orders found." />
              ),
            }}
            sx={{
              border: "none", // Remove grid border
              "& .MuiDataGrid-columnHeaders": {
                bgcolor: "#f9fafb",
                textTransform: "uppercase",
                fontSize: "0.75rem",
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.8rem",
                borderBottom: "1px solid #f0f0f0",
              }, // Lighter cell border
              "& .MuiDataGrid-footerContainer": {
                borderTop: "1px solid #e0e0e0",
              }, // Optional footer border
            }}
          />
        </Box>
      </div>
    </div>
  );
};
export default AdminDashboardMain;

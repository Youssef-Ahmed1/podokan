// frontend/src/pages/Admin/AdminDashboardOrders.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  adminUpdateOrderStatus,
  clearErrors,
} from "../redux/actions/order"; // Adjust path
import { Link } from "react-router-dom";
import { Eye, Search, Package, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../components/Layout/Loader"; // Adjust path
import { format } from "date-fns";
import { DataGrid } from "@mui/x-data-grid";
import {
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Button,
} from "@mui/material";
import { ORDER_STATUSES } from "../constants/orderStatuses"; // Adjust path

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
        background: "rgba(255, 255, 255, 0.7)",
        zIndex: 1,
      }}
    >
      <CircularProgress />
    </Box>
  );
}
function CustomNoRowsOverlay({ message = "No orders found." }) {
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

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  const {
    adminOrders = [],
    isLoading,
    error,
    isUpdating,
    adminTotalOrders = 0,
    adminLimit = 15,
  } = useSelector((state) => state.order);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: adminLimit,
  });

  const fetchAdminOrders = useCallback(() => {
    const apiPage = paginationModel.page + 1;
    const apiLimit = paginationModel.pageSize;
    dispatch(getAllOrdersOfAdmin(apiPage, apiLimit));
  }, [dispatch, paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: adminLimit }));
  }, [adminLimit]);

  useEffect(() => {
    if (error) {
      toast.error(`Order Operation Error: ${error}`);
      dispatch(clearErrors());
    }
    return () => {
      if (error) dispatch(clearErrors());
    };
  }, [error, dispatch]);

  // Client-Side filtering
  const filteredOrdersForCurrentPage = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    return adminOrders.filter((order) => {
      if (!order?._id) return false;
      const lowerSearch = searchTerm.toLowerCase();
      const idMatch =
        order._id.toLowerCase().includes(lowerSearch) ||
        order._id.slice(-8).toLowerCase().includes(lowerSearch);
      const customerMatch =
        order.user?.name?.toLowerCase().includes(lowerSearch) || false;
      const statusMatch =
        filterStatus === "all" || order.status === filterStatus;
      return (idMatch || customerMatch) && statusMatch;
    });
  }, [adminOrders, searchTerm, filterStatus]);

  const handleStatusUpdate = (orderId, newStatus, currentStatus) => {
    if (newStatus === currentStatus || isUpdating) return;
    dispatch(adminUpdateOrderStatus(orderId, newStatus)).catch(() => {});
  };

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  // Prepare Rows for DataGrid - Log the source object 'o'
  const rows = useMemo(() => {
    console.log(
      "[AdminDashboardOrders] Generating rows from adminOrders:",
      adminOrders
    ); // Log the source data
    return adminOrders.map((o, index) => {
      // Use adminOrders directly
      // Log each object being mapped
      console.log(`[AdminDashboardOrders] Mapping order at index ${index}:`, o);
      return {
        id: o._id, // Expects: string
        date: o.createdAt, // Expects: date string like "2025-01-21T18:33:45.427Z"
        customer: o.user?.name || "N/A", // Expects: string
        itemsQty: o.cart?.length || 0, // Expects: number
        total: o.totalPrice, // Expects: number like 1265
        status: o.status, // Expects: string like "Received"
      };
    });
  }, [adminOrders]); // Depend only on adminOrders for this mapping

  // Column Definitions (Restored original with formatters)
  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        renderCell: (params) => `#${params.value?.slice(-6) || "N/A"}`, // Added null check for safety
      },
      {
        field: "date",
        headerName: "Date",
        width: 110,
        type: "date", // Use date type for sorting
        valueGetter: (value) => (value ? new Date(value) : null), // Convert string to Date object
        renderCell: (params) =>
          params.value ? format(params.value, "PP") : "N/A", // Format the Date object
      },
      { field: "customer", headerName: "Customer", width: 180, flex: 1 },
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
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => `EGP ${Number(value || 0).toFixed(2)}`, // Format number as currency
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 200,
        flex: 0.8,
        sortable: false,
        renderCell: (
          params // Use MUI Select for inline status update
        ) => (
          <Select
            value={params.value || ""}
            onChange={(e) =>
              handleStatusUpdate(params.id, e.target.value, params.value)
            }
            size="small"
            variant="outlined"
            disabled={isUpdating}
            fullWidth
            sx={{
              fontSize: "0.8rem",
              height: "35px",
              bgcolor: "background.paper",
              ".MuiSelect-select": { py: 0.8, px: 1 },
              ".MuiOutlinedInput-notchedOutline": {
                border: "1px solid #e0e0e0",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#bdbdbd",
              },
              "&.Mui-disabled": { bgcolor: "#f5f5f5", opacity: 0.7 },
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }}
          >
            {Object.values(ORDER_STATUSES).map((stat) => (
              <MenuItem key={stat} value={stat} sx={{ fontSize: "0.8rem" }}>
                {stat}
              </MenuItem>
            ))}
          </Select>
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
          params // Link to Admin Order Detail page
        ) => (
          <Link to={`/admin/order/${params.id}`} title="View Details">
            <IconButton size="small">
              <Eye className="text-blue-600 hover:text-blue-800" />
            </IconButton>
          </Link>
        ),
      },
    ],
    [isUpdating] // Re-memoize columns if isUpdating changes
  );

  console.log(
    "[AdminDashboardOrders] Passing to DataGrid -> rows:",
    rows,
    "rowCount:",
    adminTotalOrders
  ); // Log final props

  // Use initial loading state only if data hasn't arrived yet
  if (isLoading && adminOrders.length === 0 && adminTotalOrders === 0) {
    return <Loader />;
  }

  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        {/* Header & Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders Management ({adminTotalOrders})
            </h1>
            <button
              onClick={fetchAdminOrders}
              disabled={isLoading || isUpdating}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
              title="Refresh Current Page Data"
            >
              <RefreshCw
                size={18}
                className={isLoading || isUpdating ? "animate-spin" : ""}
              />
            </button>
          </div>
          {/* Filters remain client-side for current page */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search ID or Customer on current page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 text-sm outline-none"
              />
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              size="small"
              sx={{
                minWidth: 180,
                height: "42px",
                bgcolor: "background.paper",
              }}
              displayEmpty
            >
              <MenuItem value="all">
                <em>All Statuses</em>
              </MenuItem>
              {Object.values(ORDER_STATUSES).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </div>
          {error && !isLoading && (
            <p className="text-red-500 text-sm mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertTriangle size={16} /> Failed to load orders: {error}
            </p>
          )}
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <Box sx={{ height: "70vh", width: "100%" }}>
            <DataGrid
              rows={rows} // Use the generated rows
              columns={columns} // Use the restored columns
              rowCount={adminTotalOrders || 0} // Total count for pagination
              loading={isLoading || isUpdating}
              pageSizeOptions={[15, 30, 50, 100]}
              paginationModel={paginationModel}
              paginationMode="server"
              onPaginationModelChange={handlePaginationModelChange}
              disableRowSelectionOnClick
              autoHeight={false}
              slots={{
                loadingOverlay: CustomLoadingOverlay,
                noRowsOverlay: () => (
                  <CustomNoRowsOverlay
                    message={
                      isLoading
                        ? "Loading..."
                        : adminTotalOrders === 0
                        ? "No orders found in the system."
                        : rows.length === 0 &&
                          (searchTerm || filterStatus !== "all")
                        ? "No orders match filters on this page."
                        : // Check if rows is empty BUT totalOrders is not, indicating a potential rendering issue
                        rows.length === 0 && adminTotalOrders > 0
                        ? "Processing data..."
                        : "No data available."
                    }
                  />
                ),
              }}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": {
                  bgcolor: "#f9fafb",
                  fontWeight: "bold",
                },
                "& .MuiDataGrid-cell": { borderBottom: "1px solid #e0e0e0" },
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e0e0e0",
                },
              }}
            />
          </Box>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOrders;
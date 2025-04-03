// frontend/src/pages/Admin/AdminDashboardOrders.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  adminUpdateOrderStatus,
  clearErrors,
} from "../redux/actions/order"; // Adjust path
import { Link } from "react-router-dom";
import { Eye, Search, Package, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../../components/Layout/Loader"; // Adjust path
import { format } from "date-fns";
import { DataGrid } from "@mui/x-data-grid";
import {
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
  IconButton,
} from "@mui/material";
import { ORDER_STATUSES } from "../constants/orderStatuses.js";

// Custom Overlays for DataGrid
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

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  // Select pagination state along with orders and loading/error states
  const {
    adminOrders = [],
    isLoading,
    error,
    isUpdating,
    adminTotalOrders, // Total count for pagination
    // adminCurrentPage, // Current page from state (can be used if needed)
    // adminTotalPages, // Total pages from state (can be used if needed)
    adminLimit, // Items per page from state
  } = useSelector((state) => state.order);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  // Local pagination state controlled by DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: adminLimit || 15,
  }); // Use page 0 for MUI, default pageSize

  // Fetching Logic - fetch based on current pagination model
  const fetchAdminOrders = useCallback(() => {
    // Convert MUI page (0-based) to API page (1-based)
    const apiPage = paginationModel.page + 1;
    const apiLimit = paginationModel.pageSize;
    dispatch(getAllOrdersOfAdmin(apiPage, apiLimit));
  }, [dispatch, paginationModel.page, paginationModel.pageSize]);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]); // Fetch when page/pageSize changes

  // Error Handling
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // Filtering Logic (Client-Side - Note: For large datasets, filtering should ideally be done on the backend)
  // This filter runs *after* the backend has returned the paginated data for the *current* page.
  // If you want to filter across ALL orders, you'd need backend filtering support.
  const filteredOrders = useMemo(() => {
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
  }, [adminOrders, searchTerm, filterStatus]); // Depends on the current page's orders

  // Status Update Handler
  const handleStatusUpdate = (orderId, newStatus, currentStatus) => {
    if (newStatus === currentStatus || isUpdating) return;
    dispatch(adminUpdateOrderStatus(orderId, newStatus)).catch(() => {});
  };

  // Handler for DataGrid pagination changes
  const handlePaginationModelChange = (newModel) => {
    // Update local state, which will trigger useEffect -> fetchAdminOrders
    setPaginationModel(newModel);
  };

  // Column Definitions
  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        renderCell: (p) => `#${p.value.slice(-6)}`,
      },
      {
        field: "date",
        headerName: "Date",
        width: 110,
        type: "date",
        valueGetter: (v) => (v ? new Date(v) : null),
        renderCell: (p) => (p.value ? format(p.value, "PP") : "N/A"),
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
        valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 220,
        flex: 0.8,
        sortable: false,
        renderCell: (params) => (
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
        renderCell: (params) => (
          <Link to={`/admin/order/${params.id}`} title="View Details">
            <IconButton size="small">
              <Eye className="text-blue-600 hover:text-blue-800" />
            </IconButton>
          </Link>
        ),
      },
    ],
    [isUpdating]
  ); // Dependency ensures dropdowns are enabled/disabled correctly

  // Prepare Rows for DataGrid (using filtered data if client-side filtering is sufficient)
  // If backend filtering is implemented, use `adminOrders` directly.
  const rows = useMemo(
    () =>
      filteredOrders.map((o) => ({
        id: o._id,
        date: o.createdAt,
        customer: o.user?.name || "N/A",
        itemsQty: o.cart?.length || 0,
        total: o.totalPrice,
        status: o.status,
      })),
    [filteredOrders]
  );

  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        {/* Header & Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            {/* Show total count from Redux state */}
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders Management ({adminTotalOrders})
            </h1>
            <button
              onClick={fetchAdminOrders}
              disabled={isLoading || isUpdating}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
              title="Refresh Orders"
            >
              <RefreshCw
                size={18}
                className={isLoading || isUpdating ? "animate-spin" : ""}
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
                placeholder="Search current page..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm"
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
          {/* Display error if exists */}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <Box sx={{ height: "70vh", width: "100%" }}>
            <DataGrid
              rows={rows} // Use client-filtered rows for current page
              columns={columns}
              rowCount={adminTotalOrders} // ** Use total count from Redux **
              loading={isLoading}
              pageSizeOptions={[15, 30, 50, 100]} // Options for page size
              paginationModel={paginationModel} // Control pagination state
              paginationMode="server" // ** Set to server for backend pagination **
              onPaginationModelChange={handlePaginationModelChange} // Handler to dispatch fetch for new page/size
              disableRowSelectionOnClick
              autoHeight={false} // Use Box height
              slots={{
                loadingOverlay: CustomLoadingOverlay,
                noRowsOverlay: () => (
                  <CustomNoRowsOverlay
                    message={
                      searchTerm || filterStatus !== "all"
                        ? "No orders match filters on this page."
                        : "No orders found."
                    }
                  />
                ),
              }}
              sx={{
                border: "none",
                "& .MuiDataGrid-columnHeaders": { bgcolor: "#f9fafb" },
                "& .MuiDataGrid-cell": { borderBottom: "1px solid #e0e0e0" },
              }}
            />
          </Box>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOrders;
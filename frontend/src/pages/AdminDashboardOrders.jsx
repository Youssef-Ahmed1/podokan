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
} from "@mui/material";
import { ORDER_STATUSES } from "../constants/orderStatuses.js"; // Adjust path

// Custom DataGrid Overlays
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
  const {
    adminOrders = [],
    isLoading,
    error,
    isUpdating,
  } = useSelector((state) => state.order);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 15,
  });
  // Row count state for DataGrid, derived from filtered data
  const [rowCountState, setRowCountState] = useState(0);

  // Fetching Logic
  const fetchAdminOrders = useCallback(() => {
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);
  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  // Error Handling
  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      dispatch(clearErrors());
    }
  }, [error, dispatch]);

  // Filtering Logic (Client-Side)
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
  }, [adminOrders, searchTerm, filterStatus]);

  // Update Row Count for Pagination when Filtered Data Changes
  useEffect(() => {
    setRowCountState(filteredOrders.length);
  }, [filteredOrders]);

  // Handler for Status Update Dropdown
  const handleStatusUpdate = (orderId, newStatus, currentStatus) => {
    if (newStatus === currentStatus || isUpdating) return;
    dispatch(adminUpdateOrderStatus(orderId, newStatus)).catch(() => {
      /* Errors handled by action/toast */
    });
  };

  // DataGrid Column Definitions
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
  ); // Memoize columns, re-render if `isUpdating` changes

  // Prepare Rows for DataGrid based on filtered data
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

  // Main Component Render
  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        {/* Header & Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders Management ({rowCountState})
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
                placeholder="Search by Order ID or Customer..."
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
        </div>

        {/* Data Grid */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <Box sx={{ height: "70vh", width: "100%" }}>
            {" "}
            {/* Ensure Box has height */}
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={rowCountState}
              loading={isLoading}
              pageSizeOptions={[15, 30, 50, 100]}
              paginationModel={paginationModel}
              paginationMode="client" // Using client-side filtering/pagination
              onPaginationModelChange={setPaginationModel}
              disableRowSelectionOnClick
              autoHeight={false} // Use Box height
              slots={{
                loadingOverlay: CustomLoadingOverlay,
                noRowsOverlay: () => (
                  <CustomNoRowsOverlay
                    message={
                      searchTerm || filterStatus !== "all"
                        ? "No orders match filters."
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

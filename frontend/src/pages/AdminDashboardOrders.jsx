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
  // Select admin order state including pagination info from Redux
  const {
    adminOrders = [], // Orders for the current page fetched from backend
    isLoading, // Loading state for the list fetch
    error, // Error state for the list fetch
    isUpdating, // Loading state for status updates
    adminTotalOrders = 0, // Total count of ALL admin orders (for pagination)
    adminLimit = 15, // Default page size (can be overridden by backend response)
  } = useSelector((state) => state.order);

  // Local state for client-side filtering (applies only to current page data)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Local state for MUI DataGrid pagination (0-based page index)
  const [paginationModel, setPaginationModel] = useState({
    page: 0, // MUI DataGrid uses 0-based index
    pageSize: adminLimit, // Initial page size from Redux state or default
  });

  // Fetching Logic - useCallback ensures stability
  const fetchAdminOrders = useCallback(() => {
    const apiPage = paginationModel.page + 1; // Convert 0-based MUI page to 1-based API page
    const apiLimit = paginationModel.pageSize;
    // console.log(`Fetching admin orders - Page: ${apiPage}, Limit: ${apiLimit}`);
    dispatch(getAllOrdersOfAdmin(apiPage, apiLimit));
  }, [dispatch, paginationModel.page, paginationModel.pageSize]);

  // Fetch orders when component mounts or paginationModel state changes
  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]); // Dependency: fetchAdminOrders (which depends on paginationModel)

  // Update local pageSize if adminLimit from Redux changes (e.g., after first fetch)
  useEffect(() => {
    setPaginationModel((prev) => ({ ...prev, pageSize: adminLimit }));
  }, [adminLimit]);

  // Handle Redux errors (for fetching list or updating status)
  useEffect(() => {
    if (error) {
      toast.error(`Order Operation Error: ${error}`);
      dispatch(clearErrors()); // Clear error after showing
    }
    // Cleanup
    return () => {
      if (error) dispatch(clearErrors());
    };
  }, [error, dispatch]);

  // Client-Side filtering (filters ONLY the `adminOrders` currently loaded on the page)
  // For full server-side filtering, backend API needs search/status params
  const filteredOrdersForCurrentPage = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    return adminOrders.filter((order) => {
      if (!order?._id) return false;
      const lowerSearch = searchTerm.toLowerCase();
      // Match ID, Short ID, or Customer Name
      const idMatch =
        order._id.toLowerCase().includes(lowerSearch) ||
        order._id.slice(-8).toLowerCase().includes(lowerSearch);
      const customerMatch =
        order.user?.name?.toLowerCase().includes(lowerSearch) || false;
      // Match Status
      const statusMatch =
        filterStatus === "all" || order.status === filterStatus;
      return (idMatch || customerMatch) && statusMatch;
    });
  }, [adminOrders, searchTerm, filterStatus]); // Filter when data or filter terms change

  // Status Update Handler
  const handleStatusUpdate = (orderId, newStatus, currentStatus) => {
    // Prevent update if status is the same or already updating
    if (newStatus === currentStatus || isUpdating) return;
    // console.log(`Admin updating order ${orderId} status to ${newStatus}`);
    dispatch(adminUpdateOrderStatus(orderId, newStatus))
      // Success/Error toasts are handled by the action
      // Optionally refetch current page after successful update if needed, but Redux update should suffice
      // .then(() => fetchAdminOrders())
      .catch(() => {}); // Errors already handled
  };

  // DataGrid Pagination Model Change Handler
  const handlePaginationModelChange = (newModel) => {
    // Update the local state, which will trigger the useEffect to fetch new data
    // console.log("Pagination model changed:", newModel);
    setPaginationModel(newModel);
  };

  // Column Definitions using useMemo
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
        valueGetter: (value) => (value ? new Date(value) : null), // Ensure value is Date object
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
        valueFormatter: (value) => `EGP ${Number(value || 0).toFixed(2)}`,
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
            value={params.value || ""} // Current status from row data
            onChange={(e) =>
              handleStatusUpdate(params.id, e.target.value, params.value)
            }
            size="small"
            variant="outlined"
            disabled={isUpdating} // Disable while any update is in progress
            fullWidth
            sx={{
              fontSize: "0.8rem",
              height: "35px",
              bgcolor: "background.paper",
              ".MuiSelect-select": { py: 0.8, px: 1 }, // Adjust padding
              ".MuiOutlinedInput-notchedOutline": {
                border: "1px solid #e0e0e0",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#bdbdbd",
              },
              "&.Mui-disabled": { bgcolor: "#f5f5f5", opacity: 0.7 },
            }}
            MenuProps={{ PaperProps: { sx: { maxHeight: 300 } } }} // Limit dropdown height
          >
            {/* Map through available statuses */}
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
    [isUpdating] // Re-memoize columns if isUpdating changes (to enable/disable Select)
  );

  // Prepare Rows for DataGrid using the client-side filtered data for the current page
  const rows = useMemo(
    () =>
      filteredOrdersForCurrentPage.map((o) => ({
        id: o._id,
        date: o.createdAt,
        customer: o.user?.name || "N/A",
        itemsQty: o.cart?.length || 0,
        total: o.totalPrice,
        status: o.status,
      })),
    [filteredOrdersForCurrentPage] // Depends on the filtered data for the current page
  );

  // Initial loading state
  if (isLoading && adminOrders.length === 0) {
    return <Loader />;
  }

  // Main Component Render
  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        {" "}
        {/* Wider max-width for admin tables */}
        {/* Header & Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders Management ({adminTotalOrders}) {/* Show total count */}
            </h1>
            <button
              onClick={fetchAdminOrders} // Refresh current page data
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
          {/* Client-side Filters */}
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
          {/* Display fetch error */}
          {error && !isLoading && (
            <p className="text-red-500 text-sm mt-3 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertTriangle size={16} /> Failed to load orders: {error}
            </p>
          )}
        </div>
        {/* Data Grid - Server-Side Pagination */}
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <Box sx={{ height: "70vh", width: "100%" }}>
            {" "}
            {/* Ensure Box has height */}
            <DataGrid
              rows={rows} // Use the client-side filtered rows for the CURRENT page
              columns={columns}
              rowCount={adminTotalOrders || 0} // ** TOTAL count of orders across all pages **
              loading={isLoading || isUpdating} // Show loading state during fetch or status update
              pageSizeOptions={[15, 30, 50, 100]} // Options for page size
              paginationModel={paginationModel} // Controlled pagination state
              paginationMode="server" // ** Crucial for backend pagination **
              onPaginationModelChange={handlePaginationModelChange} // Handler triggers fetch for new page/size
              disableRowSelectionOnClick
              autoHeight={false} // Use the Box height
              slots={{
                loadingOverlay: CustomLoadingOverlay,
                noRowsOverlay: () => (
                  <CustomNoRowsOverlay
                    message={
                      // Adjust message based on filtering state
                      (searchTerm || filterStatus !== "all") &&
                      adminOrders.length > 0
                        ? "No orders match filters on this page."
                        : adminTotalOrders === 0
                        ? "No orders found in the system."
                        : "No orders found for this page."
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
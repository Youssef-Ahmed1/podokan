// File: frontend/src/pages/shop/AdminDashboardOrders.jsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  adminUpdateOrderStatus,
  clearErrors,
} from "../redux/actions/order";
import { Link } from "react-router-dom";
import {
  Eye,
  Search,
  Package,
  RefreshCw,
  AlertTriangle,
  Loader as LoaderIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../components/Layout/Loader";
import { format } from "date-fns";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Select,
  MenuItem,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
} from "@mui/material";
import { ORDER_STATUSES } from "../constants/orderStatuses";

function CustomLoadingOverlay() {
  return (
    <Box
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.7)",
        zIndex: 4,
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
    console.log(`Fetching admin orders: Page ${apiPage}, Limit ${apiLimit}`);
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
      if (!isLoading) {
        toast.error(`Order Operation Error: ${error}`);
      }
      dispatch(clearErrors());
    }

    const ordersWithMissingUsers = adminOrders.filter(
      (order) => !order?.user?.name
    );
    if (ordersWithMissingUsers.length > 0) {
      console.warn(
        `[AdminDashboardOrders] ${ordersWithMissingUsers.length} order(s) on this page are missing user data:`,
        ordersWithMissingUsers.map((o) => o._id)
      );
    }
  }, [error, dispatch, adminOrders, isLoading]);

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
    if (newStatus === currentStatus || isUpdating || !orderId || !newStatus) {
      console.log(
        `Status update skipped for ${orderId}: New=${newStatus}, Current=${currentStatus}, Updating=${isUpdating}`
      );
      return;
    }
    console.log(
      `Dispatching status update for ${orderId}: ${currentStatus} -> ${newStatus}`
    );
    dispatch(adminUpdateOrderStatus(orderId, newStatus)).catch(
      (updateError) => {
        console.error(`Status update failed for ${orderId}:`, updateError);
      }
    );
  };

  const handlePaginationModelChange = (newModel) => {
    console.log("Pagination change:", newModel);
    if (
      newModel.page !== paginationModel.page ||
      newModel.pageSize !== paginationModel.pageSize
    ) {
      setPaginationModel(newModel);
    }
  };

  const rows = useMemo(() => {
    return filteredOrdersForCurrentPage.map((o, index) => ({
      id: o._id || `unknown-${index}`,
      date: o.createdAt || null,
      customer: o.user?.name || "Unknown Customer",
      itemsQty: Array.isArray(o.cart) ? o.cart.length : 0,
      total: typeof o.totalPrice === "number" ? o.totalPrice : 0,
      status: o.status || "Unknown",
      user: o.user,
    }));
  }, [filteredOrdersForCurrentPage]);

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "ID",
        width: 100,
        renderCell: (params) => `#${params.value?.slice(-6) || "N/A"}`,
      },
      {
        field: "date",
        headerName: "Date",
        width: 110,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (params) =>
          params.value ? format(params.value, "PP") : "N/A",
      },
      {
        field: "customer",
        headerName: "Customer",
        width: 180,
        flex: 1,
        renderCell: (params) => (
          <Tooltip
            title={`ID: ${params.row.user?._id || "N/A"}\nEmail: ${
              params.row.user?.email || "N/A"
            }`}
            arrow
          >
            <span>{params.value}</span>
          </Tooltip>
        ),
      },
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
              bgcolor: isUpdating ? "#f5f5f5" : "background.paper",
              ".MuiSelect-select": { py: 0.8, px: 1 },
              ".MuiOutlinedInput-notchedOutline": {
                border: "1px solid #e0e0e0",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#bdbdbd",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "primary.main",
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
        renderCell: (params) => (
          <Tooltip title="View Order Details">
            <Link to={`/admin/order/${params.id}`}>
              <IconButton size="small">
                <Eye className="text-blue-600 hover:text-blue-800" />
              </IconButton>
            </Link>
          </Tooltip>
        ),
      },
    ],
    [isUpdating, handleStatusUpdate]
  );

  if (isLoading && adminOrders.length === 0 && adminTotalOrders === 0) {
    return <Loader />;
  }

  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders Management ({adminTotalOrders})
            </h1>
            <Tooltip title="Refresh Current Page Data">
              <IconButton
                onClick={fetchAdminOrders}
                disabled={isLoading || isUpdating}
                size="small"
                sx={{
                  bgcolor: "primary.lighter",
                  "&:hover": { bgcolor: "primary.light" },
                }}
              >
                <RefreshCw
                  size={18}
                  className={isLoading ? "animate-spin" : ""}
                />
              </IconButton>
            </Tooltip>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <TextField
              label="Search ID or Customer (on page)"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Search
                    size={18}
                    style={{ marginRight: "8px", color: "#9ca3af" }}
                  />
                ),
              }}
              sx={{ flexGrow: 1, bgcolor: "background.paper" }}
            />
            <FormControl
              size="small"
              sx={{ minWidth: 180, bgcolor: "background.paper" }}
            >
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {Object.values(ORDER_STATUSES).map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          {error && !isLoading && (
            <Typography
              color="error"
              sx={{
                mt: 2,
                p: 1,
                bgcolor: "error.lighter",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <AlertTriangle size={16} /> Failed to load orders: {error}
            </Typography>
          )}
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <Box sx={{ height: "70vh", width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              rowCount={adminTotalOrders || 0}
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
                        : rows.length === 0 && adminTotalOrders > 0
                        ? "No orders on this page."
                        : "No data available."
                    }
                  />
                ),
                toolbar: GridToolbar,
              }}
              slotProps={{
                toolbar: {
                  showQuickFilter: false,
                  printOptions: { disableToolbarButton: true },
                  csvOptions: { disableToolbarButton: false },
                },
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
                "& .MuiDataGrid-toolbarContainer": {
                  padding: "8px",
                  borderBottom: "1px solid #e0e0e0",
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

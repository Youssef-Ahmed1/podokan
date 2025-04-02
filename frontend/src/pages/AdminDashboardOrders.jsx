// frontend/src/pages/Admin/AdminDashboardOrders.jsx
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
  AlertCircle,
  Package,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import Loader from "../components/Layout/Loader";
import { format } from "date-fns";
import { DataGrid } from "@mui/x-data-grid";
// **** FIX: Import IconButton ****
import { Select, MenuItem, IconButton } from "@mui/material";
import { ORDER_STATUSES } from "../constants/orderStatuses";

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();
  const { adminOrders, isLoading, error, isUpdating } = useSelector(
    (state) => state.order
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 15,
  });
  const [localError, setLocalError] = useState(null);
  const [rowCountState, setRowCountState] = useState(0);

  const fetchAdminOrders = useCallback(() => {
    setLocalError(null);
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

  useEffect(() => {
    fetchAdminOrders();
  }, [fetchAdminOrders]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      setLocalError(error);
      dispatch(clearErrors());
    }
    setRowCountState(adminOrders?.length || 0);
  }, [error, dispatch, adminOrders]);

  const filteredOrders = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    return adminOrders.filter((order) => {
      if (!order?._id) return false;
      const lowerSearch = searchTerm.toLowerCase();
      const idMatch = order._id.toLowerCase().includes(lowerSearch);
      const customerMatch =
        order.user?.name?.toLowerCase().includes(lowerSearch) || false;
      const designMatch =
        order.cart?.some((item) =>
          item?.DesignTitle?.toLowerCase().includes(lowerSearch)
        ) || false;
      const statusMatch =
        filterStatus === "all" || order.status === filterStatus;
      return (idMatch || customerMatch || designMatch) && statusMatch;
    });
  }, [adminOrders, searchTerm, filterStatus]);

  const handlePaginationModelChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const handleStatusUpdate = (orderId, newStatus, currentStatus) => {
    if (newStatus === currentStatus || isUpdating) return;
    dispatch(adminUpdateOrderStatus(orderId, newStatus));
  };

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
        width: 100,
        type: "date",
        valueGetter: (v) => (v ? new Date(v) : null),
        valueFormatter: (v) => (v ? format(v, "PP") : ""),
      },
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
        type: "number",
        align: "right",
        headerAlign: "right",
        valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 200,
        flex: 0.8,
        sortable: false,
        renderCell: (params) => (
          <Select
            value={params.value}
            onChange={(e) =>
              handleStatusUpdate(params.id, e.target.value, params.value)
            }
            size="small"
            variant="outlined"
            disabled={isUpdating}
            fullWidth // Make select fill the cell width
            sx={{
              fontSize: "0.75rem",
              ".MuiSelect-select": { py: 0.5, px: 1 },
              ".MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          >
            {Object.values(ORDER_STATUSES).map((stat) => (
              <MenuItem key={stat} value={stat}>
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
          // **** FIX: IconButton was already imported, just ensure correct usage ****
          <IconButton
            component={Link}
            to={`/admin/order/${params.id}`}
            size="small"
            title="View Details"
          >
            <Eye className="text-blue-600" />
          </IconButton>
        ),
      },
    ],
    [isUpdating]
  ); // Dependency added

  const rows = useMemo(
    () =>
      filteredOrders.map((order) => ({
        id: order._id,
        date: order.createdAt,
        customer: order.user?.name || "N/A",
        itemsQty: order.cart?.length || 0,
        total: order.totalPrice,
        status: order.status,
      })),
    [filteredOrders]
  );

  if (isLoading && adminOrders.length === 0) return <Loader />;

  return (
    <div className="w-full p-4 md:p-6 min-h-screen bg-gray-100">
      <div className="max-w-[1400px] mx-auto">
        <div className="mb-6 bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              Orders Management ({rowCountState})
            </h1>
            <button
              onClick={fetchAdminOrders}
              disabled={isLoading}
              className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                size={18}
                className={isLoading ? "animate-spin" : ""}
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
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPaginationModel((prev) => ({ ...prev, page: 0 }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm"
              />
            </div>
            <Select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPaginationModel((prev) => ({ ...prev, page: 0 }));
              }}
              size="small"
              sx={{ minWidth: 180 }}
              displayEmpty
            >
              <MenuItem value="all">
                <em>All Statuses</em>
              </MenuItem>{" "}
              {Object.values(ORDER_STATUSES).map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </Select>
          </div>
          {localError && adminOrders.length > 0 && (
            <p className="text-red-500 text-sm mt-2">Error: {localError}</p>
          )}
        </div>

        {!isLoading && localError && adminOrders.length === 0 ? (
          <div className="p-6 text-center bg-red-50 rounded-lg border border-red-200">
            <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Failed to Load
            </h2>
            <p className="text-red-600">{localError}</p>
            <button
              onClick={fetchAdminOrders}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw size={16} className="mr-2" /> Retry
            </button>
          </div>
        ) : !isLoading && adminOrders.length === 0 ? (
          <div className="p-6 text-center bg-blue-50 rounded-lg border border-blue-100">
            <Package size={48} className="mx-auto text-blue-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Orders Found
            </h2>
            <p className="text-gray-500">No orders in system.</p>
            <button
              onClick={fetchAdminOrders}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center mx-auto hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw size={16} className="mr-2" /> Refresh
            </button>
          </div>
        ) : !isLoading && filteredOrders.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-lg shadow border border-gray-200">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              No Matching Orders
            </h2>
            <p className="text-gray-500">No orders found for filter.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div style={{ height: 650, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pagination
                paginationMode="client" // Set to "server" if using API pagination
                rowCount={rowCountState}
                paginationModel={paginationModel}
                onPaginationModelChange={handlePaginationModelChange}
                pageSizeOptions={[15, 30, 50]}
                loading={isLoading}
                disableRowSelectionOnClick
                autoHeight={false}
                sx={{ "--DataGrid-overlayHeight": "300px", border: "none" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardOrders;
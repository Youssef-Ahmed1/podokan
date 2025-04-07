import React, { useEffect, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Box, Typography, CircularProgress } from "@mui/material";
import { Eye, Package, RefreshCw } from "lucide-react"; // Use Lucide consistently
import Loader from "../Layout/Loader"; // Adjust path
import { getAllOrdersOfShop, clearErrors } from "../../redux/actions/order"; // Adjust path
import { toast } from "react-toastify";
import { format } from "date-fns";

// --- Custom DataGrid Overlays --- (Copied from AdminDashboardMain for consistency)
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

const AllRefundOrders = () => {
  // Select seller-specific orders and relevant state
  const {
    shopOrders = [],
    isLoading,
    error,
  } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();

  // Fetching logic
  const fetchShopOrders = useCallback(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id)); // Action fetches orders for this seller
    }
  }, [dispatch, seller?._id]);

  useEffect(() => {
    fetchShopOrders(); // Fetch on mount/seller change
  }, [fetchShopOrders]);

  // Error Handling
  useEffect(() => {
    if (error) {
      toast.error(`Error loading refund orders: ${error}`);
      dispatch(clearErrors());
    }
    // Cleanup function
    return () => {
      if (error) dispatch(clearErrors());
    };
  }, [error, dispatch]);

  // Filter for refund-related orders from the seller's orders
  const refundOrders = useMemo(
    () =>
      shopOrders?.filter((item) =>
        item.status?.toLowerCase().includes("refund")
      ) || [],
    [shopOrders] // Depend on shopOrders
  );

  const columns = useMemo(
    () => [
      {
        field: "id",
        headerName: "Order ID",
        width: 180,
        renderCell: (p) => `#${p.value.slice(-8)}`, // Show last 8 chars
      },
      {
        field: "status",
        headerName: "Status",
        width: 180,
        renderCell: (
          p // Styling for refund statuses
        ) => (
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              p.value === "Refund Approved"
                ? "bg-green-100 text-green-800"
                : p.value === "Refund Rejected"
                ? "bg-red-100 text-red-800"
                : p.value === "Processing Refund"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800" // Fallback
            }`}
          >
            {p.value}
          </span>
        ),
      },
      {
        field: "itemsQty",
        headerName: "Items",
        type: "number",
        width: 80,
        align: "center",
        headerAlign: "center",
        valueGetter: (value, row) => row.cart?.length || 0, // Calculate items from cart
      },
      {
        field: "total",
        headerName: "Total",
        type: "number",
        width: 130,
        align: "right",
        headerAlign: "right",
        valueFormatter: (value) => `EGP ${Number(value || 0).toFixed(2)}`,
      },
      {
        field: "orderDate",
        headerName: "Date",
        width: 120,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        renderCell: (p) => (p.value ? format(p.value, "PP") : "N/A"),
      },
      {
        field: "actions",
        headerName: "Details",
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <IconButton
            component={Link}
            to={`/order/${params.id}`}
            size="small"
            title="View Order Details"
          >
            <Eye className="text-blue-600 hover:text-blue-800" />
          </IconButton>
        ),
      },
    ],
    []
  ); // Empty dependency array, columns are static

  const rows = useMemo(
    () =>
      refundOrders.map((item) => ({
        id: item._id,
        status: item.status,
        // itemsQty: item.cart?.length || 0, // Calculated in column definition
        cart: item.cart, // Pass cart data for column calculation
        total: item.totalPrice,
        orderDate: item.createdAt,
      })),
    [refundOrders]
  );

  // Show loader only on initial load when there are no orders yet
  if (isLoading && shopOrders.length === 0) {
    return <Loader />;
  }

  return (
    <div className="w-full mx-auto px-4 pt-1 mt-10">
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="p-4 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">
            Refund Requests ({refundOrders.length})
          </h2>
          <button
            onClick={fetchShopOrders}
            disabled={isLoading}
            className="p-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            title="Refresh Refunds"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
        <Box sx={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{
              pagination: { paginationModel: { pageSize: 10 } },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
            autoHeight={false} // Use the Box height
            loading={isLoading} // Show loading indicator on grid
            slots={{
              loadingOverlay: CustomLoadingOverlay,
              noRowsOverlay: () => (
                <CustomNoRowsOverlay message="No refund requests found." />
              ),
            }}
            sx={{
              border: "none", // Remove default border
              "--DataGrid-overlayHeight": "300px", // Adjust overlay height if needed
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#f9fafb" },
            }}
          />
        </Box>
      </div>
    </div>
  );
};

export default AllRefundOrders;

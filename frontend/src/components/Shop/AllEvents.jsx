// frontend/src/components/Shop/AllEvents.jsx
import React, { useEffect, useMemo, useCallback } from "react";
import { IconButton } from "@mui/material"; // Correct MUI v5 import
import { DataGrid } from "@mui/x-data-grid"; // Correct MUI v5 import
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  deleteEvent,
  getAllEventsShop,
  clearErrors,
} from "../../redux/actions/event"; // Ensure actions/reducer exist
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";
import { format } from "date-fns"; // For date formatting

const AllEvents = () => {
  const { events, isLoading, error } = useSelector((state) => state.events); // Assuming this state structure
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors()); // Assuming clearErrors action exists for events
    }
    if (seller?._id) {
      dispatch(getAllEventsShop(seller._id));
    }
  }, [dispatch, seller?._id, error]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Are you sure you want to delete this event?"))
        return;
      try {
        // Dispatch delete action and wait for it (if it's async)
        await dispatch(deleteEvent(id));
        toast.success("Event deleted successfully");
        // List should update via Redux state change, no need for window.location.reload()
      } catch (err) {
        // Handle errors shown potentially via Redux state or toast directly
        toast.error(err?.message || "Failed to delete event");
      }
    },
    [dispatch]
  );

  const columns = useMemo(
    () => [
      // Use product._id for linking if event is tied to a product
      // If event has its own ID different from product, adjust field/link
      { field: "id", headerName: "Event/Product ID", width: 200 },
      { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
      {
        field: "price",
        headerName: "Price",
        width: 100,
        type: "number",
        valueFormatter: (value) => `EGP ${Number(value || 0).toFixed(2)}`, // Format as currency
      },
      {
        field: "Stock",
        headerName: "Stock",
        type: "number",
        width: 80,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "sold",
        headerName: "Sold",
        type: "number",
        width: 100,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "startDate",
        headerName: "Start Date",
        width: 120,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null), // Ensure it's a Date object for sorting/filtering
        valueFormatter: (value) => (value ? format(value, "PP") : "N/A"), // Format date nicely
      },
      {
        field: "endDate",
        headerName: "End Date",
        width: 120,
        type: "date",
        valueGetter: (value) => (value ? new Date(value) : null),
        valueFormatter: (value) => (value ? format(value, "PP") : "N/A"),
      },
      {
        field: "Preview",
        headerName: "Preview",
        width: 80,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => {
          // Link to the product page, marking it as an event view
          // Ensure the product route can handle the `isEvent` query param if needed
          return (
            <IconButton
              component={Link}
              to={`/product/${params.id}?isEvent=true`}
              Size="small"
              title="Preview Event Product"
            >
              <AiOutlineEye className="text-blue-600" />
            </IconButton>
          );
        },
      },
      {
        field: "Delete",
        headerName: "Delete",
        width: 80,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (params) => (
          <IconButton
            onClick={() => handleDelete(params.id)}
            Size="small"
            title="Delete Event"
          >
            <AiOutlineDelete className="text-red-600" />
          </IconButton>
        ),
      },
    ],
    [handleDelete]
  ); // Include handleDelete in dependency array

  const rows = useMemo(
    () =>
      events?.map((item) => ({
        // Ensure your event object has these fields or adjust accordingly
        id: item.product?._id || item._id, // Use product ID if available, fallback to event ID
        name: item.name,
        price: item.discountPrice, // Events usually use discountPrice
        Stock: item.stock,
        sold: item.sold_out || 0,
        startDate: item.startDate,
        endDate: item.Finish_Date, // Verify this field name in your backend model
      })) || [],
    [events]
  );

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-auto px-4 pt-1 mt-10 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold p-4">All Events</h2>
          <div style={{ height: 600, width: "100%" }}>
            {" "}
            {/* Set explicit height for non-autoHeight DataGrid */}
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } }, // MUI v5 pagination setup
              }}
              pageSizeOptions={[10, 25]} // Options for rows per page dropdown
              disableRowSelectionOnClick // Correct prop name for v5+
              autoHeight={false} // Use container height
              loading={isLoading}
              sx={{
                // MUI v5 styling
                "--DataGrid-overlayHeight": "300px", // Adjust loading/no rows overlay height
                border: "none", // Remove default border
                "& .MuiDataGrid-cell": {
                  // py: 1, // Adjust cell padding if needed
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "rgba(0,0,0,.03)", // Light header background
                  // fontWeight: 'bold',
                },
              }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AllEvents;

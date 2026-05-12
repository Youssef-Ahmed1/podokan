// frontend/src/components/Shop/AllEvents.jsx
import React, { useEffect, useCallback } from "react";
import { IconButton } from "@mui/material"; // Changed import
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  deleteEvent,
  getAllEventsShop,
  clearErrors,
} from "../../redux/actions/event";
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";
import { format } from "date-fns"; // For date formatting

const AllEvents = () => {
  const { events, isLoading, error } = useSelector((state) => state.events);
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (seller?._id) dispatch(getAllEventsShop(seller._id));
  }, [dispatch, seller?._id, error]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this event?")) return;
      try {
        await dispatch(deleteEvent(id));
        toast.success("Event deleted");
        // Refresh should happen via Redux state update
      } catch (err) {
        toast.error(err?.message || "Delete failed");
      }
    },
    [dispatch]
  );

  const columns = [
      { field: "id", headerName: "Event Id", width: 150, flex: 0.7 },
      { field: "name", headerName: "Name", minWidth: 180, flex: 1.4 },
      {
          field: "price",
          headerName: "Price",
          width: 100,
          flex: 0.6,
          valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
      },
      {
          field: "Stock",
          headerName: "Stock",
          type: "number",
          width: 80,
          flex: 0.5,
      },
      {
          field: "sold",
          headerName: "Sold",
          type: "number",
          width: 100,
          flex: 0.6,
      },
      {
          field: "startDate",
          headerName: "Start Date",
          width: 120,
          flex: 0.6,
          valueFormatter: (v) => (v ? format(new Date(v), "PP") : "N/A"),
      },
      {
          field: "endDate",
          headerName: "End Date",
          width: 120,
          flex: 0.6,
          valueFormatter: (v) => (v ? format(new Date(v), "PP") : "N/A"),
      },
      {
          field: "Preview",
          headerName: "Preview",
          width: 80,
          sortable: false,
          align: "center",
          renderCell: (params) => (
              <IconButton
                  component={Link}
                  to={`/product/${params.row.id}?isEvent=true`}
                  size="small"
                  title="Preview"
              >
                  <AiOutlineEye className="text-blue-600" />
              </IconButton>
          ),
      },
      {
          field: "Delete",
          headerName: "Delete",
          width: 80,
          sortable: false,
          align: "center",
          renderCell: (params) => (
              <IconButton
                  onClick={() => handleDelete(params.id)}
                  size="small"
                  title="Delete"
              >
                  <AiOutlineDelete className="text-red-600" />
              </IconButton>
          ),
      },
  ];

  const rows =
    events?.map((item) => ({
      id: item._id,
      name: item.name,
      price: item.discountPrice,
      Stock: item.stock,
      sold: item.sold_out || 0,
      startDate: item.startDate,
      endDate: item.Finish_Date, // Check backend model field name
    })) || [];

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-auto px-4 pt-1 mt-10 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold p-4">All Events</h2>
          <div style={{ height: 600, width: "100%" }}>
            <DataGrid
              rows={rows}
              columns={columns}
              initialState={{
                pagination: { paginationModel: { pageSize: 10 } },
              }}
              pageSizeOptions={[10, 25]}
              disableRowSelectionOnClick
              autoHeight={false}
              sx={{ "--DataGrid-overlayHeight": "300px", border: "none" }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AllEvents;

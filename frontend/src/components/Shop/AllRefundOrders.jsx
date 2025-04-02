// frontend/src/components/Shop/AllRefundOrders.jsx
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { Button, IconButton } from "@mui/material"; // Changed import
import Loader from "../Layout/Loader";
import { getAllOrdersOfShop, clearErrors } from "../../redux/actions/order"; 
import { AiOutlineArrowRight } from "react-icons/ai";
import { toast } from "react-toastify";
import { format } from "date-fns";

const AllRefundOrders = () => {
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id, error]);

  const refundOrders = useMemo(
    () => orders?.filter((item) => item.status?.includes("Refund")) || [],
    [orders]
  );

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      width: 220,
      renderCell: (p) => `#${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Refund Success"
              ? "bg-green-100 text-green-800"
              : p.value === "Refund Rejected"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800"
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
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      width: 130,
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    {
      field: "orderDate",
      headerName: "Date",
      width: 120,
      valueFormatter: (v) => (v ? format(new Date(v), "PP") : ""),
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
          title="View Order"
        >
          <AiOutlineArrowRight className="text-blue-600" />
        </IconButton>
      ),
    },
  ];

  const rows = refundOrders.map((item) => ({
    id: item._id,
    itemsQty: item.cart?.length || 0,
    total: item.totalPrice,
    status: item.status,
    orderDate: item.createdAt,
  }));

  return (
    <>
      {isLoading && refundOrders.length === 0 ? ( // Show loader only on initial load
        <Loader />
      ) : (
        <div className="w-full mx-auto px-4 pt-1 mt-10 bg-white shadow rounded-lg">
          <h2 className="text-xl font-semibold p-4">Refund Requests</h2>
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
              loading={isLoading}
              sx={{ "--DataGrid-overlayHeight": "300px", border: "none" }}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AllRefundOrders;

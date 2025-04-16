// frontend/src/components/Admin/AllSellers.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import {
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  DialogContentText,
} from "@mui/material"; // Changed imports
import { RxCross1 } from "react-icons/rx";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { getAllSellers } from "../../redux/actions/sellers";
import { clearErrors } from "../../redux/actions/order"; 

import { Link } from "react-router-dom";
import Loader from "../Layout/Loader"; // Assuming Loader exists

const AllSellers = () => {
  const dispatch = useDispatch();
  const { sellers, isLoading, error } = useSelector((state) => state.seller); // Assuming state structure
  const [open, setOpen] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    dispatch(getAllSellers());
  }, [dispatch, error]);

  const handleDeleteClick = (id) => {
    setSelectedSellerId(id);
    setOpen(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    setOpen(false);
    try {
      const { data } = await axios.delete(
        `${server}/shop/delete-seller/${selectedSellerId}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      dispatch(getAllSellers()); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete seller");
    }
    setSelectedSellerId("");
  }, [selectedSellerId, dispatch]);

  const columns = [
    { field: "id", headerName: "Seller ID", width: 220 },
    { field: "name", headerName: "Name", minWidth: 150, flex: 1 },
    { field: "email", headerName: "Email", minWidth: 180, flex: 1 },
    { field: "address", headerName: "Address", minWidth: 200, flex: 1.2 },
    {
      field: "joinedAt",
      headerName: "Joined",
      width: 120,
      valueFormatter: (v) => (v ? new Date(v).toLocaleDateString() : ""),
    },
    {
      field: "preview",
      headerName: "Preview",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/shop/preview/${params.id}`}
          Size="small"
          title="Preview Shop"
        >
          <AiOutlineEye className="text-blue-600" />
        </IconButton>
      ),
    },
    {
      field: "delete",
      headerName: "Delete",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          onClick={() => handleDeleteClick(params.id)}
          Size="small"
          title="Delete Seller"
        >
          <AiOutlineDelete className="text-red-600" />
        </IconButton>
      ),
    },
  ];

  const rows =
    sellers?.map((item) => ({
      id: item._id,
      name: item?.name || "N/A",
      email: item?.email || "N/A",
      joinedAt: item.createdAt,
      address: item.address || "N/A",
    })) || [];

  return (
    <div className="w-full flex justify-center pt-5">
      <div className="w-[97%]">
        <h3 className="text-[22px] font-Poppins pb-2">All Sellers</h3>
        <div className="w-full min-h-[45vh] bg-white rounded shadow">
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this seller? This action cannot be
              undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default AllSellers;

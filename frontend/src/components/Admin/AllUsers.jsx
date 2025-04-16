// frontend/src/components/Admin/AllUsers.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { AiOutlineDelete } from "react-icons/ai";
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
import { getAllUsers, clearErrors } from "../../redux/actions/user"; // Assuming action exists
import Loader from "../Layout/Loader"; // Assuming Loader exists
import { format } from "date-fns";

const AllUsers = () => {
  const dispatch = useDispatch();
  const { users, isLoading, error } = useSelector((state) => state.user); // Assuming state structure
  const [open, setOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    dispatch(getAllUsers());
  }, [dispatch, error]);

  const handleDeleteClick = (id) => {
    setSelectedUserId(id);
    setOpen(true);
  };

  const handleConfirmDelete = useCallback(async () => {
    setOpen(false);
    try {
      const { data } = await axios.delete(
        `${server}/user/delete-user/${selectedUserId}`,
        { withCredentials: true }
      );
      toast.success(data.message);
      dispatch(getAllUsers()); // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
    setSelectedUserId("");
  }, [selectedUserId, dispatch]);

  const columns = [
    { field: "id", headerName: "User ID", width: 220 },
    { field: "name", headerName: "Name", minWidth: 150, flex: 1 },
    { field: "email", headerName: "Email", minWidth: 180, flex: 1 },
    { field: "role", headerName: "Role", width: 100 },
    {
      field: "joinedAt",
      headerName: "Joined",
      width: 120,
      valueFormatter: (v) => (v ? format(new Date(v), "PP") : ""),
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
          title="Delete User"
        >
          <AiOutlineDelete className="text-red-600" />
        </IconButton>
      ),
    },
  ];

  const rows =
    users?.map((item) => ({
      id: item._id,
      name: item.name,
      email: item.email,
      role: item.role || "user", // Default role if missing
      joinedAt: item.createdAt,
    })) || [];

  return (
    <div className="w-full flex justify-center pt-5">
      <div className="w-[97%]">
        <h3 className="text-[22px] font-Poppins pb-2">All Users</h3>
        <div className="w-full min-h-[45vh] bg-white rounded shadow">
          <div style={{ height: 650, width: "100%" }}>
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
              Are you sure you want to delete this user?
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

export default AllUsers;

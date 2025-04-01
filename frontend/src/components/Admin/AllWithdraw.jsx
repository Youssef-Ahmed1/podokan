// frontend/src/components/Admin/AllWithdraw.jsx
import axios from "axios";
import React, { useEffect, useState, useCallback } from "react";
import { server } from "../../server";
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { BsPencil } from "react-icons/bs";
import { RxCross1 } from "react-icons/rx";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material"; // Changed imports
import styles from "../../styles/styles"; // Keep if used
import { toast } from "react-toastify";
import Loader from "../Layout/Loader"; // Assuming Loader exists
import { format } from "date-fns";

const AllWithdraw = () => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [withdrawData, setWithdrawData] = useState(null); // Store the whole row data
  const [withdrawStatus, setWithdrawStatus] = useState("Processing"); // Default or current status
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const fetchWithdrawals = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: responseData } = await axios.get(
        `${server}/withdraw/get-all-withdraw-request`,
        { withCredentials: true }
      );
      setData(responseData.withdraws || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch withdrawal requests"
      );
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleOpen = (row) => {
    setWithdrawData(row);
    setWithdrawStatus(row.status); // Pre-fill with current status
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setWithdrawData(null);
  };

  const handleSubmit = async () => {
    if (!withdrawData || withdrawStatus === withdrawData.status) {
      handleClose();
      return; // No change or no data
    }
    try {
      await axios.put(
        `${server}/withdraw/update-withdraw-request/${withdrawData.id}`,
        { sellerId: withdrawData.shopId, status: withdrawStatus }, // Send new status
        { withCredentials: true }
      );
      toast.success("Withdraw request updated successfully!");
      fetchWithdrawals(); // Refresh data
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const columns = [
    { field: "id", headerName: "Withdraw ID", width: 220 },
    { field: "name", headerName: "Shop Name", minWidth: 150, flex: 1 },
    { field: "shopId", headerName: "Shop ID", width: 220 },
    {
      field: "amount",
      headerName: "Amount",
      width: 100,
      type: "number",
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Processing"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "createdAt",
      headerName: "Requested At",
      width: 150,
      valueFormatter: (v) => (v ? format(new Date(v), "PPp") : ""),
    },
    {
      field: "actions",
      headerName: "Update",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) =>
        params.row.status === "Processing" ? (
          <IconButton
            onClick={() => handleOpen(params.row)}
            size="small"
            title="Update Status"
          >
            <BsPencil className="text-blue-600" />
          </IconButton>
        ) : null, // Only show update for 'Processing' status
    },
  ];

  const rows =
    data?.map((item) => ({
      id: item._id,
      shopId: item.seller?._id, // Use optional chaining
      name: item.seller?.name || "N/A",
      amount: item.amount,
      status: item.status,
      createdAt: item.createdAt,
    })) || [];

  return (
    <div className="w-full flex items-center pt-5 justify-center">
      <div className="w-[97%]">
        <h3 className="text-[22px] font-Poppins pb-2">
          All Withdrawal Requests
        </h3>
        <div className="w-full bg-white rounded shadow">
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

        {/* Update Status Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
          <DialogTitle>
            Update Withdraw Status
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <RxCross1 />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <p className="text-sm mb-2">
              Withdraw ID: #{withdrawData?.id?.slice(-8)}
            </p>
            <p className="text-sm mb-4">
              Amount: EGP {withdrawData?.amount?.toFixed(2)}
            </p>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={withdrawStatus}
                label="Status"
                onChange={(e) => setWithdrawStatus(e.target.value)}
              >
                <MenuItem value="Processing">Processing</MenuItem>
                <MenuItem value="Succeed">Succeed</MenuItem>{" "}
                {/* Assuming 'Succeed' is the status */}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ padding: "16px 24px" }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={withdrawStatus === withdrawData?.status}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default AllWithdraw;

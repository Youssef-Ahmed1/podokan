// frontend/src/components/Shop/AllCoupons.jsx
import React, { useEffect, useState, useCallback } from "react";
import {
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material"; // Changed imports
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { AiOutlineDelete } from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import { useSelector, useDispatch } from "react-redux"; // Added useDispatch
import styles from "../../styles/styles";
import Loader from "../Layout/Loader";
import { server } from "../../server";
import { toast } from "react-toastify";
import axios from "axios";
// Assuming you have actions for coupons, otherwise keep using axios
// import { createCoupon, deleteCoupon, getShopCoupons } from "../../redux/actions/coupon";

const AllCoupons = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [coupons, setCoupons] = useState([]); // Changed name for clarity
  const [minAmount, setMinAmount] = useState(""); // Use string for inputs
  const [maxAmount, setMaxAmount] = useState(""); // Use string for inputs
  const [selectedProducts, setSelectedProducts] = useState(""); // Use empty string for select default
  const [value, setValue] = useState(""); // Use string for inputs
  const { seller } = useSelector((state) => state.seller);
  const { products } = useSelector((state) => state.products); // Assuming products are loaded elsewhere
  // const dispatch = useDispatch(); // Use if using Redux actions

  const fetchCoupons = useCallback(async () => {
    if (!seller?._id) return;
    setIsLoading(true);
    try {
      const { data } = await axios.get(
        `${server}/coupon/get-coupon/${seller._id}`,
        { withCredentials: true }
      );
      setCoupons(data.couponCodes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch coupons");
      setCoupons([]); // Ensure it's an array on error
    } finally {
      setIsLoading(false);
    }
  }, [seller?._id]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this coupon?")) return;
      try {
        await axios.delete(`${server}/coupon/delete-coupon/${id}`, {
          withCredentials: true,
        });
        toast.success("Coupon deleted successfully!");
        fetchCoupons(); // Refetch after delete
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete coupon");
      }
    },
    [fetchCoupons]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Indicate loading during submit
    try {
      await axios.post(
        `${server}/coupon/create-coupon-code`,
        {
          name,
          minAmount: minAmount ? Number(minAmount) : null, // Convert to number or null
          maxAmount: maxAmount ? Number(maxAmount) : null, // Convert to number or null
          selectedProducts: selectedProducts || null, // Send null if empty
          value: Number(value), // Ensure value is a number
          shopId: seller._id,
        },
        { withCredentials: true }
      );
      toast.success("Coupon created successfully!");
      setOpen(false);
      fetchCoupons(); // Refetch coupons
      // Reset form fields
      setName("");
      setValue("");
      setMinAmount("");
      setMaxAmount("");
      setSelectedProducts("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create coupon");
    } finally {
      setIsLoading(false);
    }
  };

  const columns = [
    { field: "id", headerName: "Id", width: 150, flex: 0.5 },
    { field: "name", headerName: "Coupon Code", minWidth: 180, flex: 1 },
    {
      field: "price",
      headerName: "Value (%)",
      width: 100,
      flex: 0.6,
      type: "number",
    },
    {
      field: "minAmount",
      headerName: "Min Amount",
      width: 120,
      flex: 0.6,
      type: "number",
      valueFormatter: (value) => (value ? `EGP ${value}` : "N/A"),
    },
    {
      field: "maxAmount",
      headerName: "Max Amount",
      width: 120,
      flex: 0.6,
      type: "number",
      valueFormatter: (value) => (value ? `EGP ${value}` : "N/A"),
    },
    {
      field: "Delete",
      headerName: "Delete",
      width: 100,
      sortable: false,
      align: "center",
      headerAlign: "center",
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
    coupons?.map((item) => ({
      id: item._id,
      name: item.name,
      price: item.value, // Keep as number for sorting/filtering
      minAmount: item.minAmount,
      maxAmount: item.maxAmount,
    })) || [];

  return (
    <>
      {isLoading && coupons.length === 0 ? ( // Show loader only on initial load
        <Loader />
      ) : (
        <div className="w-full mx-auto px-4 pt-1 mt-10 bg-white shadow rounded-lg">
          <div className="w-full flex justify-end p-4">
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
            >
              Create Coupon Code
            </Button>
          </div>
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

          {/* Create Coupon Dialog */}
          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>
              Create Coupon Code
              <IconButton
                aria-label="close"
                onClick={() => setOpen(false)}
                sx={{
                  position: "absolute",
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <RxCross1 />
              </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <TextField
                  label="Coupon Code Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Discount Percentage (%)"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  size="small"
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                />
                <TextField
                  label="Min Amount (Optional)"
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  size="small"
                  InputProps={{ inputProps: { min: 0 } }}
                />
                <TextField
                  label="Max Amount (Optional)"
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  fullWidth
                  margin="dense"
                  variant="outlined"
                  size="small"
                  InputProps={{ inputProps: { min: 0 } }}
                />
                <FormControl fullWidth margin="dense" size="small">
                  <InputLabel>Selected Product (Optional)</InputLabel>
                  <Select
                    value={selectedProducts}
                    label="Selected Product (Optional)"
                    onChange={(e) => setSelectedProducts(e.target.value)}
                  >
                    <MenuItem value="">
                      <em>Apply to all products</em>
                    </MenuItem>
                    {products &&
                      products.map((i) => (
                        <MenuItem value={i._id} key={i._id}>
                          {i.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </DialogContent>
              <DialogActions sx={{ padding: "16px 24px" }}>
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create"}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        </div>
      )}
    </>
  );
};

export default AllCoupons;

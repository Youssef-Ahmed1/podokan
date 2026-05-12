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
  Box,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { AiOutlineDelete, AiOutlinePlus } from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import { useSelector } from "react-redux";
import Loader from "../Layout/Loader";
import { server } from "../../server";
import { toast } from "react-toastify";
import axios from "axios";

const AllCoupons = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [selectedProducts, setSelectedProducts] = useState("");
  const [value, setValue] = useState("");
  const { seller } = useSelector((state) => state.seller);
  const { products } = useSelector((state) => state.products); // Assuming products are loaded

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
      setCoupons([]);
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
        toast.success("Coupon deleted!");
        fetchCoupons();
      } catch (error) {
        toast.error(error.response?.data?.message || "Delete failed");
      }
    },
    [fetchCoupons]
  );

  const resetForm = () => {
    setName("");
    setValue("");
    setMinAmount("");
    setMaxAmount("");
    setSelectedProducts("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(
        `${server}/coupon/create-coupon-code`,
        {
          name,
          minAmount: minAmount ? Number(minAmount) : null,
          maxAmount: maxAmount ? Number(maxAmount) : null,
          selectedProducts: selectedProducts || null,
          value: Number(value),
          shopId: seller._id,
        },
        { withCredentials: true }
      );
      toast.success("Coupon created!");
      setOpen(false);
      fetchCoupons();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
      { field: "id", headerName: "Id", width: 150, flex: 0.5 },
      { field: "name", headerName: "Coupon Code", minWidth: 180, flex: 1 },
      {
          field: "value",
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
          valueFormatter: (v) => (v ? `EGP ${v}` : "N/A"),
      },
      {
          field: "maxAmount",
          headerName: "Max Amount",
          width: 120,
          flex: 0.6,
          type: "number",
          valueFormatter: (v) => (v ? `EGP ${v}` : "N/A"),
      },
      {
          field: "selectedProduct",
          headerName: "Product",
          width: 150,
          flex: 1,
          valueGetter: (params) =>
              products?.find((p) => p._id === params.row.selectedProducts)
                  ?.name || "All Products",
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
      value: item.value,
      minAmount: item.minAmount,
      maxAmount: item.maxAmount,
      selectedProducts: item.selectedProducts,
    })) || [];

  return (
      <>
          {isLoading && coupons.length === 0 ? (
              <Loader />
          ) : (
              <div className="w-full mx-auto px-4 pt-1 mt-10 bg-white shadow rounded-lg">
                  <div className="w-full flex justify-end p-4">
                      <Button
                          variant="contained"
                          color="primary"
                          startIcon={<AiOutlinePlus />}
                          onClick={() => {
                              resetForm();
                              setOpen(true);
                          }}
                      >
                          Create Coupon
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
                          sx={{
                              "--DataGrid-overlayHeight": "300px",
                              border: "none",
                          }}
                      />
                  </div>
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
                              sx={{ position: "absolute", right: 8, top: 8 }}
                          >
                              <RxCross1 />
                          </IconButton>
                      </DialogTitle>
                      <form onSubmit={handleSubmit}>
                          <DialogContent dividers>
                              <Box
                                  sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: 2,
                                  }}
                              >
                                  <TextField
                                      label="Coupon Code Name"
                                      value={name}
                                      onChange={(e) => setName(e.target.value)}
                                      required
                                      fullWidth
                                      size="small"
                                  />
                                  <TextField
                                      label="Discount %"
                                      type="number"
                                      value={value}
                                      onChange={(e) => setValue(e.target.value)}
                                      required
                                      fullWidth
                                      size="small"
                                      InputProps={{
                                          inputProps: { min: 1, max: 100 },
                                      }}
                                  />
                                  <TextField
                                      label="Min Amount (Optional)"
                                      type="number"
                                      value={minAmount}
                                      onChange={(e) =>
                                          setMinAmount(e.target.value)
                                      }
                                      fullWidth
                                      size="small"
                                      InputProps={{ inputProps: { min: 0 } }}
                                  />
                                  <TextField
                                      label="Max Amount (Optional)"
                                      type="number"
                                      value={maxAmount}
                                      onChange={(e) =>
                                          setMaxAmount(e.target.value)
                                      }
                                      fullWidth
                                      size="small"
                                      InputProps={{ inputProps: { min: 0 } }}
                                  />
                                  <FormControl fullWidth size="small">
                                      <InputLabel>
                                          Selected Product (Optional)
                                      </InputLabel>
                                      <Select
                                          value={selectedProducts}
                                          label="Selected Product (Optional)"
                                          onChange={(e) =>
                                              setSelectedProducts(
                                                  e.target.value,
                                              )
                                          }
                                      >
                                          <MenuItem value="">
                                              <em>All Products</em>
                                          </MenuItem>
                                          {products?.map((i) => (
                                              <MenuItem
                                                  value={i._id}
                                                  key={i._id}
                                              >
                                                  {i.name}
                                              </MenuItem>
                                          ))}
                                      </Select>
                                  </FormControl>
                              </Box>
                          </DialogContent>
                          <DialogActions sx={{ padding: "16px 24px" }}>
                              <Button onClick={() => setOpen(false)}>
                                  Cancel
                              </Button>
                              <Button
                                  type="submit"
                                  variant="contained"
                                  color="primary"
                                  disabled={isSubmitting}
                              >
                                  {isSubmitting ? "Creating..." : "Create"}
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

// frontend/src/components/Admin/AllProducts.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Button, IconButton } from "@mui/material"; // Changed import
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";
import { CheckCircle, XCircle } from "lucide-react";

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCountState, setRowCountState] = useState(0);

  const fetchProducts = useCallback(async (page, pageSize) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${server}/product/admin-all-products`, {
        withCredentials: true,
        params: { page: page + 1, limit: pageSize },
      });
      setProducts(data.products || []);
      setRowCountState(data.totalProducts || 0);
    } catch (err) {
      const msg = err.response?.data?.message || "Error fetching products";
      setError(msg);
      toast.error(msg);
      setProducts([]);
      setRowCountState(0);
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed if paginationModel triggers refetch

  useEffect(() => {
    fetchProducts(paginationModel.page, paginationModel.pageSize);
  }, [fetchProducts, paginationModel]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this product permanently?")) return;
      try {
        // Assuming admin uses the same delete endpoint, or a specific admin one exists
        await axios.delete(`${server}/product/delete-shop-product/${id}`, {
          withCredentials: true,
        });
        toast.success("Product deleted successfully");
        fetchProducts(paginationModel.page, paginationModel.pageSize); // Refresh
      } catch (err) {
        toast.error(err.response?.data?.message || "Error deleting product");
      }
    },
    [fetchProducts, paginationModel]
  );

  const handleApproveReject = useCallback(
    async (id, status) => {
      const action = status === "public" ? "approve" : "reject";
      if (!window.confirm(`Are you sure you want to ${action} this product?`))
        return;
      try {
        // Assuming a dedicated endpoint for admin approval/rejection
        await axios.put(
          `${server}/product/admin-update-product-status/${id}`,
          { status },
          { withCredentials: true }
        );
        toast.success(`Product ${action}d successfully`);
        fetchProducts(paginationModel.page, paginationModel.pageSize); // Refresh
      } catch (err) {
        toast.error(
          err.response?.data?.message || `Error ${action}ing product`
        );
      }
    },
    [fetchProducts, paginationModel]
  );

  const columns = [
    { field: "id", headerName: "Product ID", width: 220 },
    {
      field: "name",
      headerName: "Name",
      minWidth: 180,
      flex: 1,
      renderCell: (p) => (
        <div className="flex items-center gap-2">
          <img
            src={p.row.designImage}
            alt={p.value}
            className="w-10 h-10 object-contain rounded"
          />
          <span>{p.value}</span>
        </div>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      width: 100,
      type: "number",
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    { field: "stock", headerName: "Stock", type: "number", width: 80 }, // Assuming 'stock' field exists
    { field: "sold", headerName: "Sold", type: "number", width: 80 },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : p.value === "public"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 150,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <div className="flex gap-1 items-center">
          <IconButton
            component={Link}
            to={`/product/${params.row.id}`}
            size="small"
            title="Preview"
          >
            <AiOutlineEye className="text-blue-600" />
          </IconButton>
          {params.row.status === "pending" && (
            <>
              <IconButton
                onClick={() => handleApproveReject(params.row.id, "public")}
                size="small"
                title="Approve"
              >
                <CheckCircle className="text-green-600" />
              </IconButton>
              <IconButton
                onClick={() => handleApproveReject(params.row.id, "rejected")}
                size="small"
                title="Reject"
              >
                <XCircle className="text-orange-600" />
              </IconButton>
            </>
          )}
          <IconButton
            onClick={() => handleDelete(params.row.id)}
            size="small"
            title="Delete"
          >
            <AiOutlineDelete className="text-red-600" />
          </IconButton>
        </div>
      ),
    },
  ];

  const rows =
    products?.map((p) => ({
      id: p._id,
      name: p.DesignTitle || p.name || "N/A",
      price: p.discountPrice ?? p.originalPrice ?? 0,
      stock: p.stock ?? 0,
      sold: p.sold_out ?? 0,
      status: p.status || "N/A",
      designImage:
        p.designImage?.url || p.images?.[0]?.url || "/default-product.png",
    })) || [];

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">All Products (Admin)</h2>
      {error && !isLoading && (
        <div className="text-red-500 p-4 bg-red-50 rounded mb-4">{error}</div>
      )}
      {isLoading && rows.length === 0 ? (
        <Loader />
      ) : (
        <div style={{ height: 650, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            paginationMode="server" // Important for server-side pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
            rowCount={rowCountState}
            loading={isLoading}
            disableRowSelectionOnClick
            autoHeight={false}
            sx={{ "--DataGrid-overlayHeight": "300px", border: "none" }}
            getRowHeight={() => "auto"}
          />
        </div>
      )}
    </div>
  );
};

export default AllProducts;

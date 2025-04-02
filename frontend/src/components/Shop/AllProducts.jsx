import React, { useEffect, useState, useMemo, useCallback } from "react";
import { IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  getAllProductsShop,
  deleteProduct,
  clearErrors,
} from "../../redux/actions/product";
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";

const AllProducts = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error } = useSelector((state) => state.products);
  const { seller } = useSelector((state) => state.seller);
  // DataGrid v5+ uses 0-based indexing for page
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [rowCountState, setRowCountState] = useState(0);

  const loadProducts = useCallback(() => {
    if (seller?._id) {
      // Pass page number (1-based for API) and page size
      dispatch(
        getAllProductsShop(
          seller._id,
          paginationModel.page + 1,
          paginationModel.pageSize
        )
      );
    }
  }, [dispatch, seller?._id, paginationModel]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    // Assuming your Redux state for products doesn't include total count for shop view
    // We'll use the length of the fetched array for rowCountState if API doesn't provide total
    setRowCountState((prevRowCount) => products?.length ?? prevRowCount);
  }, [error, dispatch, products]);

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm("Delete this product?")) return;
      try {
        await dispatch(deleteProduct(id));
        toast.success("Product deleted");
        // Refresh triggered by state change ideally, or uncomment below
        // loadProducts();
      } catch (err) {
        toast.error(err?.message || "Delete failed");
      }
    },
    [dispatch]
  ); // Removed loadProducts dependency

  const columns = useMemo(
    () => [
      {
        field: "designImage",
        headerName: "Image",
        width: 80,
        sortable: false,
        renderCell: (p) => (
          <img
            src={p.value}
            alt=""
            className="w-12 h-12 object-contain rounded"
          />
        ),
      },
      { field: "name", headerName: "Name", minWidth: 180, flex: 1 },
      {
        field: "price",
        headerName: "Price",
        width: 100,
        type: "number",
        valueFormatter: (v) => `EGP ${Number(v ?? 0).toFixed(2)}`,
      },
      { field: "stock", headerName: "Stock", type: "number", width: 80 },
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
            {p.value || "N/A"}
          </span>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (p) => (
          <div className="flex gap-1">
            <IconButton
              component={Link}
              to={`/product/${p.id}`}
              size="small"
              title="Preview"
            >
              <AiOutlineEye className="text-blue-600" />
            </IconButton>
            <IconButton
              onClick={() => handleDelete(p.id)}
              size="small"
              title="Delete"
            >
              <AiOutlineDelete className="text-red-600" />
            </IconButton>
          </div>
        ),
      },
    ],
    [handleDelete]
  );

  const rows = useMemo(
    () =>
      products?.map((p) => ({
        id: p._id,
        name: p.DesignTitle || p.name || "N/A",
        price: p.discountPrice ?? p.originalPrice ?? 0,
        stock: p.stock ?? 0,
        sold: p.sold_out ?? 0,
        status: p.status,
        designImage:
          p.designImage?.url || p.images?.[0]?.url || "/default-product.png",
      })) || [],
    [products]
  );

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">All Products</h2>
      {isLoading && rows.length === 0 ? (
        <Loader />
      ) : (
        <div style={{ height: 600, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            paginationMode="client" // Assuming getAllProductsShop fetches all for shop
            rowCount={rowCountState} // Total rows for pagination display
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 25, 50]}
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

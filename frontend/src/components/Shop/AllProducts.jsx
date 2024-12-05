// Shop/AllProducts.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { getAllProductsShop, deleteProduct } from "../../redux/actions/product";
import Loader from "../Layout/Loader";

const AllProducts = () => {
  const dispatch = useDispatch();
  const { allProducts, isLoading, pagination } = useSelector((state) => state.products);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  useEffect(() => {
    dispatch(getAllProducts(paginationModel.page + 1, paginationModel.pageSize));
  }, [dispatch, paginationModel]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    
    try {
      await dispatch(deleteProduct(id));
      dispatch(getAllProductsShop(seller._id, paginationModel.page + 1, paginationModel.pageSize));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const columns = [
    {
      field: "name",
      headerName: "Product Name",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <img
            src={params.row.designImage}
            alt={params.value}
            className="w-10 h-10 object-cover rounded"
          />
          <span>{params.value}</span>
        </div>
      ),
    },
    {
      field: "price",
      headerName: "Price",
      minWidth: 100,
      flex: 0.5,
      renderCell: (params) => (
        <span>EGP {parseFloat(params.value).toFixed(2)}</span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded text-sm ${
          params.value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          params.value === 'public' ? 'bg-green-100 text-green-800' :
          'bg-red-100 text-red-800'
        }`}>
          {params.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      flex: 0.7,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Link 
            to={`/product/${params.row.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            <AiOutlineEye size={20} />
          </Link>
          
          <Button
            onClick={() => handleDelete(params.row.id)}
            className="min-w-0 p-1 text-red-600 hover:text-red-800"
          >
            <AiOutlineDelete size={20} />
          </Button>
        </div>
      ),
    },
  ];

  const handlePageChange = (newModel) => {
    setPaginationModel(newModel);
  };

  // Process products for DataGrid
  const rows = allProducts?.map(product => ({
    id: product._id,
    name: product.DesignTitle,
    price: product.discountPrice || product.originalPrice,
    Stock: product.availableColors?.length || 1,
    sold: product.sold_out || 0,
    status: product.status,
    designImage: product.designImage?.url || product.designImage,
    ProductType: product.ProductType,
    ProductColor: product.ProductColor
  })) || [];

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">All Products</h2>
      
      {isLoading ? (
        <Loader />
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={handlePageChange}
          pageSizeOptions={[10, 25, 50]}
          rowCount={pagination.totalPages * paginationModel.pageSize}
          paginationMode="server"
          disableSelectionOnClick
          autoHeight
          className="border-none"
          getRowHeight={() => 'auto'}
          getEstimatedRowHeight={() => 100}
        />
      )}
    </div>
  );
};
export default AllProducts;
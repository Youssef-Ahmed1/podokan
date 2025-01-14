// Admin/AllProducts.jsx
import React, { useEffect, useState } from "react";
import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import Loader from "../Layout/Loader";

const AllProducts = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [totalRows, setTotalRows] = useState(0);

  const fetchProducts = async (page, pageSize) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${server}/product/admin-all-products`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        params: {
          page: page + 1, // DataGrid uses 0-based pagination
          limit: pageSize
        },
        timeout: 30000
      });

      const processedProducts = response.data.products.map(product => ({
        id: product._id,
        name: product.DesignTitle,
        price: product.discountPrice || product.originalPrice,
        Stock: product.availableColors?.length || 1,
        sold: product.sold_out || 0,
        status: product.status,
        designImage: product.designImage?.url || product.designImage,
        ProductType: product.ProductType,
        ProductColor: product.ProductColor
      }));

      setData(processedProducts);
      setTotalRows(response.data.totalProducts);
      setError(null);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.response?.data?.message || "Error fetching products");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(paginationModel.page, paginationModel.pageSize);
  }, [paginationModel]);

  const handlePageChange = (newModel) => {
    setPaginationModel(newModel);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      await axios.delete(`${server}/product/delete-shop-product/${id}`, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchProducts(paginationModel.page, paginationModel.pageSize);
    } catch (err) {
      console.error("Error deleting product:", err);
      alert(err.response?.data?.message || "Error deleting product");
    }
  };

  const handleApproveReject = async (id, status) => {
    try {
      await axios.put(
        `${server}/product/approve-reject-product/${id}`,
        { status },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchProducts(paginationModel.page, paginationModel.pageSize);
    } catch (err) {
      console.error("Error updating product status:", err);
      alert(err.response?.data?.message || "Error updating product status");
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
      field: "ProductType",
      headerName: "Type",
      minWidth: 100,
      flex: 0.5,
    },
    {
      field: "Stock",
      headerName: "Colors",
      minWidth: 80,
      flex: 0.5,
    },
    {
      field: "sold",
      headerName: "Sold",
      minWidth: 80,
      flex: 0.5,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 0.5,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded text-sm egp {
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
      minWidth: 200,
      flex: 1,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Link 
            to={`/admin-products/approve/${params.row.id}`}
            className="text-blue-600 hover:text-blue-800"
          >
            <AiOutlineEye size={20} />
          </Link>
          
          <Button
            onClick={() => handleApproveReject(params.row.id, 'public')}
            disabled={params.row.status === 'public'}
            className={`min-w-0 p-1 ${
              params.row.status === 'public' 
                ? 'opacity-50 cursor-not-allowed' 
                : 'text-green-600 hover:text-green-800'
            }`}
          >
            Approve
          </Button>
          
          <Button
            onClick={() => handleApproveReject(params.row.id, 'rejected')}
            disabled={params.row.status === 'rejected'}
            className={`min-w-0 p-1 ${
              params.row.status === 'rejected'
                ? 'opacity-50 cursor-not-allowed'
                : 'text-red-600 hover:text-red-800'
            }`}
          >
            Reject
          </Button>
          
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

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button
            onClick={() => fetchProducts(paginationModel.page, paginationModel.pageSize)}
            variant="contained"
            color="primary"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">All Products</h2>
      
      {isLoading ? (
        <Loader />
      ) : (
        <DataGrid
          rows={data}
          columns={columns}
          pagination
          paginationModel={paginationModel}
          onPaginationModelChange={handlePageChange}
          pageSizeOptions={[10, 25, 50]}
          rowCount={totalRows}
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
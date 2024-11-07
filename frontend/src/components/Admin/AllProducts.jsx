import { Button } from "@material-ui/core";
import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineEye } from "react-icons/ai";
import { Link } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import Loader from "../Layout/Loader";

const AllProducts = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = () => {
    setIsLoading(true);
    axios.get(`${server}/product/admin-all-products`, {
      withCredentials: true,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      timeout: 30000 // 30 second timeout
    })
      .then((res) => {
        const processedProducts = res.data.products.map(product => ({
          ...product,
          name: product.DesignTitle, // Map DesignTitle to name for DataGrid
          price: product.discountPrice || product.originalPrice,
          Stock: product.availableColors?.length || 1,
          sold: product.sold_out || 0
        }));
        setData(processedProducts);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setError(err.response?.data?.message || "Error fetching products");
        setIsLoading(false);
      });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${server}/product/delete-shop-product/${id}`, {
        withCredentials: true,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchProducts(); // Refetch after successful deletion
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
      fetchProducts(); // Refresh the list
    } catch (err) {
      console.error("Error updating product status:", err);
      alert(err.response?.data?.message || "Error updating product status");
    }
  };
  const columns = [
    { field: "id", headerName: "Product Id", minWidth: 150, flex: 0.7 },
    {
      field: "name",
      headerName: "Name",
      minWidth: 180,
      flex: 1.4,
    },
    {
      field: "price",
      headerName: "Price",
      minWidth: 100,
      flex: 0.6,
    },
    {
      field: "Stock",
      headerName: "Stock",
      type: "number",
      minWidth: 80,
      flex: 0.5,
    },
    {
      field: "sold",
      headerName: "Sold out",
      type: "number",
      minWidth: 130,
      flex: 0.6,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      flex: 0.6,
      renderCell: (params) => {
        return (
          <span className={`px-2 py-1 rounded ${
            params.value === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            params.value === 'public' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {params.value}
          </span>
        );
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 200,
      flex: 1,
      renderCell: (params) => {
        return (
          <div className="flex gap-2">
            <Button 
              onClick={() => handleApproveReject(params.id, 'public')}
              disabled={params.row.status === 'public'}
              className="bg-green-500 text-white"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleApproveReject(params.id, 'rejected')}
              disabled={params.row.status === 'rejected'}
              className="bg-red-500 text-white"
            >
              Reject
            </Button>
            <Button onClick={() => handleDelete(params.id)}>
              <AiOutlineDelete size={20} />
            </Button>
          </div>
        );
      }
    }
,  
    {
      field: "Preview",
      flex: 0.8,
      minWidth: 100,
      headerName: "",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <>
            <Link to={`/product/${params.id}`}>
              <Button>
                <AiOutlineEye size={20} />
              </Button>
            </Link>
          </>
        );
      },
    },
    {
      field: "Delete",
      flex: 0.8,
      minWidth: 120,
      headerName: "",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <>
            <Button onClick={() => handleDelete(params.id)}>
              <AiOutlineDelete size={20} />
            </Button>
          </>
        );
      },
    },
  ];

  const row = [];

  data &&
  data.forEach((item) => {
      row.push({
        id: item._id,
        name: item.name,
        price: "egp " + item.discountPrice,
        Stock: item.stock,
        sold: item?.sold_out,
      });
    });

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <div className="w-full mx-8 pt-1 mt-10 bg-white">
          <DataGrid
            rows={row}
            columns={columns}
            pageSize={10}
            disableSelectionOnClick
            autoHeight
          />
        </div>
      )}
    </>
  );
};

export default AllProducts;
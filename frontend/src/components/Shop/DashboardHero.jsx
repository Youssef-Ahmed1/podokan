// frontend/src/components/Shop/DashboardHero.jsx
import React, { useEffect, useMemo } from "react";
import { AiOutlineArrowRight, AiOutlineMoneyCollect } from "react-icons/ai";
import styles from "../../styles/styles"; // Keep if used
import { Link } from "react-router-dom";
import { MdBorderClear, MdOutlineShoppingBag } from "react-icons/md"; // Added icon
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfShop,
  clearErrors as clearOrderErrors,
} from "../../redux/actions/order";
import {
  getAllProductsShop,
  clearErrors as clearProductErrors,
} from "../../redux/actions/product";
import { Button, IconButton } from "@mui/material"; // Changed import
import { DataGrid } from "@mui/x-data-grid"; // Changed import
import Loader from "../Layout/Loader"; // Assuming Loader exists
import { format } from "date-fns";
import { toast } from "react-toastify";

const DashboardHero = () => {
  const dispatch = useDispatch();
  const {
    orders,
    isLoading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
  } = useSelector((state) => state.products);
  const { seller } = useSelector((state) => state.seller);

  useEffect(() => {
    if (ordersError) {
      toast.error(`Orders Error: ${ordersError}`);
      dispatch(clearOrderErrors());
    }
    if (productsError) {
      toast.error(`Products Error: ${productsError}`);
      dispatch(clearProductErrors());
    }

    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
      dispatch(getAllProductsShop(seller._id)); // Fetch products too
    }
  }, [dispatch, seller?._id, ordersError, productsError]);

  const availableBalance = useMemo(
    () => seller?.availableBalance ?? 0,
    [seller]
  );
  const totalOrders = useMemo(() => orders?.length ?? 0, [orders]);
  const totalProducts = useMemo(() => products?.length ?? 0, [products]);

  const columns = [
    {
      field: "id",
      headerName: "Order ID",
      width: 220,
      renderCell: (p) => `#${p.value}`,
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Delivered"
              ? "bg-green-100 text-green-800"
              : p.value === "Processing"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      width: 80,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      type: "number",
      width: 130,
      valueFormatter: (v) => `EGP ${Number(v || 0).toFixed(2)}`,
    },
    {
      field: "orderDate",
      headerName: "Date",
      width: 120,
      valueFormatter: (v) => (v ? format(new Date(v), "PP") : ""),
    },
    {
      field: "actions",
      headerName: "View",
      width: 80,
      sortable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => (
        <IconButton
          component={Link}
          to={`/order/${params.id}`}
          size="small"
          title="View Order"
        >
          <AiOutlineArrowRight className="text-blue-600" />
        </IconButton>
      ),
    },
  ];

  const rows = useMemo(
    () =>
      orders?.slice(0, 10).map((item) => ({
        // Show latest 10
        id: item._id,
        itemsQty: item.cart?.length || 0,
        total: item.totalPrice,
        status: item.status,
        orderDate: item.createdAt,
      })) || [],
    [orders]
  );

  const isLoading = ordersLoading || productsLoading;

  // Render loading or error state if necessary
  if (isLoading && !orders && !products) return <Loader />;
  if (!seller?._id)
    return (
      <div className="p-8 text-center text-gray-500">
        Seller data not loaded. Please login.
      </div>
    );

  return (
    <div className="w-full p-4 md:p-8">
      <h3 className="text-xl md:text-2xl font-semibold text-gray-800 pb-4">
        Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Balance */}
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <AiOutlineMoneyCollect size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Available Balance
              </h4>
              <h5 className="text-xl font-semibold">
                EGP {availableBalance.toFixed(2)}
              </h5>
            </div>
          </div>
          <Link
            to="/dashboard-withdraw-money"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            Withdraw
          </Link>
        </div>
        {/* Orders */}
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <MdBorderClear size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Orders
              </h4>
              <h5 className="text-xl font-semibold">{totalOrders}</h5>
            </div>
          </div>
          <Link
            to="/dashboard-orders"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            View Orders
          </Link>
        </div>
        {/* Products */}
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center mb-1">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <MdOutlineShoppingBag size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Products
              </h4>
              <h5 className="text-xl font-semibold">{totalProducts}</h5>
            </div>
          </div>
          <Link
            to="/dashboard-products"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            View Products
          </Link>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Latest Orders
      </h3>
      <div className="w-full bg-white rounded-lg shadow border border-gray-200">
        <div style={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10]} // Keep it simple for dashboard view
            disableRowSelectionOnClick
            autoHeight={false}
            loading={isLoading}
            sx={{ "--DataGrid-overlayHeight": "300px", border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;

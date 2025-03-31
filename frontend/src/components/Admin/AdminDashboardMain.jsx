import React, { useEffect, useMemo } from "react";
import { AiOutlineMoneyCollect } from "react-icons/ai";
import { MdBorderClear, MdPeopleOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersOfAdmin,
  clearErrors as clearOrderErrors,
  clearErrors as clearSellerErrors,
} from "../../redux/actions/order";
import { getAllSellers } from "../../redux/actions/sellers"; // Assuming exists
import Loader from "../Layout/Loader";
import { format } from "date-fns";
import { toast } from "react-toastify";

const AdminDashboardMain = () => {
  const dispatch = useDispatch();
  const {
    adminOrders = [],
    isLoading: ordersLoading,
    error: ordersError,
  } = useSelector((state) => state.order);
  const {
    sellers = [],
    isLoading: sellersLoading,
    error: sellersError,
  } = useSelector((state) => state.seller);

  useEffect(() => {
    if (ordersError) {
      toast.error(`Orders Error: ${ordersError}`);
      dispatch(clearOrderErrors());
    }
    if (sellersError) {
      toast.error(`Sellers Error: ${sellersError}`);
      dispatch(clearSellerErrors());
    }
    dispatch(getAllOrdersOfAdmin());
    dispatch(getAllSellers());
  }, [dispatch, ordersError, sellersError]);

  const dashboardStats = useMemo(() => {
    if (!Array.isArray(adminOrders) || !Array.isArray(sellers))
      return { adminBalance: "0.00", totalSellers: 0, totalOrders: 0 };
    const totalEarning = adminOrders
      .filter((o) => ["Delivered", "Refund Success"].includes(o.status))
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const adminBalance = (totalEarning * 0.1).toFixed(2); // Example 10% cut
    return {
      adminBalance,
      totalSellers: sellers.length,
      totalOrders: adminOrders.length,
    };
  }, [adminOrders, sellers]);

  const latestOrdersRows = useMemo(() => {
    if (!Array.isArray(adminOrders)) return [];
    return adminOrders
      .slice(0, 10)
      .map((o) => ({
        id: o._id,
        customer: o.user?.name || "N/A",
        itemsQty: o.cart?.length || 0,
        total: `EGP ${Number(o.totalPrice || 0).toFixed(2)}`,
        status: o.status || "N/A",
        date: o.createdAt ? format(new Date(o.createdAt), "PP") : "-",
      }));
  }, [adminOrders]);

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      renderCell: (p) => `#${p.value.slice(-6)}`,
    },
    { field: "date", headerName: "Date", width: 100 },
    { field: "customer", headerName: "Customer", width: 150, flex: 1 },
    {
      field: "itemsQty",
      headerName: "Items",
      type: "number",
      width: 70,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      align: "right",
      headerAlign: "right",
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      renderCell: (p) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            p.value === "Processing"
              ? "bg-blue-100 text-blue-800"
              : p.value === "Delivered"
              ? "bg-green-100 text-green-800"
              : p.value === "Cancelled"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {p.value}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "View",
      width: 70,
      sortable: false,
      renderCell: (params) => (
        <Link
          to={`/admin/order/${params.id}`}
          className="text-blue-600 hover:text-blue-800"
        >
          Details
        </Link>
      ),
    },
  ];

  const isLoading = ordersLoading || sellersLoading;

  if (isLoading && adminOrders.length === 0 && sellers.length === 0)
    return <Loader />;

  return (
    <div className="w-full p-4 md:p-6">
      <h3 className="text-xl md:text-2xl font-semibold text-gray-800 pb-4">
        Overview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-full mr-3">
              <AiOutlineMoneyCollect size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Earning (Est.)
              </h4>
              <h5 className="text-xl font-semibold">
                EGP {dashboardStats.adminBalance}
              </h5>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-full mr-3">
              <MdPeopleOutline size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Sellers
              </h4>
              <h5 className="text-xl font-semibold">
                {dashboardStats.totalSellers}
              </h5>
            </div>
          </div>
          <Link
            to="/admin-sellers"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            View
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-full mr-3">
              <MdBorderClear size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500">
                Total Orders
              </h4>
              <h5 className="text-xl font-semibold">
                {dashboardStats.totalOrders}
              </h5>
            </div>
          </div>
          <Link
            to="/admin-orders"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
          >
            View
          </Link>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        Latest Orders
      </h3>
      <div className="w-full bg-white rounded-lg shadow border border-gray-200">
        <div style={{ height: 450, width: "100%" }}>
          <DataGrid
            rows={latestOrdersRows}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableSelectionOnClick
            autoHeight
            loading={isLoading}
            sx={{
              border: "none",
              "& .MuiDataGrid-cell": { fontSize: "0.8rem" },
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#f9fafb",
                fontSize: "0.75rem",
                textTransform: "uppercase",
              },
            }}
            components={{
              NoRowsOverlay: () => (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No recent orders.
                </div>
              ),
            }}
          />
        </div>
      </div>
    </div>
  );
};
export default AdminDashboardMain;

// frontend/src/components/Admin/AdminDashboardMain.jsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
// **FIX: Correct Path based on structure image input_file_5.png**
import styles from "../../styles/styles"; // Path assuming styles is in src/styles
import { AiOutlineArrowRight, AiOutlineMoneyCollect } from "react-icons/ai";
import { MdBorderClear } from "react-icons/md";
import { AlertTriangle, RefreshCw, User, Users, Package } from "lucide-react"; // Added Package icon
import { Link } from "react-router-dom";
import { DataGrid } from "@material-ui/data-grid"; // Ensure @material-ui/data-grid is installed
// **FIX: Correct Paths based on structure images**
import {
  getAllOrdersOfAdmin,
  clearErrors as clearOrderErrors,
} from "../../redux/actions/order"; // Adjust path if needed
import { getAllSellers } from "../../redux/actions/sellers"; // Adjust path if needed
import { clearErrors as clearSellerErrors } from "../../redux/actions/order"; // Adjust path if needed
import Loader from "../Layout/Loader"; // Assuming Loader path
import { toast } from "react-toastify";


const AdminDashboardMain = () => {
  const dispatch = useDispatch();

  const {
    adminOrders = [],
    isLoading: adminOrderLoading = false,
    error: orderError = null,
  } = useSelector((state) => state.order || {});
  const {
    sellers = [],
    isLoading: sellersLoading = false,
    error: sellerError = null,
  } = useSelector((state) => state.seller || {});

  const [dashboardData, setDashboardData] = useState({
    adminBalance: "0.00",
    totalSellers: 0,
    totalOrders: 0,
    latestOrders: [],
  });
  const [displayError, setDisplayError] = useState(null);
  const isLoading = adminOrderLoading || sellersLoading;

  const fetchData = useCallback(
    async (showToast = false) => {
      setDisplayError(null);
      dispatch(clearOrderErrors());
      dispatch(clearSellerErrors());
      try {
        await Promise.all([
          dispatch(getAllOrdersOfAdmin()),
          dispatch(getAllSellers()),
        ]);
        if (showToast) toast.success("Refreshed");
      } catch (error) {
        if (showToast) toast.error("Refresh failed.");
      }
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData();
    return () => {
      dispatch(clearOrderErrors());
      dispatch(clearSellerErrors());
    };
  }, [fetchData, dispatch]);

  useEffect(() => {
    if (!isLoading) {
      try {
        const grossTotal = adminOrders.reduce(
          (s, o) => s + (o?.totalPrice || 0),
          0
        );
        const earning = grossTotal * 0.1;
        const latest = adminOrders.slice(0, 5).map((o) => ({
          id: o?._id,
          itemsQty: o?.cart?.reduce((a, i) => a + (i?.qty || 0), 0) || 0,
          total: `EGP ${(o?.totalPrice || 0).toFixed(2)}`,
          status: o?.status || "?",
          createdAt: o?.createdAt
            ? new Date(o.createdAt).toLocaleDateString()
            : "-",
        }));
        setDashboardData({
          adminBalance: earning.toFixed(2),
          totalSellers: sellers.length,
          totalOrders: adminOrders.length,
          latestOrders: latest,
        });
        setDisplayError(null);
      } catch (e) {
        setDisplayError("Processing error.");
        setDashboardData({
          adminBalance: "0.00",
          totalSellers: 0,
          totalOrders: 0,
          latestOrders: [],
        });
      }
    }
  }, [adminOrders, sellers, isLoading]);

  useEffect(() => {
    if (orderError || sellerError)
      setDisplayError(orderError || sellerError || "Error loading data.");
  }, [orderError, sellerError]);

  const columns = useMemo(
    () => [
      { field: "id", headerName: "Order ID", minWidth: 150, flex: 0.7 },
      {
        field: "status",
        headerName: "Status",
        minWidth: 130,
        flex: 0.7,
        renderCell: (p) => (
          <span className={`px-2 inline-flex ... ${/* status styles */ ""}`}>
            {p.value || "N/A"}
          </span>
        ),
      },
      {
        field: "itemsQty",
        headerName: "Items",
        type: "number",
        minWidth: 80,
        flex: 0.5,
        align: "center",
        headerAlign: "center",
      },
      { field: "total", headerName: "Total", minWidth: 130, flex: 0.8 },
      { field: "createdAt", headerName: "Date", minWidth: 110, flex: 0.6 },
      {
        field: "actions",
        headerName: "View",
        minWidth: 80,
        flex: 0.5,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => (
          <Link to={`/admin/order/${p.id}`} title="View">
            <AiOutlineArrowRight className="..." />
          </Link>
        ),
      },
    ],
    []
  );

  const safeLatestOrders = useMemo(
    () => dashboardData.latestOrders,
    [dashboardData.latestOrders]
  );

  if (isLoading && safeLatestOrders.length === 0) return <Loader />;

  if (displayError && safeLatestOrders.length === 0) {
    return (
      /* Error display */ <div className="...">
        <AlertTriangle /> Error: {displayError}{" "}
        <button onClick={() => fetchData(true)}>
          <RefreshCw /> Refresh{" "}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="flex ... mb-6">
        {" "}
        {/* Header */} <h3 className="...">Dashboard</h3>{" "}
        <button
          onClick={() => fetchData(true)}
          disabled={isLoading}
          className="..."
        >
          {" "}
          {isLoading ? <div /> : <RefreshCw />}{" "}
        </button>{" "}
      </div>
      <div className="grid ... mb-8">
        {" "}
        {/* Cards */}
        <div className="bg-white ...">
          {" "}
          <AiOutlineMoneyCollect /> Total Earning: EGP{" "}
          {dashboardData.adminBalance}{" "}
        </div>
        <div className="bg-white ...">
          {" "}
          <Users /> Total Sellers: {dashboardData.totalSellers}{" "}
          <Link to="/admin-sellers">
            {" "}
            View <AiOutlineArrowRight />{" "}
          </Link>
        </div>
        <div className="bg-white ...">
          {" "}
          <MdBorderClear /> Total Orders: {dashboardData.totalOrders}{" "}
          <Link to="/admin-orders">
            {" "}
            View <AiOutlineArrowRight />{" "}
          </Link>
        </div>
      </div>
      <div>
        {" "}
        {/* Latest Orders */} <h3 className="...">Latest Orders</h3>
        <div className="w-full min-h-[40vh] bg-white ...">
          {safeLatestOrders.length > 0 ? (
            <DataGrid
              rows={safeLatestOrders}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              disableSelectionOnClick
              autoHeight
              loading={isLoading}
              sx={{ border: "none" }}
              components={{
                NoRowsOverlay: () => (
                  <div className="...">
                    <Package /> No recent orders.
                  </div>
                ),
              }}
            />
          ) : (
            !isLoading && (
              <div className="...">
                <Package /> No orders.
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardMain;

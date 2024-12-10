import React, { useEffect, useState, useMemo } from "react";
import styles from "../../styles/styles";
import { AiOutlineArrowRight, AiOutlineMoneyCollect } from "react-icons/ai";
import { MdBorderClear } from "react-icons/md";
import { Link } from "react-router-dom";
import { DataGrid } from "@material-ui/data-grid";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfAdmin } from "../../redux/actions/order";
import { getAllSellers } from "../../redux/actions/sellers";
import Loader from "../Layout/Loader";
import { toast } from "react-toastify";

const AdminDashboardMain = () => {
  const dispatch = useDispatch();
  
  const { adminOrders, adminOrderLoading, ordersCount, totalAmount } = useSelector(
    (state) => state.order
  );
  
  const { sellers, isLoading: sellersLoading, sellersCount } = useSelector(
    (state) => state.seller
  );

  const [dashboardData, setDashboardData] = useState({
    adminBalance: 0,
    totalSellers: 0,
    totalOrders: 0,
    latestOrders: []
  });

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(getAllOrdersOfAdmin()),
          dispatch(getAllSellers())
        ]);
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError(error.message || 'Failed to load dashboard data');
        toast.error(error.message || 'Failed to load dashboard data');
      } finally {
        setIsInitialLoad(false);
      }
    };

    if (isInitialLoad) {
      fetchData();
    }
  }, [dispatch, isInitialLoad]);

  useEffect(() => {
    if (!adminOrderLoading && !sellersLoading) {
      try {
        const adminEarning = totalAmount ? Number(totalAmount) * 0.10 : 0;
        
        const processedOrders = Array.isArray(adminOrders) ? adminOrders.slice(0, 5).map(order => ({
          id: order?._id || Math.random().toString(),
          itemsQty: order?.cart?.reduce((acc, item) => acc + (Number(item?.qty) || 0), 0) || 0,
          total: `${Number(order?.totalPrice || 0).toFixed(2)} `,
          status: order?.status || 'Processing',
          createdAt: order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'
        })) : [];

        setDashboardData({
          adminBalance: adminEarning.toFixed(2),
          totalSellers: sellersCount || 0,
          totalOrders: ordersCount || 0,
          latestOrders: processedOrders
        });
      } catch (error) {
        console.error('Error processing dashboard data:', error);
        toast.error('Error processing dashboard data');
        setDashboardData({
          adminBalance: '0.00',
          totalSellers: 0,
          totalOrders: 0,
          latestOrders: []
        });
      }
    }
  }, [adminOrders, adminOrderLoading, sellersLoading, totalAmount, ordersCount, sellersCount]);

  const safeLatestOrders = useMemo(() => {
    if (!Array.isArray(dashboardData.latestOrders)) return [];
    return dashboardData.latestOrders.map(order => ({
      ...order,
      id: order.id || Math.random().toString()
    }));
  }, [dashboardData.latestOrders]);

  const columns = [
    { field: "id", headerName: "Order ID", minWidth: 150, flex: 0.7 },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      flex: 0.7,
      cellClassName: (params) => {
        const status = params.getValue(params.id, "status");
        return status === "Delivered" ? "greenColor" : "redColor";
      }
    },
    {
      field: "itemsQty",
      headerName: "Items Qty",
      type: "number",
      minWidth: 130,
      flex: 0.7,
    },
    {
      field: "total",
      headerName: "Total",
      minWidth: 130,
      flex: 0.8,
    },
    {
      field: "createdAt",
      headerName: "Order Date",
      minWidth: 130,
      flex: 0.8,
    },
  ];

  if (isInitialLoad || adminOrderLoading || sellersLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="w-full p-4">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <h3 className="text-[22px] font-Poppins pb-2">Overview</h3>
      <div className="w-full block 800px:flex items-center justify-between">
        <div className="w-full mb-4 800px:w-[30%] min-h-[20vh] bg-white shadow rounded px-2 py-5">
          <div className="flex items-center">
            <AiOutlineMoneyCollect
              size={30}
              className="mr-2"
              fill="#00000085"
            />
            <h3 className={`${styles.productTitle} !text-[18px] leading-5 !font-[400] text-[#00000085]`}>
              Total Earning
            </h3>
          </div>
          <h5 className="pt-2 pl-[36px] text-[22px] font-[500]">
          EGP{dashboardData.adminBalance}
          </h5>
        </div>

        <div className="w-full mb-4 800px:w-[30%] min-h-[20vh] bg-white shadow rounded px-2 py-5">
          <div className="flex items-center">
            <MdBorderClear size={30} className="mr-2" fill="#00000085" />
            <h3 className={`${styles.productTitle} !text-[18px] leading-5 !font-[400] text-[#00000085]`}>
              All Sellers
            </h3>
          </div>
          <h5 className="pt-2 pl-[36px] text-[22px] font-[500]">
            {dashboardData.totalSellers}
          </h5>
          <Link to="/admin-sellers">
            <h5 className="pt-4 pl-2 text-[#077f9c]">View Sellers</h5>
          </Link>
        </div>

        <div className="w-full mb-4 800px:w-[30%] min-h-[20vh] bg-white shadow rounded px-2 py-5">
          <div className="flex items-center">
            <AiOutlineMoneyCollect
              size={30}
              className="mr-2"
              fill="#00000085"
            />
            <h3 className={`${styles.productTitle} !text-[18px] leading-5 !font-[400] text-[#00000085]`}>
              All Orders
            </h3>
          </div>
          <h5 className="pt-2 pl-[36px] text-[22px] font-[500]">
            {dashboardData.totalOrders}
          </h5>
          <Link to="/admin-orders">
            <h5 className="pt-4 pl-2 text-[#077f9c]">View Orders</h5>
          </Link>
        </div>
      </div>

      <br />
      <h3 className="text-[22px] font-Poppins pb-2">Latest Orders</h3>
      <div className="w-full min-h-[45vh] bg-white rounded">
        {safeLatestOrders.length > 0 ? (
          <DataGrid
            rows={safeLatestOrders}
            columns={columns}
            pageSize={4}
            disableSelectionOnClick
            autoHeight
            loading={adminOrderLoading}
            error={null}
            components={{
              NoRowsOverlay: () => (
                <div className="w-full h-[400px] flex items-center justify-center">
                  <p className="text-gray-500">No orders to display</p>
                </div>
              )
            }}
          />
        ) : (
          <div className="w-full h-[400px] flex items-center justify-center">
            <p className="text-gray-500">No orders to display</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardMain;
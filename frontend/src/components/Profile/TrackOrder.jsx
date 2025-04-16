import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { getAllOrdersOfUser, clearErrors } from "../../redux/actions/order";
import Loader from "../../components/Layout/Loader";
import {
  Truck,
  PackageCheck,
  PackageX,
  RefreshCcw,
  RotateCcw,
  ArrowLeft,
  Info,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-toastify";

const TrackOrderPage = () => {
  const { orders, isLoading, error } = useSelector((state) => state.order);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearErrors());
    }
    if (isAuthenticated && user?._id) dispatch(getAllOrdersOfUser());
  }, [dispatch, isAuthenticated, user?._id, error]);

  useEffect(() => {
    setOrderData(orders?.find((item) => item._id === id) || null);
  }, [orders, id]);

  const getStatusInfo = (status) => {
    switch (status) {
      case "Processing":
        return {
          msg: "Order is being processed.",
          icon: <Clock />,
          color: "blue",
        };
      case "Transferred to delivery partner":
        return {
          msg: "Handed over to delivery partner.",
          icon: <RefreshCcw />,
          color: "orange",
        };
      case "Shipping":
        return {
          msg: "Order is in transit.",
          icon: <Truck />,
          color: "purple",
        };
      case "Received":
        return {
          msg: "Shipment received locally.",
          icon: <PackageCheck />,
          color: "indigo",
        };
      case "On the way":
        return {
          msg: "Out for final delivery!",
          icon: <Truck className="animate-pulse" />,
          color: "teal",
        };
      case "Delivered":
        return {
          msg: "Order delivered!",
          icon: <PackageCheck />,
          color: "green",
        };
      case "Processing refund":
        return {
          msg: "Refund is processing.",
          icon: <RotateCcw />,
          color: "yellow",
        };
      case "Refund Success":
        return {
          msg: "Refund successful.",
          icon: <PackageCheck />,
          color: "green",
        };
      case "Refund Rejected":
        return { msg: "Refund rejected.", icon: <PackageX />, color: "red" };
      case "Cancelled":
        return { msg: "Order cancelled.", icon: <PackageX />, color: "red" };
      default:
        return { msg: "Status unavailable.", icon: <Info />, color: "gray" };
    }
  };

  if (isLoading && !orderData) return <Loader />;

  if (!orderData && !isLoading) {
    return (
      <div className="w-full h-[80vh] flex flex-col justify-center items-center p-4">
        <Info Size={48} className="text-gray-400 mb-4" />
        <h1 className="text-xl font-semibold">Order Not Found</h1>
        <p className="text-gray-500 mt-2">No tracking for this ID.</p>
        <Link
          to="/profile"
          className="mt-4 text-blue-600 hover:underline flex items-center"
        >
          <ArrowLeft Size={16} className="mr-1" /> Back
        </Link>
      </div>
    );
  }
  if (!orderData) return null; // Should not happen if loading is handled, but safety net

  const statusInfo = getStatusInfo(orderData.status);
  const history = orderData.statusHistory || [];

  return (
    <div className="w-full min-h-[80vh] flex justify-center items-center p-4 bg-gray-50">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-lg max-w-2xl w-full border border-gray-200">
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h1 className="text-xl md:text-2xl font-bold">
            Track Order #{orderData._id.slice(-8)}
          </h1>
          <Link
            to="/profile"
            className="text-sm text-blue-600 hover:underline flex items-center"
          >
            <ArrowLeft Size={14} className="mr-0.5" /> Orders
          </Link>
        </div>
        <div
          className={`flex items-center p-4 rounded-lg bg-${statusInfo.color}-50 border border-${statusInfo.color}-200 mb-6`}
        >
          <div className={`mr-3 text-${statusInfo.color}-600`}>
            {React.cloneElement(statusInfo.icon, { Size: 24 })}
          </div>
          <p className={`text-md font-semibold text-${statusInfo.color}-800`}>
            {statusInfo.message}
          </p>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold mb-2">History</h2>
          {history.length > 0 ? (
            [...history].reverse().map((event, index) => {
              const eventInfo = getStatusInfo(event.status);
              return (
                <div
                  key={index}
                  className="flex items-start gap-3 pl-1 relative"
                >
                  {index < history.length - 1 && (
                    <div className="absolute left-[9px] top-5 bottom-0 w-0.5 bg-gray-200"></div>
                  )}
                  <div
                    className={`mt-1 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${
                      index === 0 ? `bg-${eventInfo.color}-500` : "bg-gray-300"
                    }`}
                  >
                    {index === 0 && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="pb-3">
                    <p
                      className={`text-sm font-medium ${
                        index === 0 ? "text-gray-800" : "text-gray-600"
                      }`}
                    >
                      {event.status}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(event.timestamp), "PPp")}
                    </p>
                    {event.details && (
                      <p className="text-xs text-gray-500 italic mt-0.5">
                        "{event.details}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">No history yet.</p>
          )}
        </div>
        <div className="mt-6 pt-4 border-t text-center">
          <Link
            to={`/user/order/${orderData._id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;

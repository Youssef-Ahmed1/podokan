import React from "react";
import { FiPackage, FiShoppingBag, FiLogOut } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BiMessageSquareDetail } from "react-icons/bi";
import siteLogo from "../../../Assests/siteLogo.png";
import { logout } from "../../../redux/actions/user";
import { toast } from "react-toastify";

const DashboardHeader = () => {
  const { seller } = useSelector((state) => state.seller);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logout());
      navigate("/");
      toast.success("Logout successful!");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  return (
    <div className="w-full h-[80px] bg-white shadow sticky top-0 left-0 z-30 flex items-center justify-between px-4">
      <div>
        <Link to="/dashboard">
          <img src={siteLogo} alt="Site Logo" className="h-8" />
        </Link>
      </div>
      <div className="flex items-center">
        <div className="flex items-center mr-4">
          <Link to="/dashboard-products" className="800px:block hidden">
            <FiShoppingBag
              color="#555"
              size={30}
              className="mx-5 cursor-pointer"
            />
          </Link>
          <Link to="/dashboard-orders" className="800px:block hidden">
            <FiPackage color="#555" size={30} className="mx-5 cursor-pointer" />
          </Link>
          <Link to="/dashboard-messages" className="800px:block hidden">
            <BiMessageSquareDetail
              color="#555"
              size={30}
              className="mx-5 cursor-pointer"
            />
          </Link>
          {seller?._id && (
            <Link to={`/shop/${seller._id}`}>
              <img
                src={seller.avatar?.url}
                alt="Shop Avatar"
                className="w-[50px] h-[50px] rounded-full object-cover"
              />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="ml-4 flex items-center text-gray-600 hover:text-red-500"
          >
            <FiLogOut size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
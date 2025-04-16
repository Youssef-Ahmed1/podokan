import React from "react";
import { AiOutlineLogin, AiOutlineMessage } from "react-icons/ai";
import { RiLockPasswordLine } from "react-icons/ri";
import { HiOutlineReceiptRefund, HiOutlineShoppingBag } from "react-icons/hi";
import {
  MdOutlineAdminPanelSettings,
  MdOutlineTrackChanges,
} from "react-icons/md";
import { TbAddressBook } from "react-icons/tb";
import { RxPerson } from "react-icons/rx";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const ProfileSidebar = ({ setActive, active }) => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.user);

  const logoutHandler = () => {
    axios
      .get(`${server}/user/logout`, { withCredentials: true })
      .then((res) => {
        toast.success(res.data.message);
        window.location.reload(true);
        navigate("/login");
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Logout failed");
      });
  };

  const menuItems = [
    {
      id: 1,
      title: "Profile",
      icon: RxPerson,
      onClick: () => setActive(1)
    },
    {
      id: 2,
      title: "Orders",
      icon: HiOutlineShoppingBag,
      onClick: () => setActive(2)
    },
    {
      id: 3,
      title: "Refunds",
      icon: HiOutlineReceiptRefund,
      onClick: () => setActive(3)
    },
    
    
    {
      id: 5,
      title: "Track Order",
      icon: MdOutlineTrackChanges,
      onClick: () => setActive(5)
    },
    {
      id: 6,
      title: "Change Password",
      icon: RiLockPasswordLine,
      onClick: () => setActive(6)
    },
    {
      id: 7,
      title: "Address",
      icon: TbAddressBook,
      onClick: () => setActive(7)
    }
  ];

  return (
    <div className="w-full bg-white shadow-sm rounded-[10px] p-4 pt-8">
      <div className="flex flex-col space-y-4">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center cursor-pointer w-full px-2 py-2 rounded-md hover:bg-gray-50 transition-colors"
            onClick={item.onClick}
          >
            <item.icon
              Size={20}
              className={active === item.id ? "text-red-500" : "text-gray-600"}
            />
            <span
              className={`pl-3 ${
                active === item.id ? "text-red-500" : "text-gray-700"
              } 800px:block hidden font-medium`}
            >
              {item.title}
            </span>
            {/* Mobile view title tooltip */}
            <div className="800px:hidden block absolute left-20 bg-gray-800 text-white px-2 py-1 rounded text-xs scale-0 group-hover:scale-100 transition-transform">
              {item.title}
            </div>
          </div>
        ))}

        {/* Admin Dashboard - Conditionally rendered */}
        {user?.role?.toLowerCase() === "admin" && (
          <Link to="/admin/dashboard">
            <div
              className="flex items-center cursor-pointer w-full px-2 py-2 rounded-md hover:bg-gray-50 transition-colors"
              onClick={() => setActive(8)}
            >
              <MdOutlineAdminPanelSettings
                Size={20}
                className={active === 8 ? "text-red-500" : "text-gray-600"}
              />
              <span
                className={`pl-3 ${
                  active === 8 ? "text-red-500" : "text-gray-700"
                } 800px:block hidden font-medium`}
              >
                Admin Dashboard
              </span>
              {/* Mobile view admin tooltip */}
              <div className="800px:hidden block absolute left-20 bg-gray-800 text-white px-2 py-1 rounded text-xs scale-0 group-hover:scale-100 transition-transform">
                Admin Dashboard
              </div>
            </div>
          </Link>
        )}

        {/* Logout button */}
        <div
          className="flex items-center cursor-pointer w-full px-2 py-2 rounded-md hover:bg-gray-50 transition-colors mt-4"
          onClick={logoutHandler}
        >
          <AiOutlineLogin Size={20} className="text-gray-600" />
          <span className="pl-3 text-gray-700 800px:block hidden font-medium">
            Log out
          </span>
          {/* Mobile view logout tooltip */}
          <div className="800px:hidden block absolute left-20 bg-gray-800 text-white px-2 py-1 rounded text-xs scale-0 group-hover:scale-100 transition-transform">
            Log out
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
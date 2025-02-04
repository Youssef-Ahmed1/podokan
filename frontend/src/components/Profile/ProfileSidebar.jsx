import React from "react";
import { useNavigate } from "react-router-dom";
import { RxPerson } from "react-icons/rx";
import { HiOutlineShoppingBag, HiOutlineReceiptRefund } from "react-icons/hi";
import { AiOutlineSetting, AiOutlineLogin } from "react-icons/ai";

const ProfileSidebar = ({ active, setActive }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full">
      {/* Desktop view */}
      <div className="hidden 800px:block">
        <div className="w-full py-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-gray-50"
               onClick={() => setActive(1)}>
            <RxPerson size={25} color={active === 1 ? "purple" : ""} />
            <span className={`pl-3 ${active === 1 ? "text-purple-600 font-medium" : "text-gray-600"}`}>
              Profile
            </span>
          </div>
          <div className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-gray-50"
               onClick={() => setActive(2)}>
            <HiOutlineShoppingBag size={25} color={active === 2 ? "purple" : ""} />
            <span className={`pl-3 ${active === 2 ? "text-purple-600 font-medium" : "text-gray-600"}`}>
              Orders
            </span>
          </div>
          <div className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-gray-50"
               onClick={() => setActive(3)}>
            <HiOutlineReceiptRefund size={25} color={active === 3 ? "purple" : ""} />
            <span className={`pl-3 ${active === 3 ? "text-purple-600 font-medium" : "text-gray-600"}`}>
              Refunds
            </span>
          </div>
          <div className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-gray-50"
               onClick={() => setActive(4)}>
            <AiOutlineSetting size={25} color={active === 4 ? "purple" : ""} />
            <span className={`pl-3 ${active === 4 ? "text-purple-600 font-medium" : "text-gray-600"}`}>
              Settings
            </span>
          </div>
          <div className="flex items-center cursor-pointer w-full px-4 py-3 hover:bg-gray-50"
               onClick={() => setActive(5)}>
            <AiOutlineLogin size={25} color={active === 5 ? "purple" : ""} />
            <span className={`pl-3 ${active === 5 ? "text-purple-600 font-medium" : "text-gray-600"}`}>
              Log out
            </span>
          </div>
        </div>
      </div>

      {/* Mobile view */}
      <div className="fixed bottom-4 right-4 800px:hidden">
        <button 
          className="bg-purple-600 text-white p-4 rounded-full shadow-lg relative group"
          onClick={() => document.getElementById('mobileMenu').classList.toggle('hidden')}
        >
          <RxPerson size={25} />
          <span className="absolute -top-10 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap group-hover:block hidden">
            Open Menu
          </span>
        </button>
        
        <div id="mobileMenu" className="hidden absolute bottom-16 right-0 bg-white rounded-lg shadow-xl w-48">
          <div className="py-2">
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => { setActive(1); }}>
              <RxPerson size={20} />
              <span>Profile</span>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => { setActive(2); }}>
              <HiOutlineShoppingBag size={20} />
              <span>Orders</span>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => { setActive(3); }}>
              <HiOutlineReceiptRefund size={20} />
              <span>Refunds</span>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => { setActive(4); }}>
              <AiOutlineSetting size={20} />
              <span>Settings</span>
            </button>
            <button className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                    onClick={() => { setActive(5); }}>
              <AiOutlineLogin size={20} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
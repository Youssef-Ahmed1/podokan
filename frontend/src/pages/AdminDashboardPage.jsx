import React, { useState } from "react";
import AdminHeader from "../components/Layout/AdminHeader";
import AdminSideBar from "../components/Admin/Layout/AdminSideBar";
import AdminDashboardMain from "../components/Admin/AdminDashboardMain";

const AdminDashboardPage = () => {
    const [active, setActive] = useState(1);
  
    return (
      <div>
        <AdminHeader />
        <div className="w-full flex">
          <div className="flex items-start justify-between w-full">
            <div className="w-[250px] 500px:w-[330px]">
              <AdminSideBar active={active} setActive={setActive} />
            </div>
            <div className="flex-1">
              <AdminDashboardMain />
            </div>
          </div>
        </div>
      </div>
    );
  };
  export default  AdminDashboardPage
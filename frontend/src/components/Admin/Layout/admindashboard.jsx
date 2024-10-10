import React, { useState } from 'react';
import AdminDashboardMain from '../AdminDashboardMain';
import AdminSideBar from './AdminSideBar';

const AdminDashboard = () => {
  const [active, setActive] = useState(1);

  return (
    <div className="flex">
      <div className="w-1/4">
        <AdminSideBar active={active} setActive={setActive} />
      </div>
      <div className="w-3/4 p-4">
        {active === 1 && <AdminDashboardMain />}
      </div>
    </div>
  );
};
export default AdminDashboard;
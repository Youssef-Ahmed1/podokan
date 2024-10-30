import React, { useState } from 'react';
import AdminHeader from '../components/Layout/AdminHeader';
import AdminSideBar from '../components/Admin/Layout/AdminSideBar';
import AdminProductApproval from '../components/Admin/Layout/AdminProductApproval';

const AdminApprovalProducts = () => {
  const [active, setActive] = useState(3);

  return (
    <div>
      <AdminHeader />
      <div className="flex">
        <div className="w-1/4">
          <AdminSideBar active={active} setActive={setActive} />
        </div>
        <div className="w-3/4">
          <AdminProductApproval />
        </div>
      </div>
    </div>
  );
};

export default AdminApprovalProducts;

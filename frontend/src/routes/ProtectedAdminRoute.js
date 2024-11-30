import React, { useEffect, useState } from "react";
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const { loading, isAuthenticated, user } = useSelector((state) => state.user);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user || !(user.role === 'Admin' || user.role === 'admin')) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


export default ProtectedAdminRoute;
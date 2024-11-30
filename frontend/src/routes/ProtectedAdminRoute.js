import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

const ProtectedAdminRoute = ({ children }) => {
  const { loading, isAuthenticated, user } = useSelector((state) => state.user);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || user.role !== 'Admin' || 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedAdminRoute;
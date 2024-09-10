import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import Dashboard from '../../dashboard2/Dashboard';

const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { product, pendingProducts, isLoading, error } = useSelector((state) => state.product);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setStatus(product.status);
  };

  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };

  const handleRejectionReasonChange = (e) => {
    setRejectionReason(e.target.value);
  };

  const handleSaveDesign = (data) => {
    if (selectedProduct) {
      setSelectedProduct({ ...selectedProduct, designData: data });
    }
  };

  const handleSubmit = () => {
    if (selectedProduct) {
      dispatch(approveRejectProduct(selectedProduct._id, status, rejectionReason))
        .then(() => {
          toast.success('Product status updated successfully');
          navigate('/admin/dashboard');
        })
        .catch((error) => {
          toast.error(error.message);
        });
    }
  };


  return (
    <div className="p-4">
      <h2>Admin Product Approval</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div className="mt-4">
          <h3>Pending Products</h3>
          <ul>
            {pendingProducts && pendingProducts.map((product) => (
              <li key={product._id}>
                <button onClick={() => handleProductSelect(product)}>{product.DesignTitle}</button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {selectedProduct && (
        <div className="mt-4">
          <h3>Product Details</h3>
          <p>Name: {selectedProduct.name}</p>
          <p>Description: {selectedProduct.Description}</p>
          <p>Category: {selectedProduct.category}</p>
          <p>Tags: {selectedProduct.tags}</p>
          <p>Original Price: {selectedProduct.originalPrice}</p>
          <p>Discount Price: {selectedProduct.discountPrice}</p>
          <p>Stock: {selectedProduct.stock}</p>
          <div className="mt-2">
            <label>Status:</label>
            <select value={status} onChange={handleStatusChange} className="ml-2">
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
              <option value="sitePick">Site Pick</option>
            </select>
          </div>
          {status === 'rejected' && (
            <div className="mt-2">
              <label>Rejection Reason:</label>
              <textarea
                value={rejectionReason}
                onChange={handleRejectionReasonChange}
                rows="4"
                className="w-full mt-1"
              ></textarea>
            </div>
          )}
          <div className="mt-4">
            <h4>Design</h4>
            <Dashboard onSave={handleSaveDesign} initialData={selectedProduct.designData} />
          </div>
          <button onClick={handleSubmit} className="mt-4">Submit</button>
        </div>
      )}
    </div>
  );
};

export default AdminProductApproval;
import  {React, useEffect, useState } from 'react';
import { useDispatch} from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '/home/user/podokan/frontend/src/redux/actions/product';
import Dashboard from '../components/dashboard2/Dashboard';
import AdminHeader from '../components/Layout/AdminHeader';
import AdminSideBar from '../components/Admin/Layout/AdminSideBar';

const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
    const { pendingProducts , fetchPendingProducts  } = useSelector((state) => state.products);
    
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [status, setStatus] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

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
    <div>
      <AdminHeader />
      <div className="flex">
        <div className="w-1/4">
          <AdminSideBar active={9} />
        </div>
        <div className="w-3/4 p-4">
          <h2>Admin Product Approval</h2>
          <div>
            <h3>Pending Products</h3>
            <ul>
              {pendingProducts.map((product) => (
                <li key={product._id}>
                  <button onClick={() => handleProductSelect(product)}>{product.name}</button>
                </li>
              ))}
            </ul>
          </div>
          {selectedProduct && (
            <div>
              <h3>Product Details</h3>
              <p>Name: {selectedProduct.name}</p>
              <p>Description: {selectedProduct.description}</p>
              <p>Category: {selectedProduct.category}</p>
              <p>Tags: {selectedProduct.tags}</p>
              <p>Original Price: {selectedProduct.originalPrice}</p>
              <p>Discount Price: {selectedProduct.discountPrice}</p>
              <p>Stock: {selectedProduct.stock}</p>
              <div>
                <label>Status:</label>
                <select value={status} onChange={handleStatusChange}>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                  <option value="public">Public</option>
                  <option value="restricted">Restricted</option>
                  <option value="sitePick">Site Pick</option>
                </select>
              </div>
              {status === 'rejected' && (
                <div>
                  <label>Rejection Reason:</label>
                  <textarea
                    value={rejectionReason}
                    onChange={handleRejectionReasonChange}
                    rows="4"
                  ></textarea>
                </div>
              )}
              <div>
                <h4>Design</h4>
                <Dashboard onSave={handleSaveDesign} initialData={selectedProduct.designData} />
              </div>
              <button onClick={handleSubmit}>Submit</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProductApproval;
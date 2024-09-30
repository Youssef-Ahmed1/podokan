import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import styles from '../../../styles/styles';

const statusOptions = [
  'pending', 'rejected','restricted', 'public'
];

const productTypes = [
  't-shirt', 'hoodie'
];
const colorOptions = [
  'red', 'blue', 'green', 'yellow', 'purple', 'pink','gray'
];

const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { isLoading, error, pendingProducts } = useSelector((state) => state.product);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleProductSelect = (product) => {
    console.log("Selected product:", product);
    setSelectedProduct(product);
    setEditedProduct({ ...product });
    setRejectionReason('');
  };

  const isProductVisible = (product) => {
    if (product.status === 'public') return true;
    if (product.status === 'restricted' && (user?._id === product.shop._id || user?.role === 'admin')) return true;
    if (product.status === 'pending' && user?.role === 'admin') return true;
    return false;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const parsedValue = name === 'originalPrice' || name === 'discountPrice' ? parseFloat(value) : value;
    console.log(`Updating ${name} to:`, parsedValue);
    setEditedProduct(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleColorChange = (color) => {
    setEditedProduct(prev => ({ ...prev, ProductColor: color }));
  };

  const handleApprove = async () => {
    console.log("handleApprove called");
    console.log("editedProduct:", editedProduct);
    console.log("rejectionReason:", rejectionReason);
    if (!editedProduct) {
      toast.error('No product selected');
      return;
    }
  
    if (editedProduct.status === 'rejected' && !rejectionReason) {
      toast.error('Please provide a reason for rejection');
      return;
    }
  
    // Ensure originalPrice is a number and not empty
    const originalPrice = parseFloat(editedProduct.originalPrice);
    if (isNaN(originalPrice) || originalPrice <= 0) {
      toast.error('Please enter a valid original price');
      return;
    }
  
    try {
      const updates = {
        DesignTitle: editedProduct.DesignTitle,
        Description: editedProduct.Description,
        Maintag: editedProduct.Maintag,
        Designtags: editedProduct.Designtags,
        ProductType: editedProduct.ProductType,
        ProductView: editedProduct.ProductView,
        ProductColor: editedProduct.ProductColor,
        DesignScale: editedProduct.DesignScale,
        originalPrice: originalPrice,
        discountPrice: parseFloat(editedProduct.discountPrice) || originalPrice,
        status: editedProduct.status
      };
  
      const result = await dispatch(approveRejectProduct(editedProduct._id, editedProduct.status, rejectionReason, updates));
      if (result.success) {
        toast.success(result.message);
        setSelectedProduct(null);
        setEditedProduct(null);
        setRejectionReason('');
        dispatch(fetchPendingProducts());
      } else {
        toast.error(result.message || 'Failed to update product status');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while updating the product');
    }
  };

  const handleZoom = (direction) => {
    setEditedProduct(prev => ({
      ...prev,
      DesignScale: direction === 'in' 
        ? Math.min(prev.DesignScale + 0.1, 2) 
        : Math.max(prev.DesignScale - 0.1, 0.5)
    }));
  };

  const getDesignImageUrl = (product) => {
    if (product && product.designImage) {
      if (typeof product.designImage === 'string') {
        return product.designImage;
      } else if (product.designImage.url) {
        return product.designImage.url;
      }
    }
    console.log("No design image available for product:", product);
    return '';
  };

  const getMockupUrl = (product) => {
    if (!product) return '';
  
    console.log("Product data for mockup:", product);
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const version =
      product.ProductType === "hoodie"
        ? "v1724798769"
        : product.ProductType === "t-shirt"
        ? "v1724807956"
        : "v1725243203"; 
    const folder = product.ProductType === "hoodie" ? "hoodies" : "shirts";
    const filename = `${product.ProductType === "hoodie" ? "hoodie" : "t-shirt"}-${product.ProductColor}-${product.ProductView}`;
    const extension = product.ProductType === "hoodie" ? "jpg" : "webp";
  
    const url = `${baseUrl}${version}/${folder}/${filename}.${extension}`;
    console.log("Generated mockup URL:", url);
    return url;
  };
  
  return (
    <div className="w-full px-8 pt-1 mt-10 bg-white flex flex-col items-center">
      <h2 className={`${styles.title} text-[25px]`}>Admin Product Approval</h2>
      <div className="w-full max-w-4xl flex flex-wrap justify-center">
        <div className="w-full md:w-1/3 p-4">
          <h3 className={`${styles.subtitle} mb-4`}>Pending Products</h3>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <ul className="space-y-2">
              {pendingProducts && pendingProducts.map((product) => (
                <li key={product._id}>
                  <button
                    onClick={() => handleProductSelect(product)}
                    className={`w-full text-center px-4 py-2 bg-[#4e64df] text-slate-200 rounded-xl`}
                  >
                    {product.DesignTitle} - {product.status}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedProduct && (
          <div className="w-full md:w-2/3 p-4">
            <h3 className={`${styles.subtitle} mb-4`}>Product Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={styles.label}>Design Title:</label>
                <input 
                  type="text" 
                  name="DesignTitle" 
                  value={editedProduct.DesignTitle} 
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>Design Scale:</label>
                <input 
                  type="number" 
                  name="DesignScale" 
                  value={editedProduct.DesignScale} 
                  onChange={handleInputChange}
                  step="0.1"
                  min="0.5"
                  max="2"
                  className={styles.input}
                />
              </div>
              <div className="md:col-span-2">
                <label className={styles.label}>Description:</label>
                <textarea 
                  name="Description" 
                  value={editedProduct.Description} 
                  onChange={handleInputChange}
                  className={`${styles.textarea} h-40 border-2 border-gray-300 p-2 w-full`}
                  rows="6"
                />
              </div>
              <div>
                <label className={styles.label}>Main Tag:</label>
                <input 
                  type="text" 
                  name="Maintag" 
                  value={editedProduct.Maintag} 
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>Design Tags:</label>
                <input 
                  type="text" 
                  name="Designtags" 
                  value={editedProduct.Designtags} 
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>Product Type:</label>
                <select
                  name="ProductType"
                  value={editedProduct.ProductType}
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  {productTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.label}>Product View:</label>
                <select
                  name="ProductView"
                  value={editedProduct.ProductView}
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  <option value="front">Front</option>
                  <option value="back">Back</option>
                </select>
              </div>
              <div>
                <label className={styles.label}>Status:</label>
                <select
                  name="status"
                  value={editedProduct?.status || ''}
                  onChange={handleInputChange}
                  className={styles.input}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {editedProduct?.status === 'rejected' && (
                  <div>
                    <label className={styles.label}>Rejection Reason:</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className={` border-gray-600 `}
                      rows="3"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={styles.label}>Original Price:</label>
                <input 
                  type="number" 
                  name="originalPrice" 
                  value={editedProduct.originalPrice} 
                  onChange={handleInputChange}
                  className={styles.input}
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className={styles.label}>Discounted Price:</label>
                <input 
                  type="number" 
                  name="discountPrice" 
                  value={editedProduct.discountPrice} 
                  onChange={handleInputChange}
                  className={styles.input}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className={styles.label}>Product Colors:</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <label key={color} className="flex items-center">
                      <input
                        type="radio"
                        name="ProductColor"
                        value={color}
                        checked={editedProduct.ProductColor === color}
                        onChange={() => handleColorChange(color)}
                        className="mr-1"
                      />
                      <span style={{
                        display: 'inline-block',
                        width: '20px',
                        height: '20px',
                        backgroundColor: color,
                        border: '1px solid black',
                        marginRight: '5px'
                      }}></span>
                      {color}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-8 border-2 border-gray-300 p-4 rounded-lg">
              <h4 className={styles.subtitle}>Design Preview</h4>
              <div className="relative w-full h-[500px] bg-gray-100">
                <img
                  src={getMockupUrl(editedProduct)}
                  alt="Product Mockup"
                  className="w-full h-full object-contain"
                />
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    transform: `translate(-50%, -50%) scale(${editedProduct.DesignScale})`,
                    width: '200px',
                    height: '200px'
                  }}
                >
                  {editedProduct.designImage && (
                    <img
                      src={getDesignImageUrl(editedProduct)}
                      alt="Design Preview"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <button
                  onClick={() => handleZoom('in')}
                  className={`${styles.button} bg-green-500`}
                >
                  Zoom In
                </button>
                <button
                  onClick={() => handleZoom('out')}
                  className={`${styles.button} bg-red-500`}
                >
                  Zoom Out
                </button>
              </div>
            </div>
            <div className="mt-6 space-x-4 flex justify-center">
              <button 
                onClick={handleApprove} 
                className={`${styles.button} bg-green-600`}
              >
                Update Product Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductApproval;
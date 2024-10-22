import React, { useEffect, useState, memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import styles from '../../../styles/styles';

// Constants definitions (as before)
const STATUS_OPTIONS = {
  pending: { value: 'pending', label: 'Pending Review', color: 'bg-yellow-500' },
  rejected: { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  restricted: { value: 'restricted', label: 'Restricted Access', color: 'bg-purple-500' },
  public: { value: 'public', label: 'Public', color: 'bg-green-500' }
};

const PRODUCT_TYPES = {
  't-shirt': { 
    value: 't-shirt', 
    label: 'T-Shirt', 
    basePrice: 20,
    premiumPrice: 30,
    icon: '👕'
  },
  'hoodie': { 
    value: 'hoodie', 
    label: 'Hoodie', 
    basePrice: 40,
    premiumPrice: 60,
    icon: '🧥'
  },
  'long-sleeve': { 
    value: 'long-sleeve', 
    label: 'Long Sleeve', 
    basePrice: 30,
    premiumPrice: 45,
    icon: '👔'
  }
};

const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' },
  red: { value: 'red', label: 'Red', hex: '#ff0000', textColor: 'text-white' },
  blue: { value: 'blue', label: 'Blue', hex: '#0000ff', textColor: 'text-white' },
  gray: { value: 'gray', label: 'Gray', hex: '#808080', textColor: 'text-white' }
};

// ProductPreview Component
const ProductPreview = memo(({ editedProduct, onZoom, onViewChange }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [previewMode, setPreviewMode] = useState('mockup');

  const getMockupUrl = useCallback((product) => {
    if (!product) return '';
    
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const config = {
      hoodie: {
        version: "v1728392918",
        folder: "hoodies",
        filename: `hoodie-${product.ProductColor}-${product.ProductView}`
      },
      "t-shirt": {
        version: "v1728393898",
        folder: "t-shirts",
        filename: `t-shirt-${product.ProductColor}-${product.ProductView}`
      },
      "long-sleeve": {
        version: "v1728394665",
        folder: "long-sleeves",
        filename: product.ProductColor === "gray" 
          ? `longsleeves-${product.ProductColor}-${product.ProductView}`
          : ["white", "black"].includes(product.ProductColor)
            ? `longseleves-${product.ProductColor}-${product.ProductView}`
            : `t-shirt-${product.ProductColor}-${product.ProductView}`
      }
    };

    const productConfig = config[product.ProductType];
    return productConfig 
      ? `${baseUrl}${productConfig.version}/${productConfig.folder}/${productConfig.filename}.png`
      : "";
  }, []);

  const getDesignImageUrl = useCallback((product) => {
    if (!product?.designImage) return '';
    return typeof product.designImage === 'string' 
      ? product.designImage 
      : product.designImage.url || '';
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setPreviewMode('mockup')}
            className={`px-4 py-2 rounded-lg transition-all ${
              previewMode === 'mockup' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Mockup View
          </button>
          <button
            onClick={() => setPreviewMode('design')}
            className={`px-4 py-2 rounded-lg transition-all ${
              previewMode === 'design' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Design Only
          </button>
        </div>
      </div>

      <div className="relative w-full h-[500px] bg-gray-100">
        <img
          src={previewMode === 'mockup' ? getMockupUrl(editedProduct) : getDesignImageUrl(editedProduct)}
          alt="Product Preview"
          className="w-full h-full object-contain transition-opacity duration-300"
          onLoad={() => setIsLoading(false)}
          style={{ opacity: isLoading ? 0 : 1 }}
        />

        {previewMode === 'mockup' && (
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
              transform: `translate(-50%, -50%) scale(${editedProduct.DesignScale})`,
              width: '200px',
              height: '200px'
            }}
          >
            <img
              src={getDesignImageUrl(editedProduct)}
              alt="Design Overlay"
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-gray-50 flex justify-between items-center">
        <button
          onClick={() => onViewChange(editedProduct.ProductView === 'front' ? 'back' : 'front')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all"
        >
          Switch to {editedProduct.ProductView === 'front' ? 'Back' : 'Front'}
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => onZoom('out')}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            -
          </button>
          <span className="font-medium">
            {(editedProduct.DesignScale * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => onZoom('in')}
            className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
});// Price Configuration Component
const PriceConfiguration = memo(({ editedProduct, onPriceChange }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Price Settings</h3>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${showDetails ? 'max-h-[400px]' : 'max-h-0'} overflow-hidden`}>
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Original Price (£)
            </label>
            <input
              type="number"
              value={editedProduct.originalPrice || ''}
              onChange={(e) => onPriceChange({
                originalPrice: parseFloat(e.target.value),
                discountPrice: editedProduct.discountPrice
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount Price (£) - Optional
            </label>
            <input
              type="number"
              value={editedProduct.discountPrice || ''}
              onChange={(e) => onPriceChange({
                originalPrice: editedProduct.originalPrice,
                discountPrice: e.target.value ? parseFloat(e.target.value) : null
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.01"
            />
          </div>

          {editedProduct.discountPrice && editedProduct.discountPrice < editedProduct.originalPrice && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Discount:</span>
                <span className="font-bold text-green-700">
                  {(((editedProduct.originalPrice - editedProduct.discountPrice) / editedProduct.originalPrice) * 100).toFixed(0)}% OFF
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-50">
        <div className="flex items-baseline space-x-3">
          <span className="text-2xl font-bold">
            £{editedProduct.originalPrice?.toFixed(2) || '0.00'}
          </span>
          {editedProduct.discountPrice && editedProduct.discountPrice < editedProduct.originalPrice && (
            <>
              <span className="text-lg line-through text-gray-500">
                £{editedProduct.discountPrice.toFixed(2)}
              </span>
              <span className="text-sm text-green-600 font-medium">
                {(((editedProduct.originalPrice - editedProduct.discountPrice) / editedProduct.originalPrice) * 100).toFixed(0)}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});

// Main AdminProductApproval Component
const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { isLoading, error, pendingProducts } = useSelector((state) => state.product);
  const { user } = useSelector((state) => state.user);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      originalPrice: product.originalPrice || PRODUCT_TYPES[product.ProductType]?.basePrice || 20
    });
    setRejectionReason('');
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({
      ...prev,
      [name]: name === 'originalPrice' || name === 'discountPrice' 
        ? parseFloat(value) 
        : value
    }));
  }, []);

  const handlePriceChange = useCallback(({ originalPrice, discountPrice }) => {
    setEditedProduct(prev => ({
      ...prev,
      originalPrice,
      discountPrice
    }));
  }, []);

  const handleStatusChange = useCallback((status) => {
    setEditedProduct(prev => ({ ...prev, status }));
    if (status !== 'rejected') {
      setRejectionReason('');
    }
  }, []);

  const handleSubmit = async () => {
    if (!editedProduct) {
      toast.error('No product selected');
      return;
    }

    if (editedProduct.status === 'rejected' && !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    const originalPrice = parseFloat(editedProduct.originalPrice);
    if (isNaN(originalPrice) || originalPrice <= 0) {
      toast.error('Please enter a valid original price');
      return;
    }

    setIsSubmitting(true);
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
        discountPrice: editedProduct.discountPrice,
        status: editedProduct.status
      };

      const result = await dispatch(
        approveRejectProduct(
          editedProduct._id,
          editedProduct.status,
          rejectionReason,
          updates
        )
      );

      if (result.success) {
        toast.success(result.message);
        setSelectedProduct(null);
        setEditedProduct(null);
        setRejectionReason('');
        dispatch(fetchPendingProducts());
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user?.role === 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h2 className="text-2xl font-bold text-red-600">
          Access Denied: Admin Only
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Product Approval Dashboard
            </h1>
            <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {pendingProducts?.length || 0} Pending Reviews
            </span>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Product List */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Pending Products
                  </h2>
                </div>
                
                {isLoading ? (
                  <div className="p-8 flex justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {pendingProducts?.map((product) => (
                      <button
                        key={product._id}
                        onClick={() => handleProductSelect(product)}
                        className={`
                          w-full p-4 rounded-lg transition-all duration-200
                          ${selectedProduct?._id === product._id 
                            ? 'bg-blue-50 border-2 border-blue-500' 
                            : 'hover:bg-gray-50 border border-gray-200'}
                        `}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {product.DesignTitle}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(product.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`
                            px-3 py-1 rounded-full text-xs font-medium
                            ${STATUS_OPTIONS[product.status].color} text-white
                          `}>
                            {STATUS_OPTIONS[product.status].label}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {selectedProduct && (
              <div className="w-full lg:w-2/3 space-y-6">
                <ProductPreview
                  editedProduct={editedProduct}
                  onZoom={(direction) => {
                    setEditedProduct(prev => ({
                      ...prev,
                      DesignScale: direction === 'in' 
                        ? Math.min(prev.DesignScale + 0.1, 2) 
                        : Math.max(prev.DesignScale - 0.1, 0.5)
                    }));
                  }}
                  onViewChange={(view) => handleInputChange({
                    target: { name: 'ProductView', value: view }
                  })}
                />

                <PriceConfiguration
                  editedProduct={editedProduct}
                  onPriceChange={handlePriceChange}
                />

                {/* Status Selection */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Status Update
                    </h3>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Object.entries(STATUS_OPTIONS).map(([key, status]) => (
                        <button
                          key={key}
                          onClick={() => handleStatusChange(key)}
                          className={`
                            p-3 rounded-lg transition-all duration-200
                            ${editedProduct.status === key 
                              ? `${status.color} text-white` 
                              : 'bg-gray-100 hover:bg-gray-200'}
                          `}
                        >
                          {status.label}
                        </button>
                      ))}
                    </div>

                    {editedProduct.status === 'rejected' && (
                      <div className="animate-fadeIn">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          rows="3"
                          placeholder="Please provide a reason for rejection..."
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`
                    w-full py-3 rounded-lg text-white font-medium
                    transition-all duration-200
                    ${isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'}
                  `}
                >
                  {isSubmitting ? 'Updating...' : 'Update Product'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AdminProductApproval);
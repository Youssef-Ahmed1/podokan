import React, { useEffect, useState, memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import styles from '../../../styles/styles';

// Constants and Configuration
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
    icon: '👕',
    description: 'Classic short sleeve t-shirt'
  },
  'hoodie': { 
    value: 'hoodie', 
    label: 'Hoodie', 
    basePrice: 40,
    premiumPrice: 60,
    icon: '🧥',
    description: 'Comfortable pullover hoodie'
  },
  'long-sleeve': { 
    value: 'long-sleeve', 
    label: 'Long Sleeve', 
    basePrice: 30,
    premiumPrice: 45,
    icon: '👔',
    description: 'Classic long sleeve t-shirt'
  }
};

const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' },
  red: { value: 'red', label: 'Red', hex: '#ff0000', textColor: 'text-white' },
  blue: { value: 'blue', label: 'Blue', hex: '#0000ff', textColor: 'text-white' },
  gray: { value: 'gray', label: 'Gray', hex: '#808080', textColor: 'text-white' }
};

// Animation Keyframes
const KEYFRAMES = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideIn {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes scaleIn {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Utility Components
const LoadingSpinner = memo(() => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8 flex flex-col items-center">
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      <p className="mt-4 text-gray-600">Processing...</p>
    </div>
  </div>
));

const ErrorBoundary = memo(({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Error caught by boundary:', error);
      setHasError(true);
      toast.error('An error occurred. Please refresh the page.');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return children;
});

// Price Calculator Component
const PriceCalculator = memo(({ 
  productType, 
  originalPrice, 
  discountPrice, 
  onPriceChange 
}) => {
  const [showCalculator, setShowCalculator] = useState(false);
  const [customPrice, setCustomPrice] = useState(false);
  
  const productConfig = PRODUCT_TYPES[productType];
  const standardPrice = productConfig?.basePrice || 20;
  const premiumPrice = productConfig?.premiumPrice || 30;

  const calculateDiscount = useCallback((original, discounted) => {
    if (!discounted || discounted >= original) return 0;
    return ((original - discounted) / original * 100).toFixed(0);
  }, []);

  const handlePriceUpdate = useCallback((prices) => {
    setCustomPrice(true);
    onPriceChange(prices);
  }, [onPriceChange]);

  const handlePresetPrice = useCallback((isPreview) => {
    setCustomPrice(false);
    onPriceChange({
      originalPrice: isPreview ? premiumPrice : standardPrice,
      discountPrice: null
    });
  }, [standardPrice, premiumPrice, onPriceChange]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            Price Configuration
          </h3>
          <button
            onClick={() => setShowCalculator(!showCalculator)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            {showCalculator ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
      </div>

      <div className={`
        transition-all duration-300 ease-in-out
        ${showCalculator ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="p-4 space-y-4">
          {/* Preset Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              className={`
                p-4 rounded-lg cursor-pointer transition-all duration-200
                ${!customPrice && originalPrice === standardPrice 
                  ? 'bg-blue-50 border-2 border-blue-500' 
                  : 'bg-gray-50 hover:bg-gray-100'}
              `}
              onClick={() => handlePresetPrice(false)}
            >
              <h4 className="font-medium text-gray-800">Standard Material</h4>
              <p className="text-2xl font-bold text-gray-900">£{standardPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">Regular quality fabric</p>
            </div>

            <div 
              className={`
                p-4 rounded-lg cursor-pointer transition-all duration-200
                ${!customPrice && originalPrice === premiumPrice 
                  ? 'bg-blue-50 border-2 border-blue-500' 
                  : 'bg-gray-50 hover:bg-gray-100'}
              `}
              onClick={() => handlePresetPrice(true)}
            >
              <h4 className="font-medium text-gray-800">Premium Material</h4>
              <p className="text-2xl font-bold text-gray-900">£{premiumPrice.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">High-quality fabric</p>
            </div>
          </div>

          {/* Custom Price Inputs */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Custom Pricing</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Original Price (£)
                </label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => handlePriceUpdate({
                    originalPrice: parseFloat(e.target.value),
                    discountPrice
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Discounted Price (£)
                </label>
                <input
                  type="number"
                  value={discountPrice || ''}
                  onChange={(e) => handlePriceUpdate({
                    originalPrice,
                    discountPrice: parseFloat(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          {/* Discount Display */}
          {discountPrice && discountPrice < originalPrice && (
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-green-700 font-medium">Discount:</span>
                <span className="text-green-700 font-bold">
                  {calculateDiscount(originalPrice, discountPrice)}% OFF
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current Price Display */}
      <div className="p-4 bg-gray-50">
        <div className="flex items-baseline space-x-3">
          <span className="text-2xl font-bold text-gray-900">
            £{originalPrice.toFixed(2)}
          </span>
          {discountPrice && discountPrice < originalPrice && (
            <>
              <span className="text-lg line-through text-gray-500">
                £{discountPrice.toFixed(2)}
              </span>
              <span className="text-sm text-green-600 font-medium">
                {calculateDiscount(originalPrice, discountPrice)}% OFF
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
});// ColorPicker Component
const ColorPicker = memo(({ selectedColor, onColorChange }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Color Selection</h3>
          <div 
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{ backgroundColor: COLOR_OPTIONS[selectedColor].hex }}
          />
        </div>
      </div>

      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(COLOR_OPTIONS).map(([key, color]) => (
          <button
            key={key}
            onClick={() => onColorChange(key)}
            className={`
              group relative p-3 rounded-lg transition-all duration-200
              ${selectedColor === key 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-6 h-6 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hex }}
              />
              <span className={`font-medium ${color.textColor}`}>
                {color.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// ProductTypeSelector Component
const ProductTypeSelector = memo(({ selectedType, onTypeChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Product Type</h3>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(PRODUCT_TYPES).map(([key, type]) => (
          <button
            key={key}
            onClick={() => onTypeChange(key)}
            className={`
              p-4 rounded-lg transition-all duration-200
              ${selectedType === key 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50 border border-gray-200'}
            `}
          >
            <div className="text-2xl mb-2">{type.icon}</div>
            <h4 className="font-medium text-gray-800">{type.label}</h4>
            <p className="text-sm text-gray-500 mt-1">{type.description}</p>
            <div className="mt-2 text-sm font-medium text-gray-600">
              From £{type.basePrice.toFixed(2)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

// StatusSelector Component
const StatusSelector = memo(({ currentStatus, onStatusChange, rejectionReason, onReasonChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Product Status</h3>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(STATUS_OPTIONS).map(([key, status]) => (
            <button
              key={key}
              onClick={() => onStatusChange(key)}
              className={`
                p-3 rounded-lg transition-all duration-200 flex flex-col items-center
                ${currentStatus === key 
                  ? `${status.color} text-white` 
                  : 'bg-gray-100 hover:bg-gray-200'}
              `}
            >
              <span className="font-medium">{status.label}</span>
            </button>
          ))}
        </div>

        {currentStatus === 'rejected' && (
          <div className="animate-fadeIn">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows="3"
              placeholder="Please provide a reason for rejection..."
            />
          </div>
        )}
      </div>
    </div>
  );
});

// ValidationSystem
const useValidation = (editedProduct, rejectionReason) => {
  return useMemo(() => {
    const errors = [];

    if (!editedProduct) {
      errors.push('No product selected');
      return errors;
    }

    if (!editedProduct.DesignTitle?.trim()) {
      errors.push('Design title is required');
    }

    if (!editedProduct.Description?.trim()) {
      errors.push('Description is required');
    }

    if (!editedProduct.Maintag?.trim()) {
      errors.push('Main tag is required');
    }

    if (editedProduct.status === 'rejected' && !rejectionReason?.trim()) {
      errors.push('Rejection reason is required');
    }

    const originalPrice = parseFloat(editedProduct.originalPrice);
    if (isNaN(originalPrice) || originalPrice <= 0) {
      errors.push('Valid original price is required');
    }

    if (editedProduct.discountPrice) {
      const discountPrice = parseFloat(editedProduct.discountPrice);
      if (isNaN(discountPrice) || discountPrice >= originalPrice) {
        errors.push('Discount price must be lower than original price');
      }
    }

    return errors;
  }, [editedProduct, rejectionReason]);
};const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { isLoading, error, pendingProducts } = useSelector((state) => state.product);
  const { user } = useSelector((state) => state.user);
  
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const validationErrors = useValidation(editedProduct, rejectionReason);

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

  const handleColorChange = useCallback((color) => {
    setEditedProduct(prev => ({ ...prev, ProductColor: color }));
  }, []);

  const handleTypeChange = useCallback((type) => {
    setEditedProduct(prev => ({
      ...prev,
      ProductType: type,
      originalPrice: PRODUCT_TYPES[type]?.basePrice || 20
    }));
  }, []);

  const handleStatusChange = useCallback((status) => {
    setEditedProduct(prev => ({ ...prev, status }));
    if (status !== 'rejected') {
      setRejectionReason('');
    }
  }, []);

  const handlePriceChange = useCallback(({ originalPrice, discountPrice }) => {
    setEditedProduct(prev => ({
      ...prev,
      originalPrice,
      discountPrice
    }));
  }, []);

  const handleSubmit = async () => {
    if (validationErrors.length > 0) {
      validationErrors.forEach(error => toast.error(error));
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
        originalPrice: editedProduct.originalPrice,
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
    <ErrorBoundary>
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
                      <LoadingSpinner />
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
                  {/* Product Preview */}
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

                  {/* Product Type Selection */}
                  <ProductTypeSelector
                    selectedType={editedProduct.ProductType}
                    onTypeChange={handleTypeChange}
                  />

                  {/* Color Selection */}
                  <ColorPicker
                    selectedColor={editedProduct.ProductColor}
                    onColorChange={handleColorChange}
                  />

                  {/* Price Configuration */}
                  <PriceCalculator
                    productType={editedProduct.ProductType}
                    originalPrice={editedProduct.originalPrice}
                    discountPrice={editedProduct.discountPrice}
                    onPriceChange={handlePriceChange}
                  />

                  {/* Status Selection */}
                  <StatusSelector
                    currentStatus={editedProduct.status}
                    onStatusChange={handleStatusChange}
                    rejectionReason={rejectionReason}
                    onReasonChange={setRejectionReason}
                  />

                  {/* Basic Info */}
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Basic Information
                      </h3>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Design Title
                        </label>
                        <input
                          type="text"
                          name="DesignTitle"
                          value={editedProduct.DesignTitle}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          name="Description"
                          value={editedProduct.Description}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Main Tag
                          </label>
                          <input
                            type="text"
                            name="Maintag"
                            value={editedProduct.Maintag}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Design Tags
                          </label>
                          <input
                            type="text"
                            name="Designtags"
                            value={editedProduct.Designtags}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || validationErrors.length > 0}
                    className={`
                      w-full py-3 rounded-lg text-white font-medium
                      transition-all duration-200
                      ${isSubmitting || validationErrors.length > 0
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
      </div>

      {isSubmitting && <LoadingSpinner />}
    </ErrorBoundary>
  );
};

export default memo(AdminProductApproval);
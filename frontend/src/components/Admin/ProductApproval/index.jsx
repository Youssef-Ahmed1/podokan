import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { fetchPendingProducts, approveRejectProduct } from '../../../redux/actions/product';
import { useDesignPosition } from '../../../hooks/useDesignPosition';

import DesignPreview from '../../shared/DesignPreview';
import ProductConfig from '../ProductApproval/ProductConfig';
import ValidationSystem from '../ProductApproval/ValidationSystem';
import StatusManager from '../ProductApproval/StatusManager';
import PriceCalculator from '../ProductApproval/PriceCalculator';

import { STATUS_CONFIG, PRODUCT_TYPES  , DEFAULT_PRODUCT_CONFIG } from '../ProductApproval/constants/productConfig';

const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { isLoading, pendingProducts } = useSelector((state) => state.product);

  // State management
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showGridLines, setShowGridLines] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Design position management using custom hook
  const {
    position,
    scale,
    isDragging,
    isOutOfBounds,
    handleDragStart,
    handleScaleChange,
    updatePosition,
    centerDesign,
    reset: resetDesignPosition,
    bounds
  } = useDesignPosition({
    initialPosition: editedProduct?.DesignPosition || { x: 50, y: 30 },
    initialScale: editedProduct?.DesignScale || 0.5,
    productType: editedProduct?.ProductType || 'hoodie',
    disabled: isSubmitting
  });

  // Load pending products
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Enhanced filtering with sorting
  const filteredProducts = useMemo(() => {
    if (!pendingProducts) return [];
    
    let filtered = pendingProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.DesignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.Description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.mainTags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.Designtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });

    // Sort products
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.direction === 'asc') {
        return aValue < bValue ? -1 : 1;
      } else {
        return aValue > bValue ? -1 : 1;
      }
    });

    return filtered;
  }, [pendingProducts, searchQuery, filterStatus, sortConfig]);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    if (!product || typeof product !== 'object') {
      console.error('Invalid product data:', product);
      return;
    }
  
    try {
      setSelectedProduct(product);
      setEditedProduct({
        ...product,
        DesignScale: product.DesignScale || 0.5,
        DesignPosition: product.DesignPosition || { x: 50, y: 30 },
        designImage: product.designImage?.url || product.designImage || '',
        originalPrice: product.originalPrice || 
                      (PRODUCT_TYPES[product.ProductType]?.basePrice || 
                       DEFAULT_PRODUCT_CONFIG.basePrice),
        mainTags: Array.isArray(product.mainTags) ? product.mainTags : [],
        Designtags: Array.isArray(product.Designtags) ? product.Designtags : []
      });
  
      resetDesignPosition();
    } catch (error) {
      console.error('Error in handleProductSelect:', error);
      toast.error('Failed to select product');
    }
  }, [resetDesignPosition]);
// Enhanced product update handling
const DEFAULT_PRODUCT_TYPES = {
  'hoodie': { basePrice: 850 },
};

const handleProductUpdate = useCallback((updates) => {
  setEditedProduct(prev => {
    if (!prev) return prev;

    const updated = {
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    if (updates.ProductType && updates.ProductType !== prev.ProductType) {
      resetDesignPosition();
      // Add null check and use DEFAULT_PRODUCT_CONFIG
      const basePrice = PRODUCT_TYPES[updates.ProductType]?.basePrice || 
                       DEFAULT_PRODUCT_CONFIG.basePrice;
      
      updated.originalPrice = basePrice;
      updated.DesignPosition = { x: 50, y: 30 };
      updated.DesignScale = 0.5;
    }

    return updated;
  });
}, [resetDesignPosition]);

// Enhanced design position update handling
const handleDesignPositionUpdate = useCallback((newPosition, newScale) => {
  updatePosition(newPosition);
  handleScaleChange(newScale);
  
  handleProductUpdate({
    DesignPosition: newPosition,
    DesignScale: newScale
  });
}, [updatePosition, handleScaleChange, handleProductUpdate]);

// Enhanced status change handling with better error handling
const handleStatusChange = useCallback(async (newStatus) => {
  if (!editedProduct) {
    toast.error('No product selected');
    return;
  }

  try {
    setIsSubmitting(true);
    
    const result = await dispatch(
      approveRejectProduct(
        editedProduct._id,
        newStatus,
        editedProduct.rejectionReason || '',
        {
          originalPrice: editedProduct.originalPrice,
          discountPrice: editedProduct.discountPrice,
          ProductType: editedProduct.ProductType,
          ProductColor: editedProduct.ProductColor,
          DesignScale: scale,
          DesignPosition: position,
          mainTags: editedProduct.mainTags,
          Designtags: editedProduct.Designtags
        }
      )
    );

    if (result.success) {
      toast.success(result.message);
      setSelectedProduct(null);
      setEditedProduct(null);
      dispatch(fetchPendingProducts());
    }
  } catch (error) {
    console.error('Status change failed:', error);
    toast.error(error.response?.data?.message || 'Failed to update product status');
    
    // Retry mechanism
    if (window.confirm('Status update failed. Would you like to retry?')) {
      handleStatusChange(newStatus);
    }
  } finally {
    setIsSubmitting(false);
  }
}, [editedProduct, dispatch, scale, position]);

// Navigation handlers
const handleNextProduct = useCallback(() => {
  const currentIndex = filteredProducts.findIndex(p => p._id === selectedProduct?._id);
  if (currentIndex < filteredProducts.length - 1) {
    handleProductSelect(filteredProducts[currentIndex + 1]);
  }
}, [filteredProducts, selectedProduct, handleProductSelect]);

const handlePreviousProduct = useCallback(() => {
  const currentIndex = filteredProducts.findIndex(p => p._id === selectedProduct?._id);
  if (currentIndex > 0) {
    handleProductSelect(filteredProducts[currentIndex - 1]);
  }
}, [filteredProducts, selectedProduct, handleProductSelect]);

// Sort handler
const handleSort = useCallback((key) => {
  setSortConfig(prev => ({
    key,
    direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
  }));
}, []);

// Access check with enhanced error message
if (!user || !(user.role === 'Admin' || user.role === 'admin')) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-red-600">
          Access Denied
        </h2>
        <p className="mt-2 text-gray-600">
          You need administrator privileges to access this page.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Please contact your system administrator if you believe this is an error.
        </p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-gray-100 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Product Approval Dashboard
          </h1>
          <div className="mt-2 flex items-center space-x-2">
            <p className="text-sm text-gray-600">
              {filteredProducts.length} products pending review
            </p>
            {selectedProduct && (
              <span className="text-sm text-blue-600">
                • Reviewing #{selectedProduct._id.slice(-6)}
              </span>
            )}
          </div>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex-1 sm:w-64 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            )}
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <option key={status} value={status}>
                {config.label}
              </option>
            ))}
          </select>
          <select
            value={sortConfig.key}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Date Created</option>
            <option value="DesignTitle">Design Title</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Enhanced Product List */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">
                Pending Products
              </h2>
              {filteredProducts.length > 0 && (
                <div className="text-sm text-gray-500">
                  Showing {filteredProducts.length} of {pendingProducts?.length || 0}
                </div>
              )}
            </div>
            
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="font-medium">No products found</p>
                <p className="text-sm mt-1">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredProducts.map((product) => (
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
                    <div className="flex justify-between items-start">
                      <div className="flex-1 text-left">
                        <h3 className="font-medium text-gray-900 line-clamp-1">
                          {product.DesignTitle || 'Untitled Design'}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.mainTags?.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                              {tag}
                            </span>
                          ))}
                          {(product.mainTags?.length || 0) > 3 && (
                            <span className="text-xs text-gray-500">
                              +{product.mainTags.length - 3} more
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <p className="text-sm text-gray-500">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                          <span className="text-gray-300">•</span>
                          <p className="text-sm text-gray-500">
                            ID: #{product._id.slice(-6)}
                          </p>
                        </div>
                      </div>
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap
                        ${STATUS_CONFIG[product.status]?.color || 'bg-gray-100'} 
                        ${STATUS_CONFIG[product.status]?.textColor || 'text-gray-800'}
                      `}>
                        {STATUS_CONFIG[product.status]?.label || 'Unknown'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Area */}
        {selectedProduct && editedProduct ? (
          <div className="w-full lg:w-2/3 space-y-6">
            {/* Navigation Controls */}
            <div className="flex justify-between items-center">
              <button
                onClick={handlePreviousProduct}
                disabled={!filteredProducts.find((p, i) => p._id === selectedProduct._id && i > 0)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextProduct}
                disabled={!filteredProducts.find((p, i) => p._id === selectedProduct._id && i < filteredProducts.length - 1)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Next →
              </button>
            </div>

            {/* Design Preview */}
            <DesignPreview
              product={editedProduct}
              position={position}
              scale={scale}
              isDragging={isDragging}
              isOutOfBounds={isOutOfBounds}
              onDragStart={handleDragStart}
              onScaleChange={handleScaleChange}
              onPositionChange={handleDesignPositionUpdate}
              onCenter={centerDesign}
              showGridLines={showGridLines}
              onToggleGridLines={() => setShowGridLines(!showGridLines)}
              disabled={isSubmitting}
              bounds={bounds}
            />

            {/* Product Configuration */}
            <ProductConfig
              editedProduct={editedProduct}
              onUpdate={handleProductUpdate}
              onDesignPositionUpdate={handleDesignPositionUpdate}
              disabled={isSubmitting}
            />

            {/* Price Calculator */}
            <PriceCalculator
              productType={editedProduct.ProductType}
              originalPrice={editedProduct.originalPrice}
              discountPrice={editedProduct.discountPrice}
              onChange={({ originalPrice, discountPrice }) => 
                handleProductUpdate({ originalPrice, discountPrice })}
              disabled={isSubmitting}
            />

            {/* Validation System */}
            <ValidationSystem
              product={editedProduct}
              onValidationChange={setValidationStatus}
            />

            {/* Status Manager */}
            <StatusManager
              product={editedProduct}
              onStatusChange={handleStatusChange}
              onReasonChange={(reason) => handleProductUpdate({ rejectionReason: reason })}
              disabled={!validationStatus.isValid || isSubmitting}
            />
          </div>
        ) : (
          <div className="w-full lg:w-2/3 flex items-center justify-center bg-white rounded-xl shadow-lg p-8">
            <div className="text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No product selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Select a product from the list to review it
              </p>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Loading Overlay */}
    {isSubmitting && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent" />
          <p className="mt-4 text-gray-600">Processing...</p>
        </div>
      </div>
    )}
  </div>
);
};

export default AdminProductApproval;
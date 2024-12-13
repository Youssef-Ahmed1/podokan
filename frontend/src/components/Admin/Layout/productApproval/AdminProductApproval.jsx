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

// Import constants
import { STATUS_CONFIG, PRODUCT_TYPES } from '../ProductApproval/constants/productConfig';

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
    productType: editedProduct?.ProductType || 't-shirt',
    disabled: isSubmitting
  });

  // Load pending products
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Filter and search products
  const filteredProducts = useMemo(() => {
    if (!pendingProducts) return [];
    
    return pendingProducts.filter(product => {
      const matchesSearch = searchQuery === '' || 
        product.DesignTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.Description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.mainTags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        product.Designtags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        
      const matchesFilter = filterStatus === 'all' || product.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [pendingProducts, searchQuery, filterStatus]);

  // Handle product selection
  const handleProductSelect = useCallback((product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      DesignScale: product.DesignScale || 0.5,
      DesignPosition: product.DesignPosition || { x: 50, y: 30 },
      designImage: product.designImage?.url || product.designImage,
      originalPrice: product.originalPrice || PRODUCT_TYPES[product.ProductType].basePrice,
      mainTags: product.mainTags || [],
      Designtags: product.Designtags || []
    });

    // Reset design position and scale
    resetDesignPosition();
  }, [resetDesignPosition]);

  // Handle product updates
  const handleProductUpdate = useCallback((updates) => {
    setEditedProduct(prev => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // If product type changes, reset design position
      if (updates.ProductType && updates.ProductType !== prev.ProductType) {
        resetDesignPosition();
      }

      return updated;
    });
  }, [resetDesignPosition]);

  // Handle design position updates
  const handleDesignPositionUpdate = useCallback((newPosition, newScale) => {
    updatePosition(newPosition);
    handleScaleChange(newScale);
    
    handleProductUpdate({
      DesignPosition: newPosition,
      DesignScale: newScale
    });
  }, [updatePosition, handleScaleChange, handleProductUpdate]);

  // Handle status change
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
    } finally {
      setIsSubmitting(false);
    }
  }, [editedProduct, dispatch, scale, position]);

  // Access check
  if (!user || !(user.role === 'Admin' || user.role === 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-600">
            You need administrator privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Product Approval Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {filteredProducts.length} products pending review
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex space-x-4 w-full sm:w-auto">
            <div className="flex-1 sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
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
          </div>
        </div>

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
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No products found matching your criteria
                </div>
              ) : (
                <div className="p-4 space-y-2">
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
                      <div className="flex justify-between items-center">
                        <div className="flex-1 text-left">
                          <h3 className="font-medium text-gray-900">
                            {product.DesignTitle || 'Untitled Design'}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {product.mainTags?.map(tag => (
                              <span key={tag} className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`
                          px-3 py-1 rounded-full text-xs font-medium
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
              {/* Design Preview with Updated Position Management */}
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
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


const ProductList = ({ products, onSelect, selectedProduct }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          Pending Products
        </h2>
        {products.length > 0 && (
          <div className="text-sm text-gray-500">
            {products.length} products pending
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
        {products.map((product) => (
          <button
            key={product._id}
            onClick={() => onSelect(product)}
            className={`
              w-full p-4 rounded-lg transition-all duration-200
              ${selectedProduct?._id === product._id 
                ? 'bg-blue-50 border-2 border-blue-500' 
                : 'hover:bg-gray-50 border border-gray-200'}
            `}
          >
            <div className="flex items-start space-x-4">
              {product.designImage && (
                <img
                  src={product.designImage.url || product.designImage}
                  alt={product.DesignTitle}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 line-clamp-1">
                  {product.DesignTitle || 'Untitled Design'}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                  {product.Description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {product.Maintag && (
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                      {product.Maintag}
                    </span>
                  )}
                  {product.Designtags?.slice(0, 2).map(tag => (
                    <span key={tag} className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-sm text-gray-500">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500">
                    ID: #{product._id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
// Main tag categories constant
const MAIN_TAG_CATEGORIES = [
  'anime',
  'funny',
  'sports',
  'music',
  'television',
  'sci-fi',
  'hoodie'
];

// TagManager Component
const TagManager = ({ mainTags = [], designTags = [], onMainTagsUpdate, onDesignTagsUpdate, disabled }) => {
  const [newMainTag, setNewMainTag] = useState('');
  const [newDesignTag, setNewDesignTag] = useState('');
  const [showMainTagMenu, setShowMainTagMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Tag Management</h2>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Main Tags Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Main Tags</h3>
            <button
              onClick={() => setShowMainTagMenu(!showMainTagMenu)}
              disabled={disabled}
              className={`
                text-sm font-medium transition-colors
                ${disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-blue-600 hover:text-blue-800'}
              `}
            >
              {showMainTagMenu ? 'Hide Categories' : 'Show Categories'}
            </button>
          </div>

          {showMainTagMenu && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex flex-wrap gap-2">
                {MAIN_TAG_CATEGORIES.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (!mainTags.includes(tag)) {
                        onMainTagsUpdate([...mainTags, tag]);
                      }
                    }}
                    disabled={disabled || mainTags.includes(tag)}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                      ${disabled 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : mainTags.includes(tag)
                          ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                          : 'bg-white border border-blue-200 text-blue-600 hover:bg-blue-50'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {mainTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => onMainTagsUpdate(mainTags.filter((_, i) => i !== index))}
                    disabled={disabled}
                    className={`
                      ml-2 transition-colors
                      ${disabled 
                        ? 'text-blue-300 cursor-not-allowed' 
                        : 'text-blue-600 hover:text-blue-800'}
                    `}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newMainTag}
                onChange={(e) => setNewMainTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newMainTag.trim() && !disabled) {
                    onMainTagsUpdate([...mainTags, newMainTag.trim()]);
                    setNewMainTag('');
                  }
                }}
                disabled={disabled}
                placeholder="Add custom main tag..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <button
                onClick={() => {
                  if (newMainTag.trim() && !disabled) {
                    onMainTagsUpdate([...mainTags, newMainTag.trim()]);
                    setNewMainTag('');
                  }
                }}
                disabled={disabled || !newMainTag.trim()}
                className={`
                  px-4 py-2 rounded-lg transition-colors
                  ${disabled || !newMainTag.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}
                `}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Design Tags Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Design Tags</h3>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {designTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                >
                  {tag}
                  <button
                    onClick={() => onDesignTagsUpdate(designTags.filter((_, i) => i !== index))}
                    disabled={disabled}
                    className={`
                      ml-2 transition-colors
                      ${disabled 
                        ? 'text-gray-300 cursor-not-allowed' 
                        : 'text-gray-600 hover:text-gray-800'}
                    `}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={newDesignTag}
                onChange={(e) => setNewDesignTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newDesignTag.trim() && !disabled) {
                    onDesignTagsUpdate([...designTags, newDesignTag.trim()]);
                    setNewDesignTag('');
                  }
                }}
                disabled={disabled}
                placeholder="Add design tag..."
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <button
                onClick={() => {
                  if (newDesignTag.trim() && !disabled) {
                    onDesignTagsUpdate([...designTags, newDesignTag.trim()]);
                    setNewDesignTag('');
                  }
                }}
                disabled={disabled || !newDesignTag.trim()}
                className={`
                  px-4 py-2 rounded-lg transition-colors
                  ${disabled || !newDesignTag.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'}
                `}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.user);
  const { isLoading, pendingProducts } = useSelector((state) => state.product);

  // Enhanced State Management
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showGridLines, setShowGridLines] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Design Position Management
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

  // Tag Management Handlers
  const handleMainTagsUpdate = useCallback((tags) => {
    handleProductUpdate({
      mainTags: tags
    });
  }, []);

  const handleDesignTagsUpdate = useCallback((tags) => {
    handleProductUpdate({
      Designtags: tags
    });
  }, []);

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
    if (!product || typeof product !== 'object') return;
  
    try {
      setSelectedProduct(product);
      setEditedProduct({
        ...product,
        DesignScale: product.DesignScale || 0.5,
        DesignPosition: product.DesignPosition || { x: 50, y: 30 },
        designImage: product.designImage?.url || product.designImage || '',
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

  // Enhanced status change handling
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

  // Sort handler
  const handleSort = useCallback((key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Access check
  if (!user || !(user.role === 'Admin' || user.role === 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600">Access Denied</h2>
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Approval Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              {filteredProducts.length} products pending review
            </p>
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">All Status</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Product List */}
          <div className="w-full lg:w-1/3">
  <ProductList
    products={filteredProducts}
    onSelect={handleProductSelect}
    selectedProduct={selectedProduct}
  />
</div>

          {/* Product Review Area */}
          {selectedProduct && editedProduct ? (
            <div className="w-full lg:w-2/3 space-y-6">
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

              <ProductConfig
                editedProduct={editedProduct}
                onUpdate={handleProductUpdate}
                disabled={isSubmitting}
              />

              {/* New Tag Manager Component */}
              <TagManager
                mainTags={editedProduct.mainTags || []}
                designTags={editedProduct.Designtags || []}
                onMainTagsUpdate={handleMainTagsUpdate}
                onDesignTagsUpdate={handleDesignTagsUpdate}
                disabled={isSubmitting}
              />

              <PriceCalculator
                productType={editedProduct.ProductType}
                originalPrice={editedProduct.originalPrice}
                discountPrice={editedProduct.discountPrice}
                onChange={handleProductUpdate}
                disabled={isSubmitting}
              />

              <ValidationSystem
                product={editedProduct}
                onValidationChange={setValidationStatus}
              />

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
                <p className="text-xl font-medium">Select a product to review</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
            <p className="mt-4 text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductApproval;
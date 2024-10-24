import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "@material-ui/data-grid";
import { toast } from "react-toastify";
import {
  AiOutlineEye,
  AiOutlineCheck,
  AiOutlineClose,
  AiFillTag,
  AiOutlineShoppingCart,
  AiOutlineZoomIn,
  AiOutlineZoomOut,
} from "react-icons/ai";
import { fetchPendingProducts, approveRejectProduct } from "../../../redux/actions/product";

// Constants and Types
const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' },
  red: { value: 'red', label: 'Red', hex: '#ff0000', textColor: 'text-white' },
  blue: { value: 'blue', label: 'Blue', hex: '#0000ff', textColor: 'text-white' },
  gray: { value: 'gray', label: 'Gray', hex: '#808080', textColor: 'text-white' }
};

const STATUS_BADGES = {
  pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
  public: { color: 'bg-green-100 text-green-800', label: 'Public' },
  restricted: { color: 'bg-gray-100 text-gray-800', label: 'Restricted' },
  rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
};

const PRODUCT_TYPES = {
  't-shirt': {
    label: 'T-Shirt',
    mockupConfig: {
      version: "v1728393898",
      folder: "t-shirts",
      getFilename: (color, view) => `t-shirt-${color}-${view}`
    }
  },
  'hoodie': {
    label: 'Hoodie',
    mockupConfig: {
      version: "v1728392918",
      folder: "hoodies",
      getFilename: (color, view) => `hoodie-${color}-${view}`
    }
  },
  'long-sleeve': {
    label: 'Long Sleeve',
    mockupConfig: {
      version: "v1728394665",
      folder: "long-sleeves",
      getFilename: (color, view) => {
        if (color === "gray") return `longsleeves-${color}-${view}`;
        if (["white", "black"].includes(color)) return `longseleves-${color}-${view}`;
        return `t-shirt-${color}-${view}`;
      }
    }
  }
};

// Utility Functions
const getMockupUrl = (productType, color, view) => {
  const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
  const config = PRODUCT_TYPES[productType]?.mockupConfig;
  
  if (!config) return "";
  
  const filename = config.getFilename(color, view);
  return `${baseUrl}${config.version}/${config.folder}/${filename}.png`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(price);
};

// Helper Components
const ProductPreview = ({ product, selectedColor, currentView }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const mockupUrl = getMockupUrl(
    product?.ProductType || 't-shirt',
    selectedColor || 'white',
    currentView || 'front'
  );

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  return (
    <div className="relative aspect-w-1 aspect-h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Mockup Image */}
      <img
        src={mockupUrl}
        alt={product?.DesignTitle || 'Product Mockup'}
        className="w-full h-full object-contain transition-opacity duration-300"
        style={{ opacity: isLoading ? 0 : 1 }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Design Overlay */}
      {!isLoading && !imageError && product?.designImage?.url && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            transform: `translate(-50%, -50%) scale(${product?.DesignScale || 1})`,
            width: '200px',
            height: '200px'
          }}
        >
          <img
            src={product.designImage.url}
            alt="Design"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Error State */}
      {imageError && (
        <div className="absolute inset-0 flex items-center justify-center text-red-500">
          Failed to load mockup
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const badgeInfo = STATUS_BADGES[status] || STATUS_BADGES.pending;
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeInfo.color}`}>
      {badgeInfo.label}
    </span>
  );
};

const PriceInput = ({ value, onChange, label, error, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative rounded-md shadow-sm">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="text-gray-500 sm:text-sm">£</span>
      </div>
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          block w-full pl-7 pr-12 py-2 sm:text-sm rounded-md
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
          ${error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
        `}
        placeholder="0.00"
      />
    </div>
    {error && (
      <p className="mt-1 text-sm text-red-600">{error}</p>
    )}
  </div>
);
const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { pendingProducts, isLoading } = useSelector((state) => state.products);
  
  // State Management
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [currentView, setCurrentView] = useState('front');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Validation Functions
  const validateProduct = (product) => {
    const errors = {};
    
    // Basic validation
    if (!product.DesignTitle?.trim()) {
      errors.DesignTitle = "Design title is required";
    }
    
    // Price validation
    if (!product.originalPrice || product.originalPrice <= 0) {
      errors.originalPrice = "Original price must be greater than 0";
    }
    
    if (product.discountPrice) {
      if (product.discountPrice >= product.originalPrice) {
        errors.discountPrice = "Discount price must be less than original price";
      }
      if (product.discountPrice < 0) {
        errors.discountPrice = "Discount price cannot be negative";
      }
    }
    
    // Color validation
    if (!product.availableColors?.length) {
      errors.availableColors = "At least one color must be selected";
    }
    
    // Design scale validation
    if (product.DesignScale < 0.1 || product.DesignScale > 5.0) {
      errors.DesignScale = "Design scale must be between 0.1 and 5.0";
    }

    return errors;
  };

  // Handlers
  const handleEdit = useCallback((product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      DesignTitle: product.DesignTitle || '',
      Maintag: product.Maintag || '',
      Designtags: Array.isArray(product.Designtags) ? product.Designtags : [],
      Description: product.Description || '',
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || 0,
      DesignScale: product.DesignScale || 1,
      availableColors: product.availableColors || ['white'],
      ProductColor: product.ProductColor || 'white',
      ProductType: product.ProductType || 't-shirt',
      ProductView: product.ProductView || 'front'
    });
    setCurrentView('front');
    setValidationErrors({});
  }, []);

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      const errors = validateProduct(editedProduct);
      
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fix all validation errors before approving");
        return;
      }

      const response = await dispatch(approveRejectProduct(
        selectedProduct._id,
        'public',
        '',
        {
          DesignTitle: editedProduct.DesignTitle,
          Description: editedProduct.Description,
          Maintag: editedProduct.Maintag,
          Designtags: editedProduct.Designtags,
          originalPrice: editedProduct.originalPrice,
          discountPrice: editedProduct.discountPrice,
          DesignScale: editedProduct.DesignScale,
          availableColors: editedProduct.availableColors,
          ProductColor: editedProduct.ProductColor,
          ProductType: editedProduct.ProductType,
          status: 'public'
        }
      ));

      if (response?.success) {
        toast.success("Product approved successfully!");
        dispatch(fetchPendingProducts());
        setSelectedProduct(null);
        setEditedProduct(null);
      } else {
        toast.error(response?.message || "Failed to approve product");
      }
    } catch (error) {
      console.error("Approval error:", error);
      toast.error(error.message || "Failed to approve product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsSubmitting(true);
      
      if (!rejectionReason.trim()) {
        toast.error("Please provide a rejection reason");
        return;
      }

      const response = await dispatch(approveRejectProduct(
        selectedProduct._id,
        'rejected',
        rejectionReason.trim(),
        {
          status: 'rejected',
          rejectionReason: rejectionReason.trim()
        }
      ));

      if (response?.success) {
        toast.success("Product rejected successfully");
        dispatch(fetchPendingProducts());
        setSelectedProduct(null);
        setEditedProduct(null);
        setShowRejectionDialog(false);
        setRejectionReason("");
      } else {
        toast.error(response?.message || "Failed to reject product");
      }
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error(error.message || "Failed to reject product");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DataGrid Columns Configuration
  const columns = [
    {
      field: "id",
      headerName: "Product ID",
      minWidth: 150,
      flex: 0.7,
      renderCell: (params) => (
        <div className="font-mono text-sm">{params.value}</div>
      ),
    },
    {
      field: "designTitle",
      headerName: "Design Title",
      minWidth: 180,
      flex: 1.4,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={params.row.designImage?.url}
              alt={params.row.designTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.png'; // Add a placeholder image
              }}
            />
          </div>
          <span className="font-medium truncate">{params.value}</span>
        </div>
      ),
    },
    {
      field: "productType",
      headerName: "Type",
      minWidth: 100,
      flex: 0.6,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <AiOutlineShoppingCart className="text-gray-500" />
          <span className="capitalize">
            {PRODUCT_TYPES[params.value]?.label || params.value}
          </span>
        </div>
      ),
    },
    {
      field: "mainTag",
      headerName: "Main Tag",
      minWidth: 140,
      flex: 0.8,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <AiFillTag className="text-blue-500" />
          <span className="truncate">{params.value}</span>
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => <StatusBadge status={params.value} />,
    },
    {
      field: "actions",
      headerName: "Actions",
      minWidth: 150,
      flex: 0.8,
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleEdit(params.row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
            title="Review Design"
          >
            <AiOutlineEye size={20} />
          </button>
        </div>
      ),
    },
  ];

  // Transform data for DataGrid
  const rows = pendingProducts?.map((product) => ({
    id: product._id,
    designTitle: product.DesignTitle,
    mainTag: product.Maintag,
    productType: product.ProductType,
    status: product.status,
    designImage: product.designImage,
    ...product,
  })) || [];
  
return (
  <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto">
      {/* Main Dashboard Card */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-900">
            Product Approval Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage pending product submissions
          </p>
        </div>

        {/* DataGrid Container */}
        <div className="p-6">
          <DataGrid
            rows={rows}
            columns={columns}
            pageSize={10}
            autoHeight
            disableSelectionOnClick
            loading={isLoading}
            components={{
              NoRowsOverlay: () => (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-500 mb-2">No pending products</p>
                  <p className="text-sm text-gray-400">
                    New submissions will appear here
                  </p>
                </div>
              ),
              LoadingOverlay: () => (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading products...</p>
                </div>
              ),
            }}
            className="border-0"
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9fafb',
              },
            }}
          />
        </div>
      </div>

      {/* Review Modal */}
      {selectedProduct && editedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center z-10">
              <h2 className="text-lg font-semibold text-gray-900">
                Review Product Design
              </h2>
              <button
                onClick={() => {
                  if (isSubmitting) return;
                  setSelectedProduct(null);
                  setEditedProduct(null);
                }}
                className={`text-gray-400 hover:text-gray-500 transition-colors ${
                  isSubmitting ? 'cursor-not-allowed opacity-50' : ''
                }`}
                disabled={isSubmitting}
              >
                <span className="sr-only">Close</span>
                <AiOutlineClose size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Preview */}
                <div className="space-y-6">
                  <ProductPreview
                    product={editedProduct}
                    selectedColor={editedProduct.ProductColor}
                    currentView={currentView}
                  />

                  {/* View Toggle */}
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => setCurrentView('front')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentView === 'front'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isSubmitting}
                    >
                      Front View
                    </button>
                    <button
                      onClick={() => setCurrentView('back')}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        currentView === 'back'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isSubmitting}
                    >
                      Back View
                    </button>
                  </div>

                  {/* Color Selection */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium text-gray-900">Available Colors</h3>
                      {validationErrors.availableColors && (
                        <span className="text-sm text-red-500">
                          {validationErrors.availableColors}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {Object.entries(COLOR_OPTIONS).map(([key, color]) => (
                        <button
                          key={key}
                          onClick={() => setEditedProduct(prev => ({
                            ...prev,
                            ProductColor: key
                          }))}
                          disabled={isSubmitting}
                          className={`
                            p-3 rounded-lg border-2 transition-all duration-200
                            ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                            ${editedProduct.ProductColor === key
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'}
                          `}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: color.hex }}
                            />
                            <span className={color.textColor}>
                              {color.label}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Design Scale Control */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="block text-sm font-medium text-gray-700">
                        Design Scale: {editedProduct.DesignScale.toFixed(1)}x
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditedProduct(prev => ({
                            ...prev,
                            DesignScale: Math.max(0.1, prev.DesignScale - 0.1)
                          }))}
                          disabled={isSubmitting || editedProduct.DesignScale <= 0.1}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <AiOutlineZoomOut />
                        </button>
                        <button
                          onClick={() => setEditedProduct(prev => ({
                            ...prev,
                            DesignScale: Math.min(5.0, prev.DesignScale + 0.1)
                          }))}
                          disabled={isSubmitting || editedProduct.DesignScale >= 5.0}
                          className="p-1 rounded hover:bg-gray-100"
                        >
                          <AiOutlineZoomIn />
                        </button>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="5.0"
                      step="0.1"
                      value={editedProduct.DesignScale}
                      onChange={(e) => setEditedProduct(prev => ({
                        ...prev,
                        DesignScale: parseFloat(e.target.value)
                      }))}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Right Column - Details */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Design Title
                        {validationErrors.DesignTitle && (
                          <span className="text-red-500 ml-2">
                            {validationErrors.DesignTitle}
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={editedProduct.DesignTitle}
                        onChange={(e) => setEditedProduct(prev => ({
                          ...prev,
                          DesignTitle: e.target.value
                        }))}
                        disabled={isSubmitting}
                        className={`
                          block w-full px-4 py-2 border rounded-lg 
                          ${validationErrors.DesignTitle 
                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
                          ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
                        `}
                        placeholder="Design Title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editedProduct.Description}
                        onChange={(e) => setEditedProduct(prev => ({
                          ...prev,
                          Description: e.target.value
                        }))}
                        disabled={isSubmitting}
                        rows={4}
                        className={`
                          block w-full px-4 py-2 border border-gray-300 rounded-lg
                          focus:ring-blue-500 focus:border-blue-500
                          ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
                        `}
                        placeholder="Product description"
                      />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Pricing</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <PriceInput
                        label="Original Price"
                        value={editedProduct.originalPrice}
                        onChange={(e) => setEditedProduct(prev => ({
                          ...prev,
                          originalPrice: parseFloat(e.target.value)
                        }))}
                        error={validationErrors.originalPrice}
                        disabled={isSubmitting}
                      />
                      <PriceInput
                        label="Discount Price (Optional)"
                        value={editedProduct.discountPrice}
                        onChange={(e) => setEditedProduct(prev => ({
                          ...prev,
                          discountPrice: parseFloat(e.target.value)
                        }))}
                        error={validationErrors.discountPrice}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-6">
                    <button
                      onClick={() => {
                        const errors = validateProduct(editedProduct);
                        if (Object.keys(errors).length === 0) {
                          handleApprove();
                        } else {
                          setValidationErrors(errors);
                          toast.error("Please fix validation errors");
                        }
                      }}
                      disabled={isSubmitting}
                      className={`
                        flex-1 bg-green-600 text-white py-3 px-4 rounded-lg
                        hover:bg-green-700 transition-colors
                        flex items-center justify-center gap-2
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                          <span>Processing...</span>
                        </>
                      ) : (
                        <>
                          <AiOutlineCheck size={20} />
                          <span>Approve</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowRejectionDialog(true)}
                      disabled={isSubmitting}
                      className={`
                        flex-1 bg-red-600 text-white py-3 px-4 rounded-lg
                        hover:bg-red-700 transition-colors
                        flex items-center justify-center gap-2
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <AiOutlineClose size={20} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Dialog */}
      {showRejectionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Product
            </h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a detailed reason for rejection..."
              rows={4}
              disabled={isSubmitting}
              className={`
                w-full px-4 py-2 border border-gray-300 rounded-lg
                focus:ring-red-500 focus:border-red-500
                ${isSubmitting ? 'bg-gray-100 cursor-not-allowed' : ''}
              `}
            />
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleReject}
                disabled={isSubmitting || !rejectionReason.trim()}
                className={`
                  flex-1 bg-red-600 text-white py-2 px-4 rounded-lg
                  hover:bg-red-700 transition-colors
                  ${(isSubmitting || !rejectionReason.trim()) ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  'Confirm Rejection'
                )}
              </button>
              <button
                onClick={() => {
                  if (isSubmitting) return;
                  setShowRejectionDialog(false);
                  setRejectionReason("");
                }}
                disabled={isSubmitting}
                className={`
                  flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg
                  hover:bg-gray-200 transition-colors
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default AdminProductApproval;

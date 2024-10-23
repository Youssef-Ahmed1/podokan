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
} from "react-icons/ai";
import { fetchPendingProducts, approveRejectProduct } from "../../../redux/actions/product";

// Constants
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

// Product Preview Component
const ProductPreview = ({ product, selectedColor, currentView }) => {
  const [isLoading, setIsLoading] = useState(true);

  const getMockupUrl = useCallback(() => {
    if (!product) return '';
    
    const baseUrl = "https://res.cloudinary.com/dkot9tyjm/image/upload/";
    const config = {
      hoodie: {
        version: "v1728392918",
        folder: "hoodies",
        filename: `hoodie-${selectedColor}-${currentView}`
      },
      "t-shirt": {
        version: "v1728393898",
        folder: "t-shirts",
        filename: `t-shirt-${selectedColor}-${currentView}`
      },
      "long-sleeve": {
        version: "v1728394665",
        folder: "long-sleeves",
        filename: selectedColor === "gray" 
          ? `longsleeves-${selectedColor}-${currentView}`
          : ["white", "black"].includes(selectedColor)
            ? `longseleves-${selectedColor}-${currentView}`
            : `t-shirt-${selectedColor}-${currentView}`
      }
    };

    const productConfig = config[product.ProductType];
    return productConfig 
      ? `${baseUrl}${productConfig.version}/${productConfig.folder}/${productConfig.filename}.png`
      : "";
  }, [product, selectedColor, currentView]);

  return (
    <div className="relative aspect-w-1 aspect-h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
      {/* Mockup Image */}
      <img
        src={getMockupUrl()}
        alt={product?.DesignTitle || 'Product Mockup'}
        className="w-full h-full object-contain"
        onLoad={() => setIsLoading(false)}
        style={{ opacity: isLoading ? 0 : 1 }}
      />

      {/* Design Overlay */}
      {!isLoading && (
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{ 
            transform: `translate(-50%, -50%) scale(${product?.DesignScale || 1})`,
            width: '200px',
            height: '200px'
          }}
        >
          <img
            src={product?.designImage?.url || ''}
            alt="Design"
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      )}
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const badgeInfo = STATUS_BADGES[status] || STATUS_BADGES.pending;
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${badgeInfo.color}`}>
      {badgeInfo.label}
    </span>
  );
};

// Price Input Component
const PriceInput = ({ value, onChange, label, error }) => (
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
        value={value}
        onChange={onChange}
        className={`
          block w-full pl-7 pr-12 py-2 sm:text-sm rounded-md
          ${error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}
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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [currentView, setCurrentView] = useState('front');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Validation function
  const validateProduct = (product) => {
    const errors = {};
    if (!product.DesignTitle?.trim()) {
      errors.DesignTitle = "Design title is required";
    }
    if (!product.originalPrice || product.originalPrice <= 0) {
      errors.originalPrice = "Valid original price is required";
    }
    if (product.discountPrice && product.discountPrice >= product.originalPrice) {
      errors.discountPrice = "Discount price must be less than original price";
    }
    if (!product.availableColors?.length) {
      errors.availableColors = "At least one color must be selected";
    }
    return errors;
  };

  const handleEdit = (product) => {
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
  };

  const columns = [
    {
      field: "id",
      headerName: "Product ID",
      minWidth: 150,
      flex: 0.7,
    },
    {
      field: "designTitle",
      headerName: "Design Title",
      minWidth: 180,
      flex: 1.4,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <img
            src={params.row.designImage?.url}
            alt={params.row.designTitle}
            className="w-10 h-10 rounded object-cover"
          />
          <span>{params.row.designTitle}</span>
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
          <span className="capitalize">{params.row.productType}</span>
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
          <span>{params.row.mainTag}</span>
        </div>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => <StatusBadge status={params.row.status} />,
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

          {/* Main Content */}
          <div className="divide-y divide-gray-200">
            {/* DataGrid */}
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
                    <div className="flex items-center justify-center h-64">
                      <p className="text-gray-500">No pending products</p>
                    </div>
                  ),
                  LoadingOverlay: () => (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    </div>
                  ),
                }}
              />
            </div>
          </div>
        </div>

        {/* Review Modal */}
        {selectedProduct && editedProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Review Product Design</h2>
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setEditedProduct(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <AiOutlineClose size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Preview */}
                  <div className="space-y-6">
                    <ProductPreview
                      product={editedProduct}
                      selectedColor={editedProduct.ProductColor}
                      currentView={currentView}
                    />

                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => setCurrentView('front')}
                        className={`px-4 py-2 rounded-lg ${
                          currentView === 'front'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Front View
                      </button>
                      <button
                        onClick={() => setCurrentView('back')}
                        className={`px-4 py-2 rounded-lg ${
                          currentView === 'back'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Back View
                      </button>
                    </div>

                    {/* Color Selection */}
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Available Colors</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(COLOR_OPTIONS).map(([key, color]) => (
                          <button
                            key={key}
                            onClick={() => setEditedProduct(prev => ({
                              ...prev,
                              ProductColor: key
                            }))}
                            className={`
                              p-3 rounded-lg border-2 transition-all duration-200
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
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={editedProduct.DesignTitle}
                        onChange={(e) => setEditedProduct(prev => ({
                          ...prev,
                          DesignTitle: e.target.value
                        }))}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Design Title"
                      />
                      
                      <textarea
                        value={editedProduct.Description}
                        onChange={(e) => setEditedProduct(prev => ({
                          ...prev,
                          Description: e.target.value
                        }))}
                        rows={4}
                        className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Description"
                      />
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
                        />
                        <PriceInput
                          label="Discount Price"
                          value={editedProduct.discountPrice}
                          onChange={(e) => setEditedProduct(prev => ({
                            ...prev,
                            discountPrice: parseFloat(e.target.value)
                          }))}
                          error={validationErrors.discountPrice}
                        />
                      </div>
                    </div>

                    {/* Design Scale */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Design Scale: {editedProduct.DesignScale}x
                      </label>
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
                        className="w-full"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-6">
                      <button
                        onClick={() => {
                          const errors = validateProduct(editedProduct);
                          if (Object.keys(errors).length === 0) {
                            // Handle approve
                            handleApprove();
                          } else {
                            setValidationErrors(errors);
                            toast.error("Please fix validation errors");
                          }
                        }}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <AiOutlineCheck size={20} />
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectionDialog(true)}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <AiOutlineClose size={20} />
                        Reject
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              />
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowRejectionDialog(false);
                    setRejectionReason("");
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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
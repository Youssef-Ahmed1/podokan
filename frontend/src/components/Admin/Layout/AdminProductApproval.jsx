import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { fetchPendingProducts, approveRejectProduct } from "../../redux/actions/product";
import { createTheme, ThemeProvider } from '@material-ui/core/styles';

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

const PRODUCT_TYPES = {
  't-shirt': { label: 'T-Shirt' },
  'hoodie': { label: 'Hoodie' },
  'long-sleeve': { label: 'Long Sleeve' }
};

// DataGrid theme
const dataGridTheme = createTheme({
  overrides: {
    MuiDataGrid: {
      root: {
        border: 'none',
        backgroundColor: 'white',
        '& .MuiDataGrid-columnsContainer': {
          backgroundColor: '#f9fafb',
          borderBottom: '1px solid #e5e7eb',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #e5e7eb',
        },
        '& .MuiDataGrid-row': {
          '&:hover': {
            backgroundColor: '#f9fafb',
          },
        },
      },
    },
  },
});

// Validation hook
const useProductValidation = () => {
  return useCallback((product) => {
    const errors = {};
    
    if (!product.DesignTitle?.trim()) {
      errors.DesignTitle = "Design title is required";
    }
    
    if (!product.originalPrice || product.originalPrice <= 0) {
      errors.originalPrice = "Original price must be greater than 0";
    }
    
    if (product.discountPrice && product.discountPrice >= product.originalPrice) {
      errors.discountPrice = "Discount price must be less than original price";
    }
    
    if (!product.availableColors?.length) {
      errors.availableColors = "At least one color must be selected";
    }

    if (!product.Description?.trim()) {
      errors.Description = "Description is required";
    }

    if (!product.Maintag?.trim()) {
      errors.Maintag = "Main tag is required";
    }

    return errors;
  }, []);
};

// Product Actions Hook
const useProductActions = () => {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const validateProduct = useProductValidation();

  const handleApproval = useCallback(async (product, status, updates = {}, rejectionReason = '') => {
    try {
      setIsSubmitting(true);

      if (status === 'public') {
        const errors = validateProduct({ ...product, ...updates });
        if (Object.keys(errors).length > 0) {
          toast.error("Please fix all validation errors before approving");
          return { success: false, errors };
        }
      }

      const result = await dispatch(
        approveRejectProduct(product._id, status, rejectionReason, updates)
      );

      if (result.success) {
        await dispatch(fetchPendingProducts());
        return { success: true };
      }

      throw new Error(result.message);
    } catch (error) {
      console.error(`${status} error:`, error);
      toast.error(error.message);
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, validateProduct]);

  return {
    isSubmitting,
    handleApproval
  };
};

// Preview Component
const ProductPreview = ({ product, selectedColor, currentView }) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => setIsLoading(false);

  return (
    <div className="relative aspect-w-1 aspect-h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      )}
      
      <img
        src={product?.designImage}
        alt={product?.DesignTitle}
        className={`w-full h-full object-contain transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleImageLoad}
      />
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
};// Main Component
const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { pendingProducts, isLoading } = useSelector((state) => state.products);
  
  // Local State
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [currentView, setCurrentView] = useState('front');
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Custom Hooks
  const { isSubmitting, handleApproval } = useProductActions();
  const validateProduct = useProductValidation();

  // Initial Data Fetch
  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  // Handlers
  const handleEdit = useCallback((product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || 0,
      DesignScale: product.DesignScale || 1,
      availableColors: product.availableColors || ['white'],
      ProductColor: product.ProductColor || 'white'
    });
    setCurrentView('front');
    setValidationErrors({});
  }, []);

  const handleApprove = async () => {
    if (!editedProduct) return;

    const updates = {
      DesignTitle: editedProduct.DesignTitle,
      Description: editedProduct.Description,
      Maintag: editedProduct.Maintag,
      Designtags: editedProduct.Designtags,
      originalPrice: parseFloat(editedProduct.originalPrice),
      discountPrice: editedProduct.discountPrice ? parseFloat(editedProduct.discountPrice) : 0,
      DesignScale: editedProduct.DesignScale,
      availableColors: editedProduct.availableColors,
      ProductType: editedProduct.ProductType,
      ProductColor: editedProduct.ProductColor
    };

    const result = await handleApproval(selectedProduct, 'public', updates);
    
    if (result.success) {
      setSelectedProduct(null);
      setEditedProduct(null);
    } else if (result.errors) {
      setValidationErrors(result.errors);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    const result = await handleApproval(selectedProduct, 'rejected', {}, rejectionReason.trim());
    
    if (result.success) {
      setSelectedProduct(null);
      setEditedProduct(null);
      setShowRejectionDialog(false);
      setRejectionReason("");
    }
  };

  // DataGrid Columns Configuration
  const columns = useMemo(() => [
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
      field: "DesignTitle",
      headerName: "Design Title",
      minWidth: 180,
      flex: 1.4,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100">
            <img
              src={params.row.designImage}
              alt={params.value}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/placeholder-image.png';
              }}
            />
          </div>
          <span className="font-medium truncate">{params.value}</span>
        </div>
      ),
    },
    {
      field: "ProductType",
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
      field: "Maintag",
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
      minWidth: 100,
      flex: 0.5,
      sortable: false,
      renderCell: (params) => (
        <button
          onClick={() => handleEdit(params.row)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
          title="Review Design"
        >
          <AiOutlineEye size={20} />
        </button>
      ),
    },
  ], [handleEdit]);

  // Transform data for DataGrid
  const rows = useMemo(() => 
    pendingProducts?.map((product) => ({
      id: product._id,
      ...product
    })) || [], 
  [pendingProducts]);

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

          {/* DataGrid */}
          <div className="p-6">
            <div className="h-[600px] w-full">
              <ThemeProvider theme={dataGridTheme}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  loading={isLoading}
                  components={{
                    NoRowsOverlay: () => (
                      <div className="flex flex-col items-center justify-center h-full">
                        <p className="text-gray-500">No pending products</p>
                      </div>
                    ),
                    LoadingOverlay: () => (
                      <div className="flex flex-col items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
                      </div>
                    ),
                  }}
                  sx={{
                    border: 0,
                    '& .MuiDataGrid-cell:focus': { outline: 'none' },
                    '& .MuiDataGrid-columnHeader:focus': { outline: 'none' }
                  }}
                />
              </ThemeProvider>
            </div>
          </div>
        </div>

        {/* Product Review Modal */}
        {selectedProduct && editedProduct && (
          <ProductReviewModal
            product={selectedProduct}
            editedProduct={editedProduct}
            setEditedProduct={setEditedProduct}
            currentView={currentView}
            setCurrentView={setCurrentView}
            validationErrors={validationErrors}
            isSubmitting={isSubmitting}
            onApprove={handleApprove}
            onReject={() => setShowRejectionDialog(true)}
            onClose={() => {
              setSelectedProduct(null);
              setEditedProduct(null);
            }}
          />
        )}

        {/* Rejection Dialog */}
        {showRejectionDialog && (
          <RejectionDialog
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            onConfirm={handleReject}
            onCancel={() => {
              setShowRejectionDialog(false);
              setRejectionReason("");
            }}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
};

export default AdminProductApproval;
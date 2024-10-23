import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import axios from "axios";
import { fetchPendingProducts, approveRejectProduct } from "../../../redux/actions/product";
import { toast } from "react-toastify";
import { AiOutlineDelete } from "react-icons/ai";
import styles from "../../../styles/styles";
import { server } from "../../../server"
import { DataGrid } from "@material-ui/data-grid";
import { Button } from "@material-ui/core";

const COLOR_OPTIONS = {
  white: { value: 'white', label: 'White', hex: '#ffffff', textColor: 'text-gray-800' },
  black: { value: 'black', label: 'Black', hex: '#000000', textColor: 'text-white' },
  red: { value: 'red', label: 'Red', hex: '#ff0000', textColor: 'text-white' },
  blue: { value: 'blue', label: 'Blue', hex: '#0000ff', textColor: 'text-white' },
  gray: { value: 'gray', label: 'Gray', hex: '#808080', textColor: 'text-white' }
};

const AdminProductApproval = () => {
  const dispatch = useDispatch();
  const { pendingProducts, isLoading } = useSelector((state) => state.products);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editedProduct, setEditedProduct] = useState(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    dispatch(fetchPendingProducts());
  }, [dispatch]);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditedProduct({
      ...product,
      DesignTitle: product.DesignTitle || '',
      Maintag: product.Maintag || '',
      Designtags: product.Designtags || [],
      Description: product.Description || '',
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || 0,
      DesignScale: product.DesignScale || 1,
      availableColors: product.availableColors || ['white'],
      ProductColor: product.ProductColor || 'white',
      ProductType: product.ProductType || 't-shirt',
      ProductView: product.ProductView || 'front'
    });
  };

  const handleInputChange = (field, value) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorToggle = (color) => {
    setEditedProduct(prev => ({
      ...prev,
      availableColors: prev.availableColors.includes(color)
        ? prev.availableColors.filter(c => c !== color)
        : [...prev.availableColors, color]
    }));
  };const handleApprove = async () => {
    if (!editedProduct) return;
    
    if (!editedProduct.availableColors || editedProduct.availableColors.length === 0) {
      toast.error("Please select at least one available color");
      return;
    }

    if (!editedProduct.originalPrice || editedProduct.originalPrice <= 0) {
      toast.error("Please set a valid original price");
      return;
    }

    try {
      const updates = {
        DesignTitle: editedProduct.DesignTitle,
        Maintag: editedProduct.Maintag,
        Designtags: editedProduct.Designtags,
        Description: editedProduct.Description,
        originalPrice: parseFloat(editedProduct.originalPrice),
        discountPrice: parseFloat(editedProduct.discountPrice) || parseFloat(editedProduct.originalPrice),
        DesignScale: parseFloat(editedProduct.DesignScale),
        availableColors: editedProduct.availableColors,
        ProductType: editedProduct.ProductType,
        ProductView: editedProduct.ProductView,
        visibility: 'public' // Set visibility to public when approved
      };

      const result = await dispatch(approveRejectProduct(
        selectedProduct._id,
        'public',
        '',
        updates
      ));

      if (result.success) {
        toast.success("Product approved successfully!");
        dispatch(fetchPendingProducts());
        setSelectedProduct(null);
        setEditedProduct(null);
      }
    } catch (error) {
      toast.error(error.message || "Failed to approve product");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      const result = await dispatch(approveRejectProduct(
        selectedProduct._id,
        'rejected',
        rejectionReason,
        { visibility: 'restricted' } // Set visibility to restricted when rejected
      ));

      if (result.success) {
        toast.success("Product rejected successfully!");
        dispatch(fetchPendingProducts());
        setSelectedProduct(null);
        setEditedProduct(null);
        setShowRejectionDialog(false);
        setRejectionReason("");
      }
    } catch (error) {
      toast.error(error.message || "Failed to reject product");
    }
  };

  const columns = [
    {
      field: "id",
      headerName: "Product ID",
      minWidth: 150,
      flex: 0.7,
    },
    {
      field: "name",
      headerName: "Design Title",
      minWidth: 180,
      flex: 1.4,
    },
    {
      field: "mainTag",
      headerName: "Main Tag",
      minWidth: 140,
      flex: 0.8,
    },
    {
      field: "type",
      headerName: "Product Type",
      minWidth: 100,
      flex: 0.6,
    },
    {
      field: "Preview",
      flex: 1,
      minWidth: 150,
      headerName: "Preview",
      type: "number",
      sortable: false,
      renderCell: (params) => {
        return (
          <>
            <Button onClick={() => handleEdit(params.row)}>
              <span className="text-blue-500 hover:text-blue-700">
                Review Design
              </span>
            </Button>
          </>
        );
      },
    },
  ];

  const row = [];
  pendingProducts &&
    pendingProducts.forEach((item) => {
      row.push({
        id: item._id,
        name: item.DesignTitle,
        mainTag: item.Maintag,
        type: item.ProductType,
        item: item,
      });
    });return (
      <div className="w-full flex justify-center pt-5">
        <div className="w-[97%]">
          <h3 className="text-[22px] font-Poppins pb-2">Products Pending Approval</h3>
          <div className="w-full min-h-[45vh] bg-white rounded">
            <DataGrid
              rows={row}
              columns={columns}
              pageSize={10}
              disableSelectionOnClick
              autoHeight
            />
          </div>
  
          {/* Edit Modal */}
          {selectedProduct && editedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Review Product Design</h2>
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        setEditedProduct(null);
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </div>
  
                  {/* Product Preview */}
                  <div className="mb-6">
                    <div className="aspect-w-1 aspect-h-1 w-full bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={editedProduct.designImage?.url || editedProduct.designImage}
                        alt={editedProduct.DesignTitle}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
  
                  {/* Form Fields */}
                  <div className="space-y-6">
                    {/* Design Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Design Title
                      </label>
                      <input
                        type="text"
                        value={editedProduct.DesignTitle}
                        onChange={(e) => handleInputChange('DesignTitle', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Main Tag */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Main Tag
                      </label>
                      <input
                        type="text"
                        value={editedProduct.Maintag}
                        onChange={(e) => handleInputChange('Maintag', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Design Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Design Tags
                      </label>
                      <input
                        type="text"
                        value={editedProduct.Designtags}
                        onChange={(e) => handleInputChange('Designtags', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editedProduct.Description}
                        onChange={(e) => handleInputChange('Description', e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Design Scale */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Design Scale
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={editedProduct.DesignScale}
                        onChange={(e) => handleInputChange('DesignScale', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Original Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Original Price (£)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editedProduct.originalPrice}
                        onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Discount Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Discount Price (£)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editedProduct.discountPrice}
                        onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
  
                    {/* Available Colors Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available Colors
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {Object.entries(COLOR_OPTIONS).map(([key, color]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleColorToggle(key)}
                            className={`
                              p-3 rounded-lg border-2 transition-all duration-200
                              ${editedProduct.availableColors.includes(key)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'}
                            `}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: color.hex }}
                              />
                              <span className={`text-sm ${color.textColor}`}>
                                {color.label}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
  
                    {/* Action Buttons */}
                    <div className="flex space-x-4 pt-6">
                      <button
                        onClick={handleApprove}
                        className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setShowRejectionDialog(true)}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                      >
                        Reject
                      </button>
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
                <h3 className="text-xl font-bold mb-4">Reject Product</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejection..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleReject}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Confirm Reject
                  </button>
                  <button
                    onClick={() => {
                      setShowRejectionDialog(false);
                      setRejectionReason("");
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
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
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { STATUS_CONFIG } from './constants/productConfig';

const StatusManager = ({ product, onStatusChange, onReasonChange, disabled }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);

  const handleStatusSelect = (status) => {
    if (status === product.status) return;
    
    if (status === 'rejected') {
      setSelectedStatus(status);
      setIsConfirmOpen(true);
    } else {
      onStatusChange(status);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Status Management
      </h3>

      <div className="space-y-4">
        {/* Current Status */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Current Status:</span>
          <span className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${STATUS_CONFIG[product.status].color}
            ${STATUS_CONFIG[product.status].textColor}
          `}>
            {STATUS_CONFIG[product.status].label}
          </span>
        </div>

        {/* Status History */}
        {product.statusHistory && product.statusHistory.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Status History
            </h4>
            <div className="space-y-2">
              {product.statusHistory.map((entry, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className={`
                    px-2 py-0.5 rounded-full
                    ${STATUS_CONFIG[entry.status].color}
                    ${STATUS_CONFIG[entry.status].textColor}
                  `}>
                    {STATUS_CONFIG[entry.status].label}
                  </span>
                  <span className="text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Actions */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Change Status
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleStatusSelect('public')}
              disabled={disabled || product.status === 'public'}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                ${disabled || product.status === 'public'
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                }
              `}
            >
              Approve
            </button>
            <button
              onClick={() => handleStatusSelect('rejected')}
              disabled={disabled || product.status === 'rejected'}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                ${disabled || product.status === 'rejected'
                  ? 'bg-gray-100 text-gray-400'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                }
              `}
            >
              Reject
            </button>
          </div>
        </div>

        {/* Rejection Reason */}
        {(product.status === 'rejected' || isConfirmOpen) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Rejection Reason
            </h4>
            <textarea
              value={product.rejectionReason || ''}
              onChange={(e) => onReasonChange(e.target.value)}
              disabled={disabled || product.status === 'rejected'}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter reason for rejection..."
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Rejection
            </h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this product.
            </p>
            <textarea
              value={product.rejectionReason || ''}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Enter reason for rejection..."
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onStatusChange(selectedStatus);
                  setIsConfirmOpen(false);
                }}
                disabled={!product.rejectionReason}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:bg-gray-300"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

StatusManager.propTypes = {
  product: PropTypes.shape({
    status: PropTypes.string.isRequired,
    rejectionReason: PropTypes.string,
    statusHistory: PropTypes.arrayOf(PropTypes.shape({
      status: PropTypes.string.isRequired,
      timestamp: PropTypes.string.isRequired
    }))
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onReasonChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default StatusManager;
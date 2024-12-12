import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HiCheck, HiX, HiClock, HiExclamation } from 'react-icons/hi';
import { format } from 'date-fns';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    color: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-200',
    icon: HiClock,
    description: 'Awaiting admin review'
  },
  public: {
    label: 'Approved',
    color: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-200',
    icon: HiCheck,
    description: 'Product is live and available for purchase'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-200',
    icon: HiX,
    description: 'Product has been rejected'
  },
  review: {
    label: 'In Review',
    color: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-200',
    icon: HiExclamation,
    description: 'Under detailed review'
  }
};

const StatusManager = ({ 
  product, 
  onStatusChange, 
  onReasonChange, 
  disabled 
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [reasonRequired, setReasonRequired] = useState(false);

  const handleStatusSelect = (status) => {
    setSelectedStatus(status);
    setReasonRequired(status === 'rejected');
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (reasonRequired && !product.rejectionReason?.trim()) {
      return; // Don't proceed if reason is required but not provided
    }
    onStatusChange(selectedStatus);
    setShowConfirmation(false);
  };

  const currentStatus = STATUS_CONFIG[product.status];
  const StatusIcon = currentStatus?.icon || HiClock;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Status Management
      </h3>

      {/* Current Status Display */}
      <div className={`
        flex items-center p-4 rounded-lg mb-6
        ${currentStatus?.color || 'bg-gray-100'}
        ${currentStatus?.borderColor || 'border-gray-200'}
        border
      `}>
        <StatusIcon className={`
          w-6 h-6 mr-3
          ${currentStatus?.textColor || 'text-gray-800'}
        `} />
        <div>
          <h4 className={`
            font-medium
            ${currentStatus?.textColor || 'text-gray-800'}
          `}>
            {currentStatus?.label || 'Unknown Status'}
          </h4>
          <p className="text-sm text-gray-600 mt-0.5">
            {currentStatus?.description}
          </p>
        </div>
      </div>

      {/* Status History */}
      {product.statusHistory && product.statusHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Status History
          </h4>
          <div className="space-y-3">
            {product.statusHistory.map((entry, index) => {
              const statusConfig = STATUS_CONFIG[entry.status];
              const StatusHistoryIcon = statusConfig?.icon || HiClock;
              
              return (
                <div
                  key={index}
                  className="flex items-center text-sm"
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mr-3
                    ${statusConfig?.color || 'bg-gray-100'}
                  `}>
                    <StatusHistoryIcon className={`
                      w-4 h-4
                      ${statusConfig?.textColor || 'text-gray-600'}
                    `} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {statusConfig?.label || entry.status}
                      </span>
                      <span className="text-gray-500">
                        {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    {entry.reason && (
                      <p className="text-gray-600 mt-1">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleStatusSelect('public')}
          disabled={disabled || product.status === 'public'}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            ${disabled || product.status === 'public'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
            }
          `}
        >
          <HiCheck className="inline-block w-4 h-4 mr-2" />
          Approve
        </button>
        <button
          onClick={() => handleStatusSelect('rejected')}
          disabled={disabled || product.status === 'rejected'}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm
            ${disabled || product.status === 'rejected'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
            }
          `}
        >
          <HiX className="inline-block w-4 h-4 mr-2" />
          Reject
        </button>
      </div>

      {/* Rejection Reason */}
      {(product.status === 'rejected' || reasonRequired) && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rejection Reason
            {reasonRequired && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={product.rejectionReason || ''}
            onChange={(e) => onReasonChange(e.target.value)}
            disabled={disabled || product.status === 'rejected'}
            rows={3}
            className={`
              w-full px-3 py-2 border rounded-lg
              ${reasonRequired && !product.rejectionReason
                ? 'border-red-300 focus:ring-red-500'
                : 'focus:ring-blue-500'
              }
            `}
            placeholder="Please provide a reason for rejection..."
          />
          {reasonRequired && !product.rejectionReason && (
            <p className="mt-1 text-sm text-red-500">
              Rejection reason is required
            </p>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirm Status Change
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to change the status to{' '}
              <span className="font-medium">
                {STATUS_CONFIG[selectedStatus]?.label}
              </span>?
            </p>
            
            {reasonRequired && (
              <div className="mb-4">
                <textarea
                  value={product.rejectionReason || ''}
                  onChange={(e) => onReasonChange(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={reasonRequired && !product.rejectionReason?.trim()}
                className={`
                  px-4 py-2 text-sm font-medium text-white rounded-lg
                  ${selectedStatus === 'public'
                    ? 'bg-green-600 hover:bg-green-700'
                    : selectedStatus === 'rejected'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }
                  disabled:opacity-50
                `}
              >
                Confirm
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
      timestamp: PropTypes.string.isRequired,
      reason: PropTypes.string
    }))
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onReasonChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default StatusManager;
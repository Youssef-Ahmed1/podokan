// components/Admin/BulkActionMenu.jsx
import React from 'react';
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react';

const BulkActionMenu = ({ 
  selectedOrders, 
  onDownload, 
  onExport, 
  onStatusUpdate,
  isLoading 
}) => {
  return (
    <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow">
      <span className="text-sm text-gray-600">
        {selectedOrders.length} orders selected
      </span>

      <button
        onClick={onDownload}
        disabled={isLoading || selectedOrders.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        <Download Size={16} />
        Download Designs
      </button>

      <button
        onClick={onExport}
        disabled={isLoading || selectedOrders.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        <FileSpreadsheet Size={16} />
        Export to CSV
      </button>

      <div className="flex items-center gap-2">
        <select
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          onChange={(e) => onStatusUpdate(e.target.value)}
          disabled={isLoading || selectedOrders.length === 0}
        >
          <option value="">Update Status</option>
          <option value="Processing">Processing</option>
          <option value="Transferred to delivery partner">Transferred</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
        {isLoading && <RefreshCw className="animate-spin" Size={20} />}
      </div>
    </div>
  );
};

export default BulkActionMenu;
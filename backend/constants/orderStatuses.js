// backend/constants/orderStatuses.js
const ORDER_STATUSES = Object.freeze({
  PROCESSING: "Processing",
  TRANSFERRED: "Transferred to delivery partner",
  SHIPPING: "Shipping",
  RECEIVED: "Received",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  PROCESSING_REFUND: "Processing refund",
  REFUND_APPROVED: "Refund Approved",
  REFUND_REJECTED: "Refund Rejected",
  REFUND_SUCCESS: "Refund Success",
});

module.exports = {
  ORDER_STATUSES,
};
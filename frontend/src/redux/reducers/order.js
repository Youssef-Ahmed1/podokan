/**
 * @file Redux order reducer
 * @description Manages order-related state in the Redux store
 */

import { ORDER_ACTIONS } from "../actions/order";

/**
 * Initial state for the order reducer
 */
const initialState = {
  isLoading: false,
  orders: [],
  adminOrders: [],
  shopOrders: [],
  order: null,
  error: null,
  success: false,
  downloadStatus: {
    loading: false,
    success: false,
    error: null,
  },
  deliveryStatus: {
    loading: false,
    success: false,
    error: null,
  },
  refundStatus: {
    loading: false,
    success: false,
    error: null,
  },
  // For pagination and caching
  pagination: {
    page: 1,
    totalPages: 1,
    totalItems: 0,
  },
  lastFetched: null,
};

/**
 * Helper function to update an order in a list
 * @param {Array} orders - Array of orders
 * @param {Object} updatedOrder - The updated order
 * @returns {Array} - New array with the updated order
 */
const updateOrderInList = (orders, updatedOrder) => {
  if (!orders || !Array.isArray(orders)) return [];
  return orders.map((order) =>
    order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
  );
};

/**
 * Order reducer function
 */
export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // Create Order
    case ORDER_ACTIONS.CREATE_REQUEST:
      return {
        ...state,
        isLoading: true,
        success: false,
        error: null,
      };
    case ORDER_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        success: true,
        error: null,
        order: action.payload,
      };
    case ORDER_ACTIONS.CREATE_FAIL:
      return {
        ...state,
        isLoading: false,
        success: false,
        error: action.payload,
      };

    // Get All User Orders
    case ORDER_ACTIONS.GET_USER_REQUEST:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case ORDER_ACTIONS.GET_USER_SUCCESS:
      // Ensure payload is always an array
      const userOrders = Array.isArray(action.payload)
        ? action.payload
        : action.payload
        ? [action.payload]
        : [];

      return {
        ...state,
        isLoading: false,
        orders: userOrders,
        error: null,
      };
    case ORDER_ACTIONS.GET_USER_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        // Ensure orders is always an array
        orders: Array.isArray(state.orders) ? state.orders : [],
      };

    // Get Shop Orders
    case ORDER_ACTIONS.GET_SHOP_REQUEST:
      return {
        ...state,
        isLoading: true,
      };
    case ORDER_ACTIONS.GET_SHOP_SUCCESS:
      return {
        ...state,
        isLoading: false,
        shopOrders: action.payload,
        lastFetched: new Date().toISOString(),
        error: null,
      };
    case ORDER_ACTIONS.GET_SHOP_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // Get Admin Orders
    case ORDER_ACTIONS.GET_ADMIN_REQUEST:
      return {
        ...state,
        isLoading: true,
      };
    case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        adminOrders: action.payload,
        lastFetched: new Date().toISOString(),
        error: null,
      };
    case ORDER_ACTIONS.GET_ADMIN_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // Update Order Status
    case ORDER_ACTIONS.UPDATE_STATUS_REQUEST:
      return {
        ...state,
        isLoading: true,
      };
    case ORDER_ACTIONS.UPDATE_STATUS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        success: true,
        orders: updateOrderInList(state.orders, action.payload),
        adminOrders: updateOrderInList(state.adminOrders, action.payload),
        shopOrders: updateOrderInList(state.shopOrders, action.payload),
      };
    case ORDER_ACTIONS.UPDATE_STATUS_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };

    // Download Specifications
    case ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST:
      return {
        ...state,
        downloadStatus: {
          loading: true,
          success: false,
          error: null,
        },
      };
    case ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS:
      return {
        ...state,
        downloadStatus: {
          loading: false,
          success: true,
          error: null,
        },
      };
    case ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL:
      return {
        ...state,
        downloadStatus: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    // Download Design
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST:
      return {
        ...state,
        downloadStatus: {
          loading: true,
          success: false,
          error: null,
        },
      };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS:
      return {
        ...state,
        downloadStatus: {
          loading: false,
          success: true,
          error: null,
        },
      };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL:
      return {
        ...state,
        downloadStatus: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    // Assign Delivery Partner
    case ORDER_ACTIONS.ASSIGN_DELIVERY_REQUEST:
      return {
        ...state,
        deliveryStatus: {
          loading: true,
          success: false,
          error: null,
        },
      };
    case ORDER_ACTIONS.ASSIGN_DELIVERY_SUCCESS:
      return {
        ...state,
        deliveryStatus: {
          loading: false,
          success: true,
          error: null,
        },
        orders: updateOrderInList(state.orders, action.payload),
        adminOrders: updateOrderInList(state.adminOrders, action.payload),
        shopOrders: updateOrderInList(state.shopOrders, action.payload),
      };
    case ORDER_ACTIONS.ASSIGN_DELIVERY_FAIL:
      return {
        ...state,
        deliveryStatus: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    // Update Delivery Status
    case ORDER_ACTIONS.UPDATE_DELIVERY_REQUEST:
      return {
        ...state,
        deliveryStatus: {
          loading: true,
          success: false,
          error: null,
        },
      };
    case ORDER_ACTIONS.UPDATE_DELIVERY_SUCCESS:
      return {
        ...state,
        deliveryStatus: {
          loading: false,
          success: true,
          error: null,
        },
        orders: updateOrderInList(state.orders, action.payload),
        adminOrders: updateOrderInList(state.adminOrders, action.payload),
        shopOrders: updateOrderInList(state.shopOrders, action.payload),
      };
    case ORDER_ACTIONS.UPDATE_DELIVERY_FAIL:
      return {
        ...state,
        deliveryStatus: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    // Refund Request
    case ORDER_ACTIONS.REFUND_REQUEST:
      return {
        ...state,
        refundStatus: {
          loading: true,
          success: false,
          error: null,
        },
      };
    case ORDER_ACTIONS.REFUND_SUCCESS:
      return {
        ...state,
        refundStatus: {
          loading: false,
          success: true,
          error: null,
        },
        order: action.payload,
      };
    case ORDER_ACTIONS.REFUND_FAIL:
      return {
        ...state,
        refundStatus: {
          loading: false,
          success: false,
          error: action.payload,
        },
      };

    // Reset States
    case ORDER_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null,
        downloadStatus: {
          ...state.downloadStatus,
          error: null,
        },
        deliveryStatus: {
          ...state.deliveryStatus,
          error: null,
        },
        refundStatus: {
          ...state.refundStatus,
          error: null,
        },
      };

    default:
      return state;
  }
};

// Improved selector functions with memoization potential
export const selectOrders = (state) => state.order.orders;
export const selectAdminOrders = (state) => state.order.adminOrders;
export const selectShopOrders = (state) => state.order.shopOrders;
export const selectCurrentOrder = (state) => state.order.order;
export const selectOrderLoading = (state) => state.order.isLoading;
export const selectOrderError = (state) => state.order.error;
export const selectOrderSuccess = (state) => state.order.success;
export const selectDownloadStatus = (state) => state.order.downloadStatus;
export const selectDeliveryStatus = (state) => state.order.deliveryStatus;
export const selectRefundStatus = (state) => state.order.refundStatus;
export const selectLastFetched = (state) => state.order.lastFetched;

export default orderReducer;

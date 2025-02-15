// backend/redux/reducers/order.js

import { ORDER_ACTIONS } from "../actions/order";

const initialState = {
  isLoading: false,
  orders: [],
  adminOrders: [],
  shopOrders: [],
  order: null,
  error: null,
  success: false,
  downloadSuccess: false,
  downloadError: null,
  deliverySuccess: false,
  deliveryError: null,
  refundSuccess: false,
  refundError: null
};

export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // Create Order
    case ORDER_ACTIONS.CREATE_REQUEST:
      return {
        ...state,
        isLoading: true
      };
    case ORDER_ACTIONS.CREATE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        success: true,
        order: action.payload
      };
    case ORDER_ACTIONS.CREATE_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    // Get All User Orders
    case ORDER_ACTIONS.GET_USER_REQUEST:
      return {
        ...state,
        isLoading: true
      };
    case ORDER_ACTIONS.GET_USER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        orders: action.payload
      };
    case ORDER_ACTIONS.GET_USER_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    // Get Shop Orders
    case ORDER_ACTIONS.GET_SHOP_REQUEST:
      return {
        ...state,
        isLoading: true
      };
    case ORDER_ACTIONS.GET_SHOP_SUCCESS:
      return {
        ...state,
        isLoading: false,
        shopOrders: action.payload
      };
    case ORDER_ACTIONS.GET_SHOP_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    // Get Admin Orders
    case ORDER_ACTIONS.GET_ADMIN_REQUEST:
      return {
        ...state,
        isLoading: true
      };
    case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        adminOrders: action.payload
      };
    case ORDER_ACTIONS.GET_ADMIN_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    // Update Order Status
    case ORDER_ACTIONS.UPDATE_STATUS_REQUEST:
      return {
        ...state,
        isLoading: true
      };
    case ORDER_ACTIONS.UPDATE_STATUS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        success: true,
        orders: state.orders.map(order => 
          order._id === action.payload._id ? action.payload : order
        )
      };
    case ORDER_ACTIONS.UPDATE_STATUS_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload
      };

    // Download Specifications
    case ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST:
      return {
        ...state,
        isLoading: true,
        downloadSuccess: false,
        downloadError: null
      };
    case ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS:
      return {
        ...state,
        isLoading: false,
        downloadSuccess: true
      };
    case ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL:
      return {
        ...state,
        isLoading: false,
        downloadError: action.payload
      };

    // Download Design
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST:
      return {
        ...state,
        isLoading: true,
        downloadSuccess: false,
        downloadError: null
      };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        downloadSuccess: true
      };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL:
      return {
        ...state,
        isLoading: false,
        downloadError: action.payload
      };

    // Assign Delivery Partner
    case ORDER_ACTIONS.ASSIGN_DELIVERY_REQUEST:
      return {
        ...state,
        isLoading: true,
        deliverySuccess: false,
        deliveryError: null
      };
    case ORDER_ACTIONS.ASSIGN_DELIVERY_SUCCESS:
      return {
        ...state,
        isLoading: false,
        deliverySuccess: true,
        orders: state.orders.map(order => 
          order._id === action.payload._id ? action.payload : order
        )
      };
    case ORDER_ACTIONS.ASSIGN_DELIVERY_FAIL:
      return {
        ...state,
        isLoading: false,
        deliveryError: action.payload
      };

    // Update Delivery Status
    case ORDER_ACTIONS.UPDATE_DELIVERY_REQUEST:
      return {
        ...state,
        isLoading: true,
        deliverySuccess: false,
        deliveryError: null
      };
    case ORDER_ACTIONS.UPDATE_DELIVERY_SUCCESS:
      return {
        ...state,
        isLoading: false,
        deliverySuccess: true,
        orders: state.orders.map(order => 
          order._id === action.payload._id ? action.payload : order
        )
      };
    case ORDER_ACTIONS.UPDATE_DELIVERY_FAIL:
      return {
        ...state,
        isLoading: false,
        deliveryError: action.payload
      };

    // Refund Request
    case ORDER_ACTIONS.REFUND_REQUEST:
      return {
        ...state,
        isLoading: true,
        refundSuccess: false,
        refundError: null
      };
    case ORDER_ACTIONS.REFUND_SUCCESS:
      return {
        ...state,
        isLoading: false,
        refundSuccess: true,
        order: action.payload
      };
    case ORDER_ACTIONS.REFUND_FAIL:
      return {
        ...state,
        isLoading: false,
        refundError: action.payload
      };

    // Reset States
    case ORDER_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        error: null,
        downloadError: null,
        deliveryError: null,
        refundError: null
      };

    default:
      return state;
  }
};

// Selector functions for easier state access
export const selectOrders = (state) => state.order.orders;
export const selectAdminOrders = (state) => state.order.adminOrders;
export const selectShopOrders = (state) => state.order.shopOrders;
export const selectCurrentOrder = (state) => state.order.order;
export const selectOrderLoading = (state) => state.order.isLoading;
export const selectOrderError = (state) => state.order.error;
export const selectOrderSuccess = (state) => state.order.success;
export const selectDownloadStatus = (state) => ({
  success: state.order.downloadSuccess,
  error: state.order.downloadError
});
export const selectDeliveryStatus = (state) => ({
  success: state.order.deliverySuccess,
  error: state.order.deliveryError
});
export const selectRefundStatus = (state) => ({
  success: state.order.refundSuccess,
  error: state.order.refundError
});

export default orderReducer;
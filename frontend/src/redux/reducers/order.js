import { ORDER_ACTIONS } from "../actions/order";

const initialState = {
  isLoading: false,
  isDetailLoading: false,
  isUpdating: false,
  isDownloading: false,
  orders: [],
  shopOrders: [],
  adminOrders: [],
  order: null,
  adminTotalOrders: 0,
  adminCurrentPage: 1,
  adminTotalPages: 1,
  adminLimit: 15,
  error: null,
  updateError: null,
  downloadError: null,
  success: false,
};

const updateOrderInList = (list, updatedOrder) => {
  if (!Array.isArray(list) || !updatedOrder?._id) {
    return list || [];
  }
  const index = list.findIndex((o) => o._id === updatedOrder._id);
  if (index === -1) {
    return list;
  }
  const existingOrder = list[index];
  const mergedOrder = { ...existingOrder, ...updatedOrder };
  return [...list.slice(0, index), mergedOrder, ...list.slice(index + 1)];
};

export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    case ORDER_ACTIONS.CREATE_REQUEST:
      return { ...state, isUpdating: true, success: false, updateError: null };
    case ORDER_ACTIONS.CREATE_SUCCESS:
      return { ...state, isUpdating: false, success: true, updateError: null };
    case ORDER_ACTIONS.CREATE_FAIL:
      return {
        ...state,
        isUpdating: false,
        success: false,
        updateError: action.payload,
      };
    case ORDER_ACTIONS.CREATE_FINALLY:
      return { ...state, isUpdating: false };

    case ORDER_ACTIONS.GET_USER_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_USER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        orders: Array.isArray(action.payload) ? action.payload : [],
        error: null,
      };
    case ORDER_ACTIONS.GET_USER_FAIL:
      return { ...state, isLoading: false, error: action.payload, orders: [] };
    case ORDER_ACTIONS.GET_USER_FINALLY:
      return { ...state, isLoading: false };

    case ORDER_ACTIONS.GET_SHOP_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_SHOP_SUCCESS:
      return {
        ...state,
        isLoading: false,
        shopOrders: Array.isArray(action.payload) ? action.payload : [],
        error: null,
      };
    case ORDER_ACTIONS.GET_SHOP_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        shopOrders: [],
      };
    case ORDER_ACTIONS.GET_SHOP_FINALLY:
      return { ...state, isLoading: false };

    case ORDER_ACTIONS.GET_ADMIN_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
      const adminPayload = action.payload;
      return {
        ...state,
        isLoading: false,
        adminOrders: Array.isArray(adminPayload?.orders)
          ? adminPayload.orders
          : [],
        adminTotalOrders: adminPayload?.totalOrders || 0,
        adminCurrentPage: adminPayload?.currentPage || 1,
        adminTotalPages: adminPayload?.totalPages || 1,
        adminLimit: adminPayload?.limit || state.adminLimit,
        error: null,
      };
    case ORDER_ACTIONS.GET_ADMIN_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        adminOrders: [],
      };
    case ORDER_ACTIONS.GET_ADMIN_FINALLY:
      return { ...state, isLoading: false };

    case ORDER_ACTIONS.GET_DETAIL_REQUEST:
      return { ...state, isDetailLoading: true, order: null, error: null };
    case ORDER_ACTIONS.GET_DETAIL_SUCCESS:
      const isValidOrderObject =
        action.payload &&
        typeof action.payload === "object" &&
        action.payload._id;
      return {
        ...state,
        isDetailLoading: false,
        order: isValidOrderObject ? action.payload : null,
        error: isValidOrderObject ? null : "Received invalid order data",
      };
    case ORDER_ACTIONS.GET_DETAIL_FAIL:
      return {
        ...state,
        isDetailLoading: false,
        error: action.payload,
        order: null,
      };
    case ORDER_ACTIONS.GET_DETAIL_FINALLY:
      return { ...state, isDetailLoading: false };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST:
      return { ...state, isUpdating: true, updateError: null };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS:
      const updatedOrder = action.payload;
      if (!updatedOrder?._id) return state;
      return {
        ...state,
        isUpdating: false,
        success: true,
        updateError: null,
        adminOrders: updateOrderInList(state.adminOrders, updatedOrder),
        shopOrders: updateOrderInList(state.shopOrders, updatedOrder),
        orders: updateOrderInList(state.orders, updatedOrder),
        order:
          state.order?._id === updatedOrder._id ? updatedOrder : state.order,
      };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FAIL:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_FAIL:
      return {
        ...state,
        isUpdating: false,
        success: false,
        updateError: action.payload,
      };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FINALLY:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_FINALLY:
      return { ...state, isUpdating: false };

    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_REQUEST:
      return { ...state, isDownloading: true, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS:
      return { ...state, isDownloading: false, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FAIL:
      return { ...state, isDownloading: false, downloadError: action.payload };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FINALLY:
      return { ...state, isDownloading: false };

    case "order/sseUpdate":
      const sseUpdatedOrder = action.payload;
      if (!sseUpdatedOrder?._id) return state;
      console.log(
        `Reducer: Handling SSE update for order ${sseUpdatedOrder._id}`
      );
      return {
        ...state,
        adminOrders: updateOrderInList(state.adminOrders, sseUpdatedOrder),
        shopOrders: updateOrderInList(state.shopOrders, sseUpdatedOrder),
        orders: updateOrderInList(state.orders, sseUpdatedOrder),
        order:
          state.order?._id === sseUpdatedOrder._id
            ? sseUpdatedOrder
            : state.order,
      };

    case ORDER_ACTIONS.CLEAR_ERRORS:
      return { ...state, error: null, updateError: null, downloadError: null };

    default:
      return state;
  }
};

export default orderReducer;
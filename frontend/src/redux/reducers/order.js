import { ORDER_ACTIONS } from "../actions/order";

const initialState = {
  isLoading: false,
  isDetailLoading: false,
  isUpdating: false,
  isDownloading: false,
  orders: [],
  adminOrders: [],
  shopOrders: [],
  order: null,
  error: null,
  updateError: null,
  downloadError: null,
  success: false,
  lastFetched: { user: null, admin: null, shop: null, detail: {} },
};

const updateOrderInList = (list, updatedOrder) => {
  if (!Array.isArray(list) || !updatedOrder?._id) return list || [];
  const index = list.findIndex((o) => o._id === updatedOrder._id);
  if (index === -1) return list;
  const existingOrder = list[index];
  const mergedOrder = { ...existingOrder, ...updatedOrder }; // Merge incoming data over existing
  return [...list.slice(0, index), mergedOrder, ...list.slice(index + 1)];
};

export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // Create Order
    case ORDER_ACTIONS.CREATE_REQUEST:
      return { ...state, isUpdating: true, success: false, updateError: null };
    case ORDER_ACTIONS.CREATE_SUCCESS:
      return { ...state, isUpdating: false, success: true, updateError: null }; // Don't modify lists here, rely on refetch
    case ORDER_ACTIONS.CREATE_FAIL:
      return {
        ...state,
        isUpdating: false,
        success: false,
        updateError: action.payload,
      };
    case ORDER_ACTIONS.CREATE_FINALLY:
      return { ...state, isUpdating: false };

    // Get User Orders
    case ORDER_ACTIONS.GET_USER_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_USER_SUCCESS:
      return {
        ...state,
        isLoading: false,
        orders: Array.isArray(action.payload) ? action.payload : [],
        lastFetched: { ...state.lastFetched, user: Date.now() },
        error: null,
      };
    case ORDER_ACTIONS.GET_USER_FAIL:
      return { ...state, isLoading: false, error: action.payload, orders: [] };
    case ORDER_ACTIONS.GET_USER_FINALLY:
      return { ...state, isLoading: false };

    // Get Shop Orders
    case ORDER_ACTIONS.GET_SHOP_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_SHOP_SUCCESS:
      return {
        ...state,
        isLoading: false,
        shopOrders: Array.isArray(action.payload) ? action.payload : [],
        lastFetched: { ...state.lastFetched, shop: Date.now() },
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

    // Get Admin Orders
    case ORDER_ACTIONS.GET_ADMIN_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        adminOrders: Array.isArray(action.payload) ? action.payload : [],
        lastFetched: { ...state.lastFetched, admin: Date.now() },
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

    // Get Order Detail
    case ORDER_ACTIONS.GET_DETAIL_REQUEST:
      return { ...state, isDetailLoading: true, order: null, error: null }; // Clear previous detail on new request
    case ORDER_ACTIONS.GET_DETAIL_SUCCESS:
      const dId = action.payload?._id;
      return {
        ...state,
        isDetailLoading: false,
        order: action.payload,
        lastFetched: {
          ...state.lastFetched,
          detail: { ...state.lastFetched.detail, [dId]: Date.now() },
        },
        error: null,
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

    // Admin Update Status
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST:
      return { ...state, isUpdating: true, updateError: null };
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS:
      const uA = action.payload;
      return {
        ...state,
        isUpdating: false,
        success: true,
        updateError: null,
        adminOrders: updateOrderInList(state.adminOrders, uA),
        shopOrders: updateOrderInList(state.shopOrders, uA),
        orders: updateOrderInList(state.orders, uA),
        order: state.order?._id === uA._id ? uA : state.order,
      };
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FAIL:
      return {
        ...state,
        isUpdating: false,
        success: false,
        updateError: action.payload,
      };
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FINALLY:
      return { ...state, isUpdating: false };

    // Seller Update Refund Status
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST:
      return { ...state, isUpdating: true, updateError: null };
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS:
      const uR = action.payload;
      return {
        ...state,
        isUpdating: false,
        success: true,
        updateError: null,
        shopOrders: updateOrderInList(state.shopOrders, uR),
        adminOrders: updateOrderInList(state.adminOrders, uR),
        orders: updateOrderInList(state.orders, uR),
        order: state.order?._id === uR._id ? uR : state.order,
      };
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_FAIL:
      return {
        ...state,
        isUpdating: false,
        success: false,
        updateError: action.payload,
      };
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_FINALLY:
      return { ...state, isUpdating: false };

    // Download Design Data Fetch
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_REQUEST:
      return { ...state, isDownloading: true, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS:
      return { ...state, isDownloading: false, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FAIL:
      return { ...state, isDownloading: false, downloadError: action.payload };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FINALLY:
      return { ...state, isDownloading: false };

    // SSE Update Handler
    case "o/sseUpdate": // Matches example type from SSE util
      const sseUpdatedOrder = action.payload;
      if (!sseUpdatedOrder?._id) return state;
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

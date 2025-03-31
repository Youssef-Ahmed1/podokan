// frontend/src/redux/reducers/orderReducer.js
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
  success: false,
  downloadError: null,
  lastFetched: { user: null, admin: null, shop: null, detail: {} },
};
const updateOrderInList = (list, updated) => {
  if (!Array.isArray(list) || !updated?._id) return list || [];
  const i = list.findIndex((o) => o._id === updated._id);
  if (i === -1) return list;
  return [
    ...list.slice(0, i),
    { ...list[i], ...updated },
    ...list.slice(i + 1),
  ];
};

export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    case ORDER_ACTIONS.CREATE_REQUEST:
      return { ...state, isUpdating: true, success: false, error: null };
    case ORDER_ACTIONS.CREATE_SUCCESS:
      return { ...state, isUpdating: false, success: true, error: null };
    case ORDER_ACTIONS.CREATE_FAIL:
      return {
        ...state,
        isUpdating: false,
        success: false,
        error: action.payload,
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
        lastFetched: { ...state.lastFetched, user: Date.now() },
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
    case ORDER_ACTIONS.GET_DETAIL_REQUEST:
      return { ...state, isDetailLoading: true, order: null, error: null };
    case ORDER_ACTIONS.GET_DETAIL_SUCCESS:
      const id = action.payload?._id;
      return {
        ...state,
        isDetailLoading: false,
        order: action.payload,
        lastFetched: {
          ...state.lastFetched,
          detail: { ...state.lastFetched.detail, [id]: Date.now() },
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
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST:
      return { ...state, isUpdating: true, error: null };
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS:
      const uA = action.payload;
      return {
        ...state,
        isUpdating: false,
        success: true,
        error: null,
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
        error: action.payload,
      };
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FINALLY:
      return { ...state, isUpdating: false };
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST:
      return { ...state, isUpdating: true, error: null };
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS:
      const uR = action.payload;
      return {
        ...state,
        isUpdating: false,
        success: true,
        error: null,
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
        error: action.payload,
      };
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
    case ORDER_ACTIONS.CLEAR_ERRORS:
      return { ...state, error: null, downloadError: null };
    default:
      return state;
  }
};

export default orderReducer;

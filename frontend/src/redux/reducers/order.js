import { ORDER_ACTIONS } from "../actions/order"; // Adjust path if needed

const initialState = {
  isLoading: false, // For loading lists (user, admin, shop)
  isDetailLoading: false, // For loading single order detail
  isUpdating: false, // For create, status updates, refund actions
  isDownloading: false, // For design download preparation step

  // User Orders State
  orders: [],

  // Admin Orders State (now with pagination info)
  adminOrders: [], // Orders for the current page
  adminTotalOrders: 0, // Total count of all admin orders
  adminCurrentPage: 1, // Current page number being viewed
  adminTotalPages: 1, // Total pages available
  adminLimit: 15, // Items per page

  // Seller Orders State
  shopOrders: [],

  // Single Order Detail State
  order: null,

  // Error/Success States
  error: null, // General list/detail loading errors
  updateError: null, // Errors during update operations
  downloadError: null, // Errors during download data fetch
  success: false, // Generic success flag (e.g., for creation)

  // Caching Info (optional)
  lastFetched: { user: null, admin: null, shop: null, detail: {} },
};

// Helper to update an order within any list immutably
const updateOrderInList = (list, updatedOrder) => {
  if (!Array.isArray(list) || !updatedOrder?._id) {
    // console.warn("updateOrderInList: Invalid input", { list: typeof list, updatedOrder });
    return list || []; // Return original list or empty array
  }
  const index = list.findIndex((o) => o._id === updatedOrder._id);
  if (index === -1) {
    return list; // Order not found in this list, return original
  }
  // Merge updated data onto existing data to preserve fields not included in update response
  const existingOrder = list[index];
  const mergedOrder = { ...existingOrder, ...updatedOrder };
  // Return new array with updated order
  return [...list.slice(0, index), mergedOrder, ...list.slice(index + 1)];
};

export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // --- Create Order ---
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

    // --- Get User Orders ---
    case ORDER_ACTIONS.GET_USER_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_USER_SUCCESS:
      // Handle potential object payload vs just array
      const userOrdersPayload = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.orders || [];
      return {
        ...state,
        isLoading: false,
        orders: userOrdersPayload,
        lastFetched: { ...state.lastFetched, user: Date.now() },
        error: null,
      };
    case ORDER_ACTIONS.GET_USER_FAIL:
      return { ...state, isLoading: false, error: action.payload, orders: [] };
    case ORDER_ACTIONS.GET_USER_FINALLY:
      return { ...state, isLoading: false };

    // --- Get Shop Orders ---
    case ORDER_ACTIONS.GET_SHOP_REQUEST:
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_SHOP_SUCCESS:
      const shopOrdersPayload = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.orders || [];
      return {
        ...state,
        isLoading: false,
        shopOrders: shopOrdersPayload,
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

    // --- Get Admin Orders (Paginated) ---
    case ORDER_ACTIONS.GET_ADMIN_REQUEST:
      return { ...state, isLoading: true, error: null }; // Keep existing admin orders while loading new page potentially
    case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
      // Expecting payload = { orders, totalOrders, currentPage, totalPages, limit } from action
      const adminPayload = action.payload;
      return {
        ...state,
        isLoading: false,
        adminOrders: Array.isArray(adminPayload?.orders)
          ? adminPayload.orders
          : [], // Orders for the current page
        adminTotalOrders: adminPayload?.totalOrders || 0,
        adminCurrentPage: adminPayload?.currentPage || 1,
        adminTotalPages: adminPayload?.totalPages || 1,
        adminLimit: adminPayload?.limit || state.adminLimit, // Keep existing limit if not provided
        lastFetched: { ...state.lastFetched, admin: Date.now() }, // Or maybe track per page?
        error: null,
      };
    case ORDER_ACTIONS.GET_ADMIN_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        // Optionally clear adminOrders on fail, or keep previous page data
        // adminOrders: [],
        // adminTotalOrders: 0, adminCurrentPage: 1, adminTotalPages: 1,
      };
    case ORDER_ACTIONS.GET_ADMIN_FINALLY:
      return { ...state, isLoading: false };

    // --- Get Order Detail ---
    case ORDER_ACTIONS.GET_DETAIL_REQUEST:
      return { ...state, isDetailLoading: true, order: null, error: null };
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

    // --- Admin Update Status ---
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST:
      return { ...state, isUpdating: true, updateError: null };
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS:
      const updatedAdminOrder = action.payload; // Expecting the updated order object
      return {
        ...state,
        isUpdating: false,
        success: true,
        updateError: null,
        // Update the order in all relevant lists
        adminOrders: updateOrderInList(state.adminOrders, updatedAdminOrder), // Update in current admin page list
        shopOrders: updateOrderInList(state.shopOrders, updatedAdminOrder),
        orders: updateOrderInList(state.orders, updatedAdminOrder),
        // Update the detailed view if it's the one currently displayed
        order:
          state.order?._id === updatedAdminOrder._id
            ? updatedAdminOrder
            : state.order,
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

    // --- Seller Update Refund Status ---
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST:
      return { ...state, isUpdating: true, updateError: null };
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS:
      const updatedRefundOrder = action.payload; // Expecting updated order object
      return {
        ...state,
        isUpdating: false,
        success: true,
        updateError: null,
        shopOrders: updateOrderInList(state.shopOrders, updatedRefundOrder),
        adminOrders: updateOrderInList(state.adminOrders, updatedRefundOrder),
        orders: updateOrderInList(state.orders, updatedRefundOrder),
        order:
          state.order?._id === updatedRefundOrder._id
            ? updatedRefundOrder
            : state.order,
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

    // --- Download Design Data Fetch ---
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_REQUEST:
      return { ...state, isDownloading: true, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS:
      return { ...state, isDownloading: false, downloadError: null }; // Only indicates fetch success
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FAIL:
      return { ...state, isDownloading: false, downloadError: action.payload };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FINALLY:
      return { ...state, isDownloading: false };

    // --- SSE Order Update Handler ---
    case "o/sseUpdate": // Ensure this matches the type dispatched by your SSE utility
      const sseUpdatedOrder = action.payload;
      if (!sseUpdatedOrder?._id) return state; // Ignore if no valid ID
      console.log(
        `Reducer: Handling SSE update for order ${sseUpdatedOrder._id}`
      );
      return {
        ...state,
        // Update the order wherever it appears in the state
        adminOrders: updateOrderInList(state.adminOrders, sseUpdatedOrder),
        shopOrders: updateOrderInList(state.shopOrders, sseUpdatedOrder),
        orders: updateOrderInList(state.orders, sseUpdatedOrder),
        order:
          state.order?._id === sseUpdatedOrder._id
            ? sseUpdatedOrder
            : state.order,
      };

    // --- Clear Errors ---
    case ORDER_ACTIONS.CLEAR_ERRORS:
      return { ...state, error: null, updateError: null, downloadError: null };

    default:
      return state;
  }
};

export default orderReducer;

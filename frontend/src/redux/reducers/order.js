import { ORDER_ACTIONS } from "../actions/order"; // Adjust path

const initialState = {
  // Loading states
  isLoading: false, // For loading lists (user, admin page, shop)
  isDetailLoading: false, // For loading single order detail
  isUpdating: false, // For create, status updates, refund actions
  isDownloading: false, // For design download data preparation step

  // Data states
  orders: [], // User's orders list
  shopOrders: [], // Seller's orders list
  adminOrders: [], // Admin orders for the CURRENT page
  order: null, // Single order detail view

  // Pagination state for Admin orders
  adminTotalOrders: 0, // Total count across all pages
  adminCurrentPage: 1, // Current page number from the last fetch
  adminTotalPages: 1, // Total pages based on totalOrders and limit
  adminLimit: 15, // Items per page from the last fetch (or default)

  // Error states
  error: null, // General error for list/detail loading
  updateError: null, // Specific error for update operations
  downloadError: null, // Specific error for download data fetch

  // Success flags (optional, can rely on absence of error)
  success: false, // Generic success flag (e.g., for creation)
};

const updateOrderInList = (list, updatedOrder) => {
  // Basic validation
  if (!Array.isArray(list) || !updatedOrder?._id) {
    // console.warn("updateOrderInList: Invalid input provided.", { listType: typeof list, updatedOrder });
    return list || []; // Return original list or empty array if invalid
  }

  const index = list.findIndex((o) => o._id === updatedOrder._id);

  // If the order isn't found in this list, return the original list
  if (index === -1) {
    return list;
  }

  const existingOrder = list[index];
  const mergedOrder = { ...existingOrder, ...updatedOrder };

  // Return a new array instance
  return [
    ...list.slice(0, index), // Elements before the updated one
    mergedOrder, // The updated order
    ...list.slice(index + 1), // Elements after the updated one
  ];
};

// --- The Reducer Function ---
export const orderReducer = (state = initialState, action) => {
  switch (action.type) {
    // --- Create Order ---
    case ORDER_ACTIONS.CREATE_REQUEST:
      return { ...state, isUpdating: true, success: false, updateError: null };
    case ORDER_ACTIONS.CREATE_SUCCESS:
      return { ...state, isUpdating: false, success: true, updateError: null }; // Orders aren't added to list here, usually redirect occurs
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
      // Ensure payload is an array, even if API response wraps it
      const userOrdersPayload = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.orders || [];
      return {
        ...state,
        isLoading: false,
        orders: userOrdersPayload,
        error: null,
      };
    case ORDER_ACTIONS.GET_USER_FAIL:
      return { ...state, isLoading: false, error: action.payload, orders: [] }; // Clear orders on fail
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
        error: null,
      };
    case ORDER_ACTIONS.GET_SHOP_FAIL:
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        shopOrders: [],
      }; // Clear on fail
    case ORDER_ACTIONS.GET_SHOP_FINALLY:
      return { ...state, isLoading: false };

    // --- Get Admin Orders (Paginated) ---
    case ORDER_ACTIONS.GET_ADMIN_REQUEST:
      // Keep existing data while loading next page, but set loading true
      return { ...state, isLoading: true, error: null };
    case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
      // Payload is expected to be: { orders, totalOrders, currentPage, totalPages, limit }
      const adminPayload = action.payload;
      return {
        ...state,
        isLoading: false,
        // Update the list with orders for the fetched page
        adminOrders: Array.isArray(adminPayload?.orders)
          ? adminPayload.orders
          : [],
        // Update pagination info from the response
        adminTotalOrders: adminPayload?.totalOrders || 0,
        adminCurrentPage: adminPayload?.currentPage || 1,
        adminTotalPages: adminPayload?.totalPages || 1,
        adminLimit: adminPayload?.limit || state.adminLimit, // Use response limit or keep previous
        error: null,
      };
    case ORDER_ACTIONS.GET_ADMIN_FAIL:
      // Keep previous page data on error? Or clear? Clearing might be confusing.
      // Let's keep the previous data but show the error.
      return { ...state, isLoading: false, error: action.payload };
    case ORDER_ACTIONS.GET_ADMIN_FINALLY:
      return { ...state, isLoading: false };

    // --- Get Order Detail ---
    case ORDER_ACTIONS.GET_DETAIL_REQUEST:
      // Clear previous detail and error when starting fetch
      return { ...state, isDetailLoading: true, order: null, error: null };
    case ORDER_ACTIONS.GET_DETAIL_SUCCESS:
      return {
        ...state,
        isDetailLoading: false,
        order: action.payload,
        error: null,
      };
    case ORDER_ACTIONS.GET_DETAIL_FAIL:
      return {
        ...state,
        isDetailLoading: false,
        error: action.payload,
        order: null,
      }; // Clear order on fail
    case ORDER_ACTIONS.GET_DETAIL_FINALLY:
      return { ...state, isDetailLoading: false };

    // --- Admin Update Status ---
    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST: // Combine request/finally states
      return { ...state, isUpdating: true, updateError: null };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS: // Combine success states
      const updatedOrder = action.payload; // Expecting the updated order object as payload
      if (!updatedOrder?._id) return state; // Ignore if payload is invalid
      return {
        ...state,
        isUpdating: false,
        success: true,
        updateError: null,
        // Update the order immutably in all relevant lists
        adminOrders: updateOrderInList(state.adminOrders, updatedOrder),
        shopOrders: updateOrderInList(state.shopOrders, updatedOrder),
        orders: updateOrderInList(state.orders, updatedOrder),
        // Update the detailed view if it's the one currently displayed
        order:
          state.order?._id === updatedOrder._id ? updatedOrder : state.order,
      };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FAIL:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_FAIL: // Combine fail states
      return {
        ...state,
        isUpdating: false,
        success: false,
        updateError: action.payload,
      };

    case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FINALLY:
    case ORDER_ACTIONS.SELLER_UPDATE_REFUND_FINALLY: // Combine finally states
      return { ...state, isUpdating: false };

    // --- Download Design Data Fetch ---
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_REQUEST:
      return { ...state, isDownloading: true, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS:
      // Success only indicates the data fetch was successful, actual download is handled client-side
      return { ...state, isDownloading: false, downloadError: null };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FAIL:
      return { ...state, isDownloading: false, downloadError: action.payload };
    case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FINALLY:
      return { ...state, isDownloading: false };

    // --- Placeholder for potential real-time updates (e.g., via WebSockets/SSE) ---
    case "order/sseUpdate": // Example action type for SSE
      const sseUpdatedOrder = action.payload;
      if (!sseUpdatedOrder?._id) return state; // Ignore invalid SSE data
      console.log(
        `Reducer: Handling SSE update for order ${sseUpdatedOrder._id}`
      );
      return {
        ...state,
        // Update the order wherever it might appear in the state
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
      return {
        ...state,
        error: null,
        updateError: null,
        downloadError: null,
      };

    // --- Default ---
    default:
      return state;
  }
};

export default orderReducer;

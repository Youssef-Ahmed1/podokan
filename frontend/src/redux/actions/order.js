import axios from "axios";
import { server } from "../../server"; // Adjust path if needed
import { toast } from "react-toastify";

// --- Action Types ---
// Use a consistent naming convention (e.g., domain/actionStatus)
export const ORDER_ACTIONS = Object.freeze({
  // Create
  CREATE_REQUEST: "order/createRequest",
  CREATE_SUCCESS: "order/createSuccess",
  CREATE_FAIL: "order/createFail",
  CREATE_FINALLY: "order/createFinally", // Optional: for cleanup regardless of success/fail

  // Get User Orders
  GET_USER_REQUEST: "order/getUserRequest",
  GET_USER_SUCCESS: "order/getUserSuccess",
  GET_USER_FAIL: "order/getUserFail",
  GET_USER_FINALLY: "order/getUserFinally",

  // Get Shop Orders
  GET_SHOP_REQUEST: "order/getShopRequest",
  GET_SHOP_SUCCESS: "order/getShopSuccess",
  GET_SHOP_FAIL: "order/getShopFail",
  GET_SHOP_FINALLY: "order/getShopFinally",

  // Get Admin Orders (Paginated)
  GET_ADMIN_REQUEST: "order/getAdminRequest",
  GET_ADMIN_SUCCESS: "order/getAdminSuccess", // Payload includes pagination data
  GET_ADMIN_FAIL: "order/getAdminFail",
  GET_ADMIN_FINALLY: "order/getAdminFinally",

  // Get Single Order Detail
  GET_DETAIL_REQUEST: "order/getDetailRequest",
  GET_DETAIL_SUCCESS: "order/getDetailSuccess",
  GET_DETAIL_FAIL: "order/getDetailFail",
  GET_DETAIL_FINALLY: "order/getDetailFinally",

  // Admin Update Status
  ADMIN_UPDATE_STATUS_REQUEST: "order/adminUpdateStatusRequest",
  ADMIN_UPDATE_STATUS_SUCCESS: "order/adminUpdateStatusSuccess",
  ADMIN_UPDATE_STATUS_FAIL: "order/adminUpdateStatusFail",
  ADMIN_UPDATE_STATUS_FINALLY: "order/adminUpdateStatusFinally",

  // Seller Update Refund Status
  SELLER_UPDATE_REFUND_REQUEST: "order/sellerUpdateRefundRequest",
  SELLER_UPDATE_REFUND_SUCCESS: "order/sellerUpdateRefundSuccess",
  SELLER_UPDATE_REFUND_FAIL: "order/sellerUpdateRefundFail",
  SELLER_UPDATE_REFUND_FINALLY: "order/sellerUpdateRefundFinally",

  // Admin Download Design Data Prep
  DOWNLOAD_DESIGN_DATA_REQUEST: "order/downloadDesignDataRequest",
  DOWNLOAD_DESIGN_DATA_SUCCESS: "order/downloadDesignDataSuccess",
  DOWNLOAD_DESIGN_DATA_FAIL: "order/downloadDesignDataFail",
  DOWNLOAD_DESIGN_DATA_FINALLY: "order/downloadDesignDataFinally",

  // Clear Errors
  CLEAR_ERRORS: "order/clearErrors",
});

// --- API Request Handler Helper ---
const handleApiRequest = async ({
  dispatch,
  requestType,
  successType,
  failType,
  finallyType = null, // Optional finally action type
  apiCall, // The actual axios promise function
  successMessage = null, // Optional success toast message
  errorMessagePrefix = "Error", // Prefix for console error logs
}) => {
  dispatch({ type: requestType }); // Dispatch request action

  try {
    const { data } = await apiCall(); // Execute the API call

    // Check for backend's explicit success flag if it exists
    if (data.success === false) {
      // Use backend message if available, otherwise generic failure
      throw new Error(
        data.message || `API request indicated failure for ${requestType}`
      );
    }

    // Determine the payload: Could be order, orders, designData, or the whole data object for pagination
    // Prioritize specific keys, fall back to the full 'data' object
    const payload = data.order ?? data.orders ?? data.designData ?? data;

    dispatch({ type: successType, payload }); // Dispatch success action with payload

    if (successMessage) {
      toast.success(successMessage); // Show success toast if provided
    }

    return payload; // Return the payload for potential chaining (.then in components)
  } catch (error) {
    // --- Detailed Error Parsing ---
    let message = "An unexpected error occurred.";
    if (error.response) {
      // Server responded with a status code outside 2xx range
      message =
        error.response.data?.message ||
        `Server Error: ${error.response.status} ${error.response.statusText}`;
      // Handle specific common statuses
      if (error.response.status === 401)
        message = "Authentication failed. Please login again.";
      else if (error.response.status === 403)
        message = "Permission denied. You don't have access to this resource.";
      else if (error.response.status === 404) message = "Resource not found.";
      else if (error.response.status >= 500)
        message = `Server error (${error.response.status}). Please try again later.`;
    } else if (error.request) {
      // Request was made but no response received (network error, server down)
      message = "Network Error: Could not connect to the server.";
    } else {
      // Something happened setting up the request (programming error) or Error object thrown manually
      message = error.message || message;
    }

    console.error(
      `${errorMessagePrefix} (${requestType}):`,
      message,
      "\nFull Error:",
      error.response || error
    );
    dispatch({ type: failType, payload: message }); // Dispatch fail action with error message

    // Avoid duplicate toasts if Axios interceptor handles 401
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    throw error; // Re-throw the error so calling code's .catch block can run if needed
  } finally {
    // Dispatch finally action if provided (useful for turning off loading states)
    if (finallyType) dispatch({ type: finallyType });
  }
};

// --- Action Creators ---

// User: Create a new order
export const createOrder = (orderData) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.CREATE_REQUEST,
    successType: ORDER_ACTIONS.CREATE_SUCCESS,
    failType: ORDER_ACTIONS.CREATE_FAIL,
    finallyType: ORDER_ACTIONS.CREATE_FINALLY,
    apiCall: () =>
      axios.post(`${server}/order/create-order`, orderData, {
        withCredentials: true,
      }),
    successMessage: "Order placed successfully!",
    errorMessagePrefix: "Create Order Error",
  }); // Resolves with created orders array

// User: Get all orders for the logged-in user
export const getAllOrdersOfUser = () => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.GET_USER_REQUEST,
    successType: ORDER_ACTIONS.GET_USER_SUCCESS,
    failType: ORDER_ACTIONS.GET_USER_FAIL,
    finallyType: ORDER_ACTIONS.GET_USER_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/get-user-orders`, { withCredentials: true }),
    errorMessagePrefix: "Get User Orders Error",
  }); // Resolves with user's orders array

// Shop: Get all orders for the logged-in seller
export const getAllOrdersOfShop =
  () =>
  (
    dispatch // No ID needed, backend uses token
  ) =>
    handleApiRequest({
      dispatch,
      requestType: ORDER_ACTIONS.GET_SHOP_REQUEST,
      successType: ORDER_ACTIONS.GET_SHOP_SUCCESS,
      failType: ORDER_ACTIONS.GET_SHOP_FAIL,
      finallyType: ORDER_ACTIONS.GET_SHOP_FINALLY,
      apiCall: () =>
        axios.get(`${server}/order/get-seller-orders`, {
          withCredentials: true,
        }),
      errorMessagePrefix: "Get Seller Orders Error",
    }); // Resolves with seller's orders array (filtered cart)

// Admin: Get all orders (Paginated)
export const getAllOrdersOfAdmin =
  (page = 1, limit = 15) =>
  (dispatch) =>
    handleApiRequest({
      dispatch,
      requestType: ORDER_ACTIONS.GET_ADMIN_REQUEST,
      successType: ORDER_ACTIONS.GET_ADMIN_SUCCESS, // Reducer handles the { orders, totalOrders, ... } payload
      failType: ORDER_ACTIONS.GET_ADMIN_FAIL,
      finallyType: ORDER_ACTIONS.GET_ADMIN_FINALLY,
      apiCall: () =>
        axios.get(
          `${server}/order/admin/all-orders?page=${page}&limit=${limit}`,
          { withCredentials: true }
        ),
      errorMessagePrefix: "Get Admin Orders Error",
    }); // Resolves with the pagination data object

// User/Admin: Get single order details
export const getOrderDetails = (orderId) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.GET_DETAIL_REQUEST,
    successType: ORDER_ACTIONS.GET_DETAIL_SUCCESS,
    failType: ORDER_ACTIONS.GET_DETAIL_FAIL,
    finallyType: ORDER_ACTIONS.GET_DETAIL_FINALLY,
    // Use the generic endpoint; backend controller handles user/admin authorization
    apiCall: () =>
      axios.get(`${server}/order/get-order/${orderId}`, {
        withCredentials: true,
      }),
    errorMessagePrefix: "Get Order Details Error",
  }); // Resolves with the single order object

// Admin: Update order status
export const adminUpdateOrderStatus = (orderId, status) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST,
    successType: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS,
    failType: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FAIL,
    finallyType: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FINALLY,
    apiCall: () =>
      axios.put(
        `${server}/order/admin/update-status/${orderId}`,
        { status },
        { withCredentials: true }
      ),
    successMessage: `Order status updated to ${status}.`,
    errorMessagePrefix: "Admin Update Status Error",
  }).then((data) => data.order); // Resolve specifically with the updated order object

// Seller: Update refund status
export const sellerUpdateRefundStatus = (orderId, status) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST,
    successType: ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS,
    failType: ORDER_ACTIONS.SELLER_UPDATE_REFUND_FAIL,
    finallyType: ORDER_ACTIONS.SELLER_UPDATE_REFUND_FINALLY,
    apiCall: () =>
      axios.put(
        `${server}/order/accept-refund/${orderId}`,
        { status },
        { withCredentials: true }
      ),
    successMessage: `Refund status updated to ${status}.`,
    errorMessagePrefix: "Seller Refund Update Error",
  }).then((data) => data.order); // Resolve specifically with the updated order object

// Admin: Get data needed for design download package
export const adminGetDesignDataForDownload = (orderId, itemId) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_REQUEST,
    successType: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS,
    failType: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FAIL,
    finallyType: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/download-design/${orderId}/${itemId}`, {
        withCredentials: true,
      }),
    errorMessagePrefix: "Download Design Data Error",
  }).then((data) => data.designData); // Resolve specifically with the designData payload

// Clear Errors Action
export const clearErrors = () => (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
};

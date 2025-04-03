import axios from "axios";
import { server } from "../../server"; // Adjust path if needed
import { toast } from "react-toastify";

// Define action type constants
export const ORDER_ACTIONS = Object.freeze({
  CREATE_REQUEST: "o/crReq",
  CREATE_SUCCESS: "o/crSuc",
  CREATE_FAIL: "o/crFail",
  CREATE_FINALLY: "o/crFin",
  GET_USER_REQUEST: "o/guReq",
  GET_USER_SUCCESS: "o/guSuc",
  GET_USER_FAIL: "o/guFail",
  GET_USER_FINALLY: "o/guFin",
  GET_SHOP_REQUEST: "o/gsReq",
  GET_SHOP_SUCCESS: "o/gsSuc",
  GET_SHOP_FAIL: "o/gsFail",
  GET_SHOP_FINALLY: "o/gsFin",
  GET_ADMIN_REQUEST: "o/gaReq",
  GET_ADMIN_SUCCESS: "o/gaSuc",
  GET_ADMIN_FAIL: "o/gaFail",
  GET_ADMIN_FINALLY: "o/gaFin",
  GET_DETAIL_REQUEST: "o/gdReq",
  GET_DETAIL_SUCCESS: "o/gdSuc",
  GET_DETAIL_FAIL: "o/gdFail",
  GET_DETAIL_FINALLY: "o/gdFin",
  ADMIN_UPDATE_STATUS_REQUEST: "o/ausReq",
  ADMIN_UPDATE_STATUS_SUCCESS: "o/ausSuc",
  ADMIN_UPDATE_STATUS_FAIL: "o/ausFail",
  ADMIN_UPDATE_STATUS_FINALLY: "o/ausFin",
  SELLER_UPDATE_REFUND_REQUEST: "o/surReq",
  SELLER_UPDATE_REFUND_SUCCESS: "o/surSuc",
  SELLER_UPDATE_REFUND_FAIL: "o/surFail",
  SELLER_UPDATE_REFUND_FINALLY: "o/surFin",
  DOWNLOAD_DESIGN_DATA_REQUEST: "o/dddReq",
  DOWNLOAD_DESIGN_DATA_SUCCESS: "o/dddSuc",
  DOWNLOAD_DESIGN_DATA_FAIL: "o/dddFail",
  DOWNLOAD_DESIGN_DATA_FINALLY: "o/dddFin",
  CLEAR_ERRORS: "o/clrErr",
});

// Consistent API request handler
const handleApiRequest = async ({
  dispatch,
  requestType,
  successType,
  failType,
  finallyType,
  apiCall,
  successMessage = null,
  errorMessagePrefix = "Error",
}) => {
  dispatch({ type: requestType });
  try {
    const { data } = await apiCall(); // Execute the API call
    // Check backend success flag FIRST
    if (data.success === false) {
      // Use backend message if available, otherwise a generic failure message
      throw new Error(data.message || `API request failed for ${requestType}`);
    }
    // Extract payload based on expected response keys
    const payload = data.order ?? data.orders ?? data.designData ?? data; // Adjust if other keys are used
    dispatch({ type: successType, payload });
    if (successMessage) {
      toast.success(successMessage);
    }
    return payload; // Return data for potential chaining (.then)
  } catch (error) {
    let message = "An unexpected error occurred."; // Default message
    // Handle Axios errors specifically
    if (error.response) {
      // Server responded with non-2xx status
      message =
        error.response.data?.message ||
        `Server Error: ${error.response.status}`;
      // Special handling for common statuses (401 handled by interceptor mostly)
      if (error.response.status === 403) message = "Permission denied.";
      if (error.response.status === 404) message = "Resource not found.";
      // Add more specific status code handling if needed
    } else if (error.request) {
      // Request made, no response received
      message =
        "Network Error: Cannot reach server. Please check your connection.";
    } else {
      // Other errors (e.g., setting up request, JS error in handler)
      message = error.message || message;
    }
    console.error(
      `${errorMessagePrefix} (${requestType}):`,
      message,
      error.response || error
    );
    dispatch({ type: failType, payload: message });
    // Show toast unless it's an auth error likely handled by interceptor
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    throw error; // Re-throw so calling code knows it failed
  } finally {
    if (finallyType) dispatch({ type: finallyType });
  }
};

// --- Action Creators ---

// Create Order
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
  });

// Get All Orders for Current User
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
  });

// Get All Orders for Current Seller
export const getAllOrdersOfShop = () => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.GET_SHOP_REQUEST,
    successType: ORDER_ACTIONS.GET_SHOP_SUCCESS,
    failType: ORDER_ACTIONS.GET_SHOP_FAIL,
    finallyType: ORDER_ACTIONS.GET_SHOP_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/get-seller-orders`, { withCredentials: true }),
    errorMessagePrefix: "Get Seller Orders Error",
  });

// Get All Orders for Admin
export const getAllOrdersOfAdmin = () => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.GET_ADMIN_REQUEST,
    successType: ORDER_ACTIONS.GET_ADMIN_SUCCESS,
    failType: ORDER_ACTIONS.GET_ADMIN_FAIL,
    finallyType: ORDER_ACTIONS.GET_ADMIN_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/admin/all-orders`, { withCredentials: true }),
    errorMessagePrefix: "Get Admin Orders Error",
  });

// Get Single Order Details (used by multiple roles)
export const getOrderDetails = (orderId) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.GET_DETAIL_REQUEST,
    successType: ORDER_ACTIONS.GET_DETAIL_SUCCESS,
    failType: ORDER_ACTIONS.GET_DETAIL_FAIL,
    finallyType: ORDER_ACTIONS.GET_DETAIL_FINALLY,
    // Backend determines access based on credentials sent
    apiCall: () =>
      axios.get(`${server}/order/get-order/${orderId}`, {
        withCredentials: true,
      }),
    errorMessagePrefix: "Get Order Details Error",
  });

// Admin Update Order Status
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
  }).then((data) => data); // Resolve with the updated order object from payload

// Seller Update Refund Status
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
  }).then((data) => data); // Resolve with the updated order object from payload

// Admin Fetch Design Data for Download Utility
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
  }).then((data) => data); // Resolve with the designData payload specifically

// Clear Errors Action
export const clearErrors = () => (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
};
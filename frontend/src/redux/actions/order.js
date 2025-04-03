// frontend/src/redux/actions/order.js
import axios from "axios";
import { server } from "../../server"; // Adjust path if needed
import { toast } from "react-toastify";

// --- Action Types ---
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
  // Admin list actions updated for pagination payload
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

// --- API Request Handler ---
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
    if (data.success === false) {
      throw new Error(data.message || `API request failed for ${requestType}`);
    }
    // Extract payload based on expected response keys (order, orders, designData, or full data object for pagination)
    const payload = data.order ?? data.orders ?? data.designData ?? data;
    dispatch({ type: successType, payload });
    if (successMessage) {
      toast.success(successMessage);
    }
    return payload; // Return data for potential chaining (.then)
  } catch (error) {
    let message = "An unexpected error occurred.";
    if (error.response) {
      message =
        error.response.data?.message ||
        `Server Error: ${error.response.status}`;
      if (error.response.status === 401)
        message = "Authentication failed. Please login again.";
      else if (error.response.status === 403) message = "Permission denied.";
      else if (error.response.status === 404) message = "Resource not found.";
      else if (error.response.status === 502)
        message = "Server unavailable (Bad Gateway). Please try again later.";
    } else if (error.request) {
      message = "Network Error: Cannot reach server.";
    } else {
      message = error.message || message;
    }
    console.error(
      `${errorMessagePrefix} (${requestType}):`,
      message,
      error.response || error
    );
    dispatch({ type: failType, payload: message });
    // Avoid duplicate toast if interceptor handles it (e.g., for 401)
    if (error.response?.status !== 401) {
      toast.error(message);
    }
    throw error; // Re-throw error
  } finally {
    if (finallyType) dispatch({ type: finallyType });
  }
};

// --- Action Creators ---

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

// Modified for Pagination: Accepts page and limit
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
    });

export const getOrderDetails = (orderId) => (dispatch) =>
  handleApiRequest({
    dispatch,
    requestType: ORDER_ACTIONS.GET_DETAIL_REQUEST,
    successType: ORDER_ACTIONS.GET_DETAIL_SUCCESS,
    failType: ORDER_ACTIONS.GET_DETAIL_FAIL,
    finallyType: ORDER_ACTIONS.GET_DETAIL_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/get-order/${orderId}`, {
        withCredentials: true,
      }),
    errorMessagePrefix: "Get Order Details Error",
  });

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
  }).then((data) => data.order); // Resolve with updated order

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
  }).then((data) => data.order); // Resolve with updated order

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
  }).then((data) => data.designData); // Resolve with designData payload

export const clearErrors = () => (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
};

// File: frontend/src/redux/actions/order.js
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

export const ORDER_ACTIONS = Object.freeze({
  CREATE_REQUEST: "order/createRequest",
  CREATE_SUCCESS: "order/createSuccess",
  CREATE_FAIL: "order/createFail",
  CREATE_FINALLY: "order/createFinally",
  GET_USER_REQUEST: "order/getUserRequest",
  GET_USER_SUCCESS: "order/getUserSuccess",
  GET_USER_FAIL: "order/getUserFail",
  GET_USER_FINALLY: "order/getUserFinally",
  GET_SHOP_REQUEST: "order/getShopRequest",
  GET_SHOP_SUCCESS: "order/getShopSuccess",
  GET_SHOP_FAIL: "order/getShopFail",
  GET_SHOP_FINALLY: "order/getShopFinally",
  GET_ADMIN_REQUEST: "order/getAdminRequest",
  GET_ADMIN_SUCCESS: "order/getAdminSuccess",
  GET_ADMIN_FAIL: "order/getAdminFail",
  GET_ADMIN_FINALLY: "order/getAdminFinally",
  GET_DETAIL_REQUEST: "order/getDetailRequest",
  GET_DETAIL_SUCCESS: "order/getDetailSuccess",
  GET_DETAIL_FAIL: "order/getDetailFail",
  GET_DETAIL_FINALLY: "order/getDetailFinally",
  ADMIN_UPDATE_STATUS_REQUEST: "order/adminUpdateStatusRequest",
  ADMIN_UPDATE_STATUS_SUCCESS: "order/adminUpdateStatusSuccess",
  ADMIN_UPDATE_STATUS_FAIL: "order/adminUpdateStatusFail",
  ADMIN_UPDATE_STATUS_FINALLY: "order/adminUpdateStatusFinally",
  SELLER_UPDATE_REFUND_REQUEST: "order/sellerUpdateRefundRequest",
  SELLER_UPDATE_REFUND_SUCCESS: "order/sellerUpdateRefundSuccess",
  SELLER_UPDATE_REFUND_FAIL: "order/sellerUpdateRefundFail",
  SELLER_UPDATE_REFUND_FINALLY: "order/sellerUpdateRefundFinally",
  DOWNLOAD_DESIGN_DATA_REQUEST: "order/downloadDesignDataRequest",
  DOWNLOAD_DESIGN_DATA_SUCCESS: "order/downloadDesignDataSuccess",
  DOWNLOAD_DESIGN_DATA_FAIL: "order/downloadDesignDataFail",
  DOWNLOAD_DESIGN_DATA_FINALLY: "order/downloadDesignDataFinally",
  CLEAR_ERRORS: "order/clearErrors",
});

const handleApiRequest = async ({
  dispatch,
  requestType,
  successType,
  failType,
  finallyType = null,
  apiCall,
  successMessage = null,
  errorMessagePrefix = "Error",
}) => {
  dispatch({ type: requestType });
  try {
    const { data } = await apiCall();
    if (data.success === false)
      throw new Error(
        data.message || `API indicated failure for ${requestType}`
      );
    let payload;
    switch (successType) {
      case ORDER_ACTIONS.GET_DETAIL_SUCCESS:
      case ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS:
      case ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS:
        payload = data?.order;
        if (!payload?._id)
          throw new Error(`Invalid 'order' object in ${successType} response.`);
        break;
      case ORDER_ACTIONS.GET_USER_SUCCESS:
      case ORDER_ACTIONS.GET_SHOP_SUCCESS:
        payload = data?.orders;
        if (!Array.isArray(payload)) payload = [];
        break;
      case ORDER_ACTIONS.GET_ADMIN_SUCCESS:
        payload = data;
        if (!payload || !Array.isArray(payload.orders))
          throw new Error(`Invalid admin orders response for ${successType}.`);
        break;
      case ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS:
        payload = data?.designData;
        if (!payload || typeof payload !== "object")
          throw new Error(
            `Invalid 'designData' object in ${successType} response.`
          );
        break;
      case ORDER_ACTIONS.CREATE_SUCCESS:
        payload = data?.orders;
        if (!Array.isArray(payload))
          throw new Error(`Invalid 'orders' array in ${successType} response.`);
        break;
      default:
        payload = data;
    }
    dispatch({ type: successType, payload });
    if (successMessage) toast.success(successMessage);
    return payload;
  } catch (error) {
    let message = "Unexpected error.";
    let statusCode = null;
    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.message || `Server Error: ${statusCode}`;
      if (statusCode === 401) message = "Authentication failed.";
      else if (statusCode === 403) message = "Permission denied.";
      else if (statusCode === 404) message = "Resource not found.";
      else if (statusCode >= 500)
        message = `Server error (${statusCode}). Try again later.`;
    } else if (error.request) message = "Network Error. Check connection.";
    else message = error.message || message;
    console.error(
      `${errorMessagePrefix} (${requestType}):`,
      message,
      `Status: ${statusCode || "N/A"}`
    );
    dispatch({ type: failType, payload: message });
    if (statusCode !== 401 && statusCode !== 404) toast.error(message); // Avoid redundant toasts
    throw error;
  } finally {
    if (finallyType) dispatch({ type: finallyType });
  }
};

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
    successMessage: "Order placed!",
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
      axios.get(`${server}/order/get-user-orders?ts=${Date.now()}`, {
        withCredentials: true,
      }),
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
export const getAllOrdersOfAdmin =
  (page = 1, limit = 15) =>
  (dispatch) =>
    handleApiRequest({
      dispatch,
      requestType: ORDER_ACTIONS.GET_ADMIN_REQUEST,
      successType: ORDER_ACTIONS.GET_ADMIN_SUCCESS,
      failType: ORDER_ACTIONS.GET_ADMIN_FAIL,
      finallyType: ORDER_ACTIONS.GET_ADMIN_FINALLY,
      apiCall: () =>
        axios.get(
          `${server}/order/admin-all-orders?page=${page}&limit=${limit}`,
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
        `${server}/order/admin-update-status/${orderId}`,
        { status },
        { withCredentials: true }
      ),
    errorMessagePrefix: "Update Order Status Error",
  });
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
  });
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
  }).then((data) => data); // Return data
export const clearErrors = () => (dispatch) =>
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
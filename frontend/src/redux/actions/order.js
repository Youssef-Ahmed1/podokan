// backend/redux/actions/order.js

import axios from "axios";
import { server } from "../../server";
import { DesignDownloader } from '../../utils/designDownload';
// Constants for action types
export const ORDER_ACTIONS = {
  // Create Order
  CREATE_REQUEST: "orderCreateRequest",
  CREATE_SUCCESS: "orderCreateSuccess",
  CREATE_FAIL: "orderCreateFail",

  // Get User Orders
  GET_USER_REQUEST: "getAllOrdersUserRequest",
  GET_USER_SUCCESS: "getAllOrdersUserSuccess",
  GET_USER_FAIL: "getAllOrdersUserFailed",

  // Get Shop Orders
  GET_SHOP_REQUEST: "getAllOrdersShopRequest",
  GET_SHOP_SUCCESS: "getAllOrdersShopSuccess",
  GET_SHOP_FAIL: "getAllOrdersShopFailed",

  // Get Admin Orders
  GET_ADMIN_REQUEST: "adminAllOrdersRequest",
  GET_ADMIN_SUCCESS: "adminAllOrdersSuccess",
  GET_ADMIN_FAIL: "adminAllOrdersFail",

  // Update Order Status
  UPDATE_STATUS_REQUEST: "updateOrderStatusRequest",
  UPDATE_STATUS_SUCCESS: "updateOrderStatusSuccess",
  UPDATE_STATUS_FAIL: "updateOrderStatusFail",

  // Download Actions
  DOWNLOAD_SPECS_REQUEST: "downloadSpecsRequest",
  DOWNLOAD_SPECS_SUCCESS: "downloadSpecsSuccess",
  DOWNLOAD_SPECS_FAIL: "downloadSpecsFail",

  DOWNLOAD_DESIGN_REQUEST: "downloadDesignRequest",
  DOWNLOAD_DESIGN_SUCCESS: "downloadDesignSuccess",
  DOWNLOAD_DESIGN_FAIL: "downloadDesignFail",

  // Delivery Actions
  ASSIGN_DELIVERY_REQUEST: "assignDeliveryRequest",
  ASSIGN_DELIVERY_SUCCESS: "assignDeliverySuccess",
  ASSIGN_DELIVERY_FAIL: "assignDeliveryFail",

  UPDATE_DELIVERY_REQUEST: "updateDeliveryRequest",
  UPDATE_DELIVERY_SUCCESS: "updateDeliverySuccess",
  UPDATE_DELIVERY_FAIL: "updateDeliveryFail",

  // Refund Actions
  REFUND_REQUEST: "refundRequest",
  REFUND_SUCCESS: "refundSuccess",
  REFUND_FAIL: "refundFail",

  // Clear Errors
  CLEAR_ERRORS: "clearErrors"
};

// Create Order
export const createOrder = (orderData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.CREATE_REQUEST });

    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };
    const { data } = await axios.post(`${server}/order/create-order`, orderData, config);

    dispatch({ 
      type: ORDER_ACTIONS.CREATE_SUCCESS,
      payload: data.orders
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.CREATE_FAIL,
      payload: error.response?.data?.message || "Order creation failed"
    });
  }
};

// Get all orders for user
export const getAllOrdersOfUser = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_USER_REQUEST });

    const config = {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    };

    const { data } = await axios.get(`${server}/order/get-user-orders`, config);

    console.log("User orders fetch response:", data);

    dispatch({
      type: ORDER_ACTIONS.GET_USER_SUCCESS,
      payload: data.orders
    });
  } catch (error) {
    console.error("Error fetching user orders:", error.response?.data || error);
    dispatch({
      type: ORDER_ACTIONS.GET_USER_FAIL,
      payload: error.response?.data?.message || "Failed to fetch orders"
    });
  }
};


// Get all seller orders
export const getShopOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_SHOP_REQUEST });

    const { data } = await axios.get(`${server}/order/get-seller-orders`, {
      withCredentials: true,
    });

    console.log("Shop orders response:", data); // Debug log

    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_SUCCESS,
      payload: data.orders || [] // Ensure we always have an array
    });
  } catch (error) {
    console.error("Error fetching shop orders:", error); // Debug log
    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_FAIL,
      payload: error.response?.data?.message || "Failed to fetch shop orders"
    });
  }
};
// Get all orders for admin
export const getAllOrdersOfShop = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_SHOP_REQUEST });

    const config = {
      withCredentials: true,
      headers: {
        'seller-authorization': `Bearer ${localStorage.getItem('seller_token')}`
      }
    };

    const { data } = await axios.get(`${server}/order/get-seller-orders`, config);

    console.log("Shop orders fetch response:", data);

    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_SUCCESS,
      payload: data.orders
    });
  } catch (error) {
    console.error("Error fetching shop orders:", error.response?.data || error);
    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_FAIL,
      payload: error.response?.data?.message || "Failed to fetch orders"
    });
  }
};

// Get Admin Orders
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_ADMIN_REQUEST });

    const { data } = await axios.get(`${server}/order/admin/all-orders`, {
      withCredentials: true
    });

    console.log("Admin orders response:", data); // Debug log

    dispatch({
      type: ORDER_ACTIONS.GET_ADMIN_SUCCESS,
      payload: data.orders || [] // Ensure we always have an array
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error); // Debug log
    dispatch({
      type: ORDER_ACTIONS.GET_ADMIN_FAIL,
      payload: error.response?.data?.message || "Failed to fetch admin orders"
    });
  }
};
export const adminDownloadDesign = (orderId, itemId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST });

    const { data } = await axios.get(
      `${server}/order/admin/download-design/${orderId}/${itemId}`,
      {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    // Process the download using DesignDownloader
    await DesignDownloader.downloadSingleDesign({
      ...data.designData,
      _id: itemId,
      orderId: orderId
    });

    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS });
    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL,
      payload: error.response?.data?.message || "Download failed"
    });
    throw error;
  }
};

// Update order status as admin
export const adminUpdateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS_REQUEST });

    const { data } = await axios.put(
      `${server}/order/admin/update-status/${orderId}`,
      { status },
      {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );

    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
      payload: data.order
    });

    // Refresh admin orders
    dispatch(getAllOrdersOfAdmin());
    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
      payload: error.response?.data?.message || "Update failed"
    });
    throw error;
  }
};
// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS_REQUEST });

    const { data } = await axios.put(
      `${server}/order/admin/update-status/${orderId}`,
      { status },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
      payload: data.order
    });

    // Refresh orders
    dispatch(getAllOrdersOfAdmin());
    
    return data.success;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
      payload: error.response?.data?.message || "Failed to update status"
    });
    throw error;
  }
};


// Download specifications
export const downloadOrderSpecs = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST });

    const { data } = await axios.get(`${server}/order/download-specs/${orderId}`, {
      withCredentials: true,
      responseType: 'blob'
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `specs-${orderId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL,
      payload: error.response?.data?.message
    });
  }
};

// Download design
export const downloadDesign = (orderId, itemId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST });

    const { data } = await axios.get(`${server}/order/download-design/${orderId}/${itemId}`, {
      withCredentials: true,
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `design-${orderId}-${itemId}.png`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL,
      payload: error.response?.data?.message
    });
  }
};

// Assign delivery partner
export const assignDeliveryPartner = (orderId, deliveryData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.ASSIGN_DELIVERY_REQUEST });

    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };
    const { data } = await axios.post(
      `${server}/order/assign-delivery/${orderId}`,
      deliveryData,
      config
    );

    dispatch({
      type: ORDER_ACTIONS.ASSIGN_DELIVERY_SUCCESS,
      payload: data.order
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.ASSIGN_DELIVERY_FAIL,
      payload: error.response?.data?.message
    });
  }
};

// Update delivery status
export const updateDeliveryStatus = (orderId, statusData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.UPDATE_DELIVERY_REQUEST });

    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };
    const { data } = await axios.put(
      `${server}/order/update-delivery/${orderId}`,
      statusData,
      config
    );

    dispatch({
      type: ORDER_ACTIONS.UPDATE_DELIVERY_SUCCESS,
      payload: data.order
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.UPDATE_DELIVERY_FAIL,
      payload: error.response?.data?.message
    });
  }
};

// Request refund
export const requestRefund = (orderId, refundData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.REFUND_REQUEST });

    const config = { headers: { "Content-Type": "application/json" }, withCredentials: true };
    const { data } = await axios.post(
      `${server}/order/refund-request/${orderId}`,
      refundData,
      config
    );

    dispatch({
      type: ORDER_ACTIONS.REFUND_SUCCESS,
      payload: data
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.REFUND_FAIL,
      payload: error.response?.data?.message
    });
  }
};

// Clear Errors
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
};
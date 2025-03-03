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

    const { data } = await axios.get(`${server}/order/get-user-orders`, {
      withCredentials: true,
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    dispatch({
      type: ORDER_ACTIONS.GET_USER_SUCCESS,
      payload: data.orders,
    });
    return data;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.GET_USER_FAIL,
      payload: error.response?.data?.message || "Failed to fetch orders",
    });
    throw error;
  }
};




// Get all seller orders
export const getShopOrders = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_SHOP_REQUEST });

    // Get seller token from localStorage
    const token = localStorage.getItem("seller_token");

    if (!token) {
      throw new Error("Seller authentication required");
    }

    const { data } = await axios.get(`${server}/order/get-seller-orders`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Shop orders response:", data); // Debug log

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch shop orders");
    }

    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_SUCCESS,
      payload: data.orders || [], // Ensure we always have an array
    });

    return data;
  } catch (error) {
    console.error("Error fetching shop orders:", error); // Debug log
    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_FAIL,
      payload:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch shop orders",
    });

    throw error;
  }
};

// Get all orders for admin
// In redux/actions/order.js
export const getAllOrdersOfShop = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_SHOP_REQUEST });

    // Get seller token from localStorage
    const token = localStorage.getItem("seller_token");

    if (!token) {
      throw new Error("Seller authentication required");
    }

    const { data } = await axios.get(`${server}/order/get-seller-orders`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Shop orders response:", data);

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch shop orders");
    }

    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_SUCCESS,
      payload: data.orders || [],
    });

    return data;
  } catch (error) {
    console.error("Error in getAllOrdersOfShop:", error);
    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_FAIL,
      payload:
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch shop orders",
    });

    throw error;
  }
};
// Get Admin Orders
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.GET_ADMIN_REQUEST });

    // Add auth token logging
    const token = localStorage.getItem("token");
    console.log(
      "Using auth token for admin request:",
      token ? "Token present" : "No token"
    );

    const { data } = await axios.get(`${server}/order/admin/all-orders`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Admin orders response:", data);

    dispatch({
      type: ORDER_ACTIONS.GET_ADMIN_SUCCESS,
      payload: data.orders || [],
    });

    return data.orders;
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    dispatch({
      type: ORDER_ACTIONS.GET_ADMIN_FAIL,
      payload: error.response?.data?.message || "Failed to fetch admin orders",
    });

    // Special handling for auth errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      toast.error("Authentication error. Please log in again as admin.");
    }

    throw error;
  }
};

export const adminDownloadDesign = (orderId, itemId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST });

    const { data } = await axios.get(
      `${server}/order/download-design/${orderId}/${itemId}`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    if (!data.success || !data.designData) {
      throw new Error("Failed to get design data");
    }

    await DesignDownloader.downloadSingleDesign(data.designData);

    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS });
    return true;
  } catch (error) {
    console.error("Download error:", error);
    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL,
      payload: error.response?.data?.message || error.message,
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      }
    );

    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
      payload: data.order,
    });

    // Refresh admin orders
    dispatch(getAllOrdersOfAdmin());
    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
      payload: error.response?.data?.message || "Update failed",
    });
    throw error;
  }
};
// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS_REQUEST });

    const { data } = await axios.put(
      `${server}/order/update-status/${orderId}`,
      { status },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
      payload: data.order,
    });

    // Refresh orders list
    dispatch(getAllOrdersOfAdmin());
    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
      payload: error.response?.data?.message || "Failed to update status",
    });
    throw error;
  }
};

// Download specifications
export const downloadOrderSpecs = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST });

    const { data } = await axios.get(
      `${server}/order/download-specs/${orderId}`,
      {
        withCredentials: true,
        responseType: "blob",
      }
    );

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `specs-${orderId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS,
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// In your client-side designDownload.js or similar file
export const downloadDesign = async (orderId, itemId) => {
  try {
    // Ensure we're using the admin token
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_URL}/order/download-design/${orderId}/${itemId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // Parse error response
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to download design");
    }

    const data = await response.json();
    return data.designData;
  } catch (error) {
    console.error("Error downloading design:", error);
    throw error;
  }
};

// Assign delivery partner
export const assignDeliveryPartner =
  (orderId, deliveryData) => async (dispatch) => {
    try {
      dispatch({ type: ORDER_ACTIONS.ASSIGN_DELIVERY_REQUEST });

      const config = {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      };
      const { data } = await axios.post(
        `${server}/order/assign-delivery/${orderId}`,
        deliveryData,
        config
      );

      dispatch({
        type: ORDER_ACTIONS.ASSIGN_DELIVERY_SUCCESS,
        payload: data.order,
      });
    } catch (error) {
      dispatch({
        type: ORDER_ACTIONS.ASSIGN_DELIVERY_FAIL,
        payload: error.response?.data?.message,
      });
    }
  };

// Update delivery status
export const updateDeliveryStatus =
  (orderId, statusData) => async (dispatch) => {
    try {
      dispatch({ type: ORDER_ACTIONS.UPDATE_DELIVERY_REQUEST });

      const config = {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      };
      const { data } = await axios.put(
        `${server}/order/update-delivery/${orderId}`,
        statusData,
        config
      );

      dispatch({
        type: ORDER_ACTIONS.UPDATE_DELIVERY_SUCCESS,
        payload: data.order,
      });
    } catch (error) {
      dispatch({
        type: ORDER_ACTIONS.UPDATE_DELIVERY_FAIL,
        payload: error.response?.data?.message,
      });
    }
  };

// Request refund
export const requestRefund = (orderId, refundData) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.REFUND_REQUEST });

    const config = {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    };
    const { data } = await axios.post(
      `${server}/order/refund-request/${orderId}`,
      refundData,
      config
    );

    dispatch({
      type: ORDER_ACTIONS.REFUND_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.REFUND_FAIL,
      payload: error.response?.data?.message,
    });
  }
};

// Clear Errors
export const clearErrors = () => async (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
};

/**
 * @file Redux order actions
 * @description Handles all order-related Redux actions for the application
 */

import axios from "axios";
import { server } from "../../server";
import { DesignDownloader } from "../../utils/designDownload";
import { toast } from "react-toastify";

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
  CLEAR_ERRORS: "clearErrors",
};

/**
 * Helper function for API requests with proper error handling
 * @param {Function} dispatch - Redux dispatch function
 * @param {string} requestType - Action type for request start
 * @param {string} successType - Action type for success
 * @param {string} failType - Action type for failure
 * @param {Function} apiCall - Async function that makes the API call
 * @param {Function} successCallback - Optional callback on success
 * @param {boolean} throwError - Whether to rethrow the error
 * @returns {Promise} - Result of the API call
 */
const handleApiRequest = async (
  dispatch,
  requestType,
  successType,
  failType,
  apiCall,
  successCallback,
  throwError = true
) => {
  dispatch({ type: requestType });

  try {
    const result = await apiCall();

    dispatch({
      type: successType,
      payload: result.data?.payload || result.data || result,
    });

    if (successCallback) {
      successCallback(result);
    }

    return result;
  } catch (error) {
    const errorMessage =
      error.response?.data?.message || error.message || `Request failed`;

    dispatch({
      type: failType,
      payload: errorMessage,
    });

    // Optional toast notification
    if (error.response?.status === 401) {
      toast.error("Authentication failed. Please login again.");
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action.");
    } else if (error.response?.status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    if (throwError) {
      throw error;
    }
  }
};

/**
 * Get authentication headers based on token type
 * @param {string} tokenType - Type of token to use ('token' or 'seller_token')
 * @returns {Object} - Headers object with authorization
 */
const getAuthHeaders = (tokenType = "token") => {
  const token = localStorage.getItem(tokenType);
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

// Create Order
export const createOrder = (orderData) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.CREATE_REQUEST,
    ORDER_ACTIONS.CREATE_SUCCESS,
    ORDER_ACTIONS.CREATE_FAIL,
    async () => {
      const { data } = await axios.post(
        `${server}/order/create-order`,
        orderData,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      return data.orders;
    }
  );
};

// Get all orders for user
export const getAllOrdersOfUser = () => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.GET_USER_REQUEST,
    ORDER_ACTIONS.GET_USER_SUCCESS,
    ORDER_ACTIONS.GET_USER_FAIL,
    async () => {
      const { data } = await axios.get(`${server}/order/get-user-orders`, {
        withCredentials: true,
        headers: getAuthHeaders(),
      });
      return data;
    }
  );
};

// Get all seller orders
export const getShopOrders = () => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.GET_SHOP_REQUEST,
    ORDER_ACTIONS.GET_SHOP_SUCCESS,
    ORDER_ACTIONS.GET_SHOP_FAIL,
    async () => {
      // Validate seller token exists
      const token = localStorage.getItem("seller_token");
      if (!token) {
        throw new Error("Seller authentication required");
      }

      const { data } = await axios.get(`${server}/order/get-seller-orders`, {
        withCredentials: true,
        headers: getAuthHeaders("seller_token"),
      });

      console.log("Shop orders response:", data);

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch shop orders");
      }

      return data.orders || [];
    }
  );
};

// Get all orders for admin
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.GET_ADMIN_REQUEST,
    ORDER_ACTIONS.GET_ADMIN_SUCCESS,
    ORDER_ACTIONS.GET_ADMIN_FAIL,
    async () => {
      // Add auth token logging
      const token = localStorage.getItem("token");
      console.log(
        "Using auth token for admin request:",
        token ? "Token present" : "No token"
      );

      const { data } = await axios.get(`${server}/order/admin/all-orders`, {
        withCredentials: true,
        headers: getAuthHeaders(),
      });

      console.log("Admin orders response:", data);
      return data.orders || [];
    }
  );
};

// Correctly implemented frontend-only download design action
export const adminDownloadDesign = (orderId, itemId) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST,
    ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS,
    ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL,
    async () => {
      // Make API call to get design URL
      const { data } = await axios.get(
        `${server}/order/download-design/${orderId}/${itemId}`,
        {
          withCredentials: true,
          headers: getAuthHeaders(),
        }
      );

      if (!data.success || !data.designUrl) {
        throw new Error("Design URL not available");
      }

      // Frontend-only: Use the utility to download design from the URL
      await DesignDownloader.downloadSingleDesign({
        url: data.designUrl,
        name: `design-${itemId}.png`,
      });

      return true;
    }
  );
};
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
// Update order status as admin
export const adminUpdateOrderStatus = (orderId, status) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.UPDATE_STATUS_REQUEST,
    ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
    ORDER_ACTIONS.UPDATE_STATUS_FAIL,
    async () => {
      const { data } = await axios.put(
        `${server}/order/admin/update-status/${orderId}`,
        { status },
        {
          withCredentials: true,
          headers: getAuthHeaders(),
        }
      );

      // Refresh admin orders after successful update
      if (data.success) {
        dispatch(getAllOrdersOfAdmin());
      }

      return data.order;
    }
  );
};

// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.UPDATE_STATUS_REQUEST,
    ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
    ORDER_ACTIONS.UPDATE_STATUS_FAIL,
    async () => {
      const { data } = await axios.put(
        `${server}/order/update-status/${orderId}`,
        { status },
        {
          withCredentials: true,
          headers: getAuthHeaders(),
        }
      );

      // Refresh orders after successful update
      if (data.success) {
        dispatch(getAllOrdersOfAdmin());
      }

      return data.order;
    }
  );
};

// Download specifications
export const downloadOrderSpecs = (orderId) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST,
    ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS,
    ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL,
    async () => {
      const { data } = await axios.get(
        `${server}/order/download-specs/${orderId}`,
        {
          withCredentials: true,
          responseType: "blob",
          headers: getAuthHeaders(),
        }
      );

      // Create blob link to download - this is frontend code
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `specs-${orderId}.csv`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      link.remove();

      return true;
    }
  );
};

// Assign delivery partner
export const assignDeliveryPartner =
  (orderId, deliveryData) => async (dispatch) => {
    return handleApiRequest(
      dispatch,
      ORDER_ACTIONS.ASSIGN_DELIVERY_REQUEST,
      ORDER_ACTIONS.ASSIGN_DELIVERY_SUCCESS,
      ORDER_ACTIONS.ASSIGN_DELIVERY_FAIL,
      async () => {
        const { data } = await axios.post(
          `${server}/order/assign-delivery/${orderId}`,
          deliveryData,
          {
            headers: getAuthHeaders(),
            withCredentials: true,
          }
        );

        return data.order;
      }
    );
  };

// Update delivery status
export const updateDeliveryStatus =
  (orderId, statusData) => async (dispatch) => {
    return handleApiRequest(
      dispatch,
      ORDER_ACTIONS.UPDATE_DELIVERY_REQUEST,
      ORDER_ACTIONS.UPDATE_DELIVERY_SUCCESS,
      ORDER_ACTIONS.UPDATE_DELIVERY_FAIL,
      async () => {
        const { data } = await axios.put(
          `${server}/order/update-delivery/${orderId}`,
          statusData,
          {
            headers: getAuthHeaders(),
            withCredentials: true,
          }
        );

        return data.order;
      }
    );
  };

// Request refund
export const requestRefund = (orderId, refundData) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.REFUND_REQUEST,
    ORDER_ACTIONS.REFUND_SUCCESS,
    ORDER_ACTIONS.REFUND_FAIL,
    async () => {
      const { data } = await axios.post(
        `${server}/order/refund-request/${orderId}`,
        refundData,
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        }
      );

      return data;
    }
  );
};

// Clear Errors
export const clearErrors = () => ({
  type: ORDER_ACTIONS.CLEAR_ERRORS,
});

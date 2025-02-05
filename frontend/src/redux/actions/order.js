// orderActions.js
import axios from "axios";
import { server } from "../../server";

// Get user orders
export const getAllOrdersOfUser = (userId) => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersUserRequest" });

    const { data } = await axios.get(
      `${server}/order/get-all-orders/${userId}`,
      { 
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    dispatch({
      type: "getAllOrdersUserSuccess",
      payload: data.orders,
    });

    return data.orders;
  } catch (error) {
    dispatch({
      type: "getAllOrdersUserFailed",
      payload: error.response?.data?.message || "Error fetching orders",
    });
    throw error;
  }
};

// Get shop orders
export const getAllOrdersOfShop = (shopId) => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersShopRequest" });

    const { data } = await axios.get(
      `${server}/order/get-seller-orders/${shopId}`,
      {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Shop-Authorization': `Bearer ${localStorage.getItem('seller_token')}`
        }
      }
    );

    dispatch({
      type: "getAllOrdersShopSuccess",
      payload: data.orders
    });
  } catch (error) {
    dispatch({
      type: "getAllOrdersShopFailed",
      payload: error.response?.data?.message || "Error fetching shop orders",
    });
  }
};
export const ORDER_ACTIONS = {
  // Admin Orders
  ADMIN_ORDERS_REQUEST: 'ADMIN_ORDERS_REQUEST',
  ADMIN_ORDERS_SUCCESS: 'ADMIN_ORDERS_SUCCESS',
  ADMIN_ORDERS_FAIL: 'ADMIN_ORDERS_FAIL',
  
  // Status Updates
  UPDATE_STATUS_REQUEST: 'UPDATE_STATUS_REQUEST',
  UPDATE_STATUS_SUCCESS: 'UPDATE_STATUS_SUCCESS',
  UPDATE_STATUS_FAIL: 'UPDATE_STATUS_FAIL',
  
  // Design Downloads
  DESIGN_DOWNLOAD_REQUEST: 'DESIGN_DOWNLOAD_REQUEST',
  DESIGN_DOWNLOAD_SUCCESS: 'DESIGN_DOWNLOAD_SUCCESS',
  DESIGN_DOWNLOAD_FAIL: 'DESIGN_DOWNLOAD_FAIL',
  
  // Clear Errors
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};
// Get admin orders
export const getAllOrdersOfAdmin = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.ADMIN_ORDERS_REQUEST });

    // Build query string from filters
    const queryParams = new URLSearchParams({
      page: filters.page || 1,
      limit: filters.limit || 10,
      status: filters.status || '',
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      sort: filters.sort || '-createdAt'
    }).toString();

    const { data } = await axios.get(
      `${server}/order/admin-all-orders?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true
      }
    );

    dispatch({
      type: ORDER_ACTIONS.ADMIN_ORDERS_SUCCESS,
      payload: {
        orders: data.orders,
        totalAmount: data.totalAmount,
        ordersCount: data.ordersCount,
        totalPages: data.totalPages,
        currentPage: data.currentPage
      }
    });

    return data;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.ADMIN_ORDERS_FAIL,
      payload: error.response?.data?.message || "Error fetching admin orders"
    });
    throw error;
  }
};

// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS_REQUEST });

    const { data } = await axios.put(
      `${server}/order/update-order-status/${orderId}`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true
      }
    );

    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
      payload: data.order
    });

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource(`${server}/order/status-updates`);
    
    eventSource.onmessage = (event) => {
      const updateData = JSON.parse(event.data);
      if (updateData.orderId === orderId) {
        dispatch({
          type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
          payload: updateData
        });
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return data.order;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
      payload: error.response?.data?.message || "Error updating order status"
    });
    throw error;
  }
};
export const downloadOrderDesign = (orderId, itemId, type = 'single') => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DESIGN_DOWNLOAD_REQUEST });

    const response = await axios.get(
      `${server}/order/download-design/${orderId}/${itemId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        responseType: 'blob',
        withCredentials: true
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `design_${orderId}_${itemId}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch({
      type: ORDER_ACTIONS.DESIGN_DOWNLOAD_SUCCESS
    });

    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.DESIGN_DOWNLOAD_FAIL,
      payload: error.response?.data?.message || "Error downloading design"
    });
    throw error;
  }
};

// Bulk download designs
export const bulkDownloadDesigns = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.DESIGN_DOWNLOAD_REQUEST });

    const response = await axios.get(
      `${server}/order/bulk-download-designs/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        responseType: 'blob',
        withCredentials: true
      }
    );

    // Create download link for bulk zip
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `order_${orderId}_designs.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch({
      type: ORDER_ACTIONS.DESIGN_DOWNLOAD_SUCCESS
    });

    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.DESIGN_DOWNLOAD_FAIL,
      payload: error.response?.data?.message || "Error downloading designs"
    });
    throw error;
  }
};

// Get order details with designs
export const getOrderDetails = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.ADMIN_ORDERS_REQUEST });

    const { data } = await axios.get(
      `${server}/order/admin-order/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true
      }
    );

    dispatch({
      type: ORDER_ACTIONS.ADMIN_ORDERS_SUCCESS,
      payload: {
        orders: [data.order],
        totalAmount: data.order.totalPrice,
        ordersCount: 1,
        currentPage: 1,
        totalPages: 1
      }
    });

    return data.order;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.ADMIN_ORDERS_FAIL,
      payload: error.response?.data?.message || "Error fetching order details"
    });
    throw error;
  }
};

// Clear errors
export const clearOrderErrors = () => ({
  type: ORDER_ACTIONS.CLEAR_ERRORS
});

// Setup SSE listener for real-time updates
export const setupSSEListener = () => (dispatch) => {
  const eventSource = new EventSource(`${server}/order/status-updates`);

  eventSource.onmessage = (event) => {
    const updateData = JSON.parse(event.data);
    dispatch({
      type: ORDER_ACTIONS.UPDATE_STATUS_SUCCESS,
      payload: updateData
    });
  };

  eventSource.onerror = () => {
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
};

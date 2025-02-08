import axios from "axios";
import { server } from "../../server";

// get all orders of user
export const getAllOrdersOfUser = (userId) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllOrdersUserRequest",
    });

    const { data } = await axios.get(
      `${server}/order/get-all-orders/${userId}`,
<<<<<<< HEAD
      { 
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
=======
      {
        withCredentials: true,
>>>>>>> parent of bb3e5595 (save)
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
<<<<<<< HEAD
      payload: error.response?.data?.message || "Error fetching orders",
=======
      payload: error.response.data.message,
>>>>>>> parent of bb3e5595 (save)
    });
    throw error;
  }
};

// get all orders of seller  if it disappeared it will cause an error
// that the seller won't be able to see the order that are is 
export const getAllOrdersOfShop = (shopId) => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersShopRequest" });

    const { data } = await axios.get(
      `${server}/order/get-seller-orders/${shopId}`,
      {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Seller-Authorization': `Bearer ${localStorage.getItem('seller_token')}`
        }
      }
    );

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    dispatch({
      type: "getAllOrdersShopSuccess",
      payload: data.orders
    });
  } catch (error) {
    console.error('Shop orders fetch error:', error);
    dispatch({
      type: "getAllOrdersShopFailed",
      payload: error.response?.data?.message || error.message || "Failed to fetch orders"
    });
  }
};
<<<<<<< HEAD
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
    ADMIN_FILTER_UPDATE: 'ADMIN_FILTER_UPDATE',
  ADMIN_RESET_FILTERS: 'ADMIN_RESET_FILTERS',
  ADMIN_BULK_ACTION_REQUEST: 'ADMIN_BULK_ACTION_REQUEST',
  ADMIN_BULK_ACTION_SUCCESS: 'ADMIN_BULK_ACTION_SUCCESS',
  ADMIN_BULK_ACTION_FAIL: 'ADMIN_BULK_ACTION_FAIL',
  ADMIN_EXPORT_REQUEST: 'ADMIN_EXPORT_REQUEST',
  ADMIN_EXPORT_SUCCESS: 'ADMIN_EXPORT_SUCCESS',
  ADMIN_EXPORT_FAIL: 'ADMIN_EXPORT_FAIL',
  CLEAR_SUCCESS: 'CLEAR_SUCCESS',
  CLEAR_ERRORS: 'CLEAR_ERRORS'
};
// Get admin orders
export const getAllOrdersOfAdmin = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.ADMIN_ORDERS_REQUEST });
=======

// get all orders of Admin
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersOfAdminRequest" });
>>>>>>> parent of bb3e5595 (save)

    // Add token validation check
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token found");
    }

    // Add debug logging
    console.log("Fetching admin orders with token:", token);

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
          Authorization: `Bearer ${token}`
        },
        withCredentials: true
      }
    );

    // Debug logging
    console.log("Admin orders received:", data);

    if (!data.orders) {
      throw new Error("No orders data received from server");
    }

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    dispatch({
<<<<<<< HEAD
      type: ORDER_ACTIONS.ADMIN_ORDERS_SUCCESS,
=======
      type: "getAllOrdersOfAdminSuccess",
>>>>>>> parent of bb3e5595 (save)
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
<<<<<<< HEAD
    console.error("Admin orders fetch error:", error);
    dispatch({
      type: ORDER_ACTIONS.ADMIN_ORDERS_FAIL,
      payload: error.response?.data?.message || error.message || "Error fetching admin orders"
=======
    console.error('Admin orders fetch error:', error);
    dispatch({
      type: "getAllOrdersOfAdminFailed",
      payload: error.response?.data?.message || error.message || "Failed to fetch orders"
>>>>>>> parent of bb3e5595 (save)
    });
    throw error;
  }
};
export const clearOrderSuccess = () => ({
  type: ORDER_ACTIONS.CLEAR_SUCCESS
});

<<<<<<< HEAD
export const updateAdminFilters = (filters) => ({
  type: ORDER_ACTIONS.ADMIN_FILTER_UPDATE,
  payload: filters
});

export const resetAdminFilters = () => ({
  type: ORDER_ACTIONS.ADMIN_RESET_FILTERS
});

export const bulkUpdateOrders = (orderIds, action) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.ADMIN_BULK_ACTION_REQUEST });

    const { data } = await axios.post(
      `${server}/order/admin-bulk-action`,
      { orderIds, action },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        withCredentials: true
      }
    );

    dispatch({
      type: ORDER_ACTIONS.ADMIN_BULK_ACTION_SUCCESS,
      payload: data.orders
    });

    return data.orders;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.ADMIN_BULK_ACTION_FAIL,
      payload: error.response?.data?.message || "Bulk action failed"
    });
    throw error;
  }
};
export const exportOrders = (filters = {}) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.ADMIN_EXPORT_REQUEST });

    const queryParams = new URLSearchParams({
      status: filters.status || '',
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      format: filters.format || 'csv'
    }).toString();

    const response = await axios.get(
      `${server}/order/admin-export-orders?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        responseType: 'blob',
        withCredentials: true
      }
    );

    // Create and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = `orders_export_${new Date().toISOString().split('T')[0]}.${filters.format || 'csv'}`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch({
      type: ORDER_ACTIONS.ADMIN_EXPORT_SUCCESS
    });

    return true;
  } catch (error) {
    dispatch({
      type: ORDER_ACTIONS.ADMIN_EXPORT_FAIL,
      payload: error.response?.data?.message || "Export failed"
    });
    throw error;
  }
};
// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: ORDER_ACTIONS.UPDATE_STATUS_REQUEST });
=======
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({
      type: "updateOrderStatusRequest",
    });
>>>>>>> parent of bb3e5595 (save)

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
<<<<<<< HEAD
      type: ORDER_ACTIONS.UPDATE_STATUS_FAIL,
      payload: error.response?.data?.message || "Error updating order status"
=======
      type: "updateOrderStatusFailed",
      payload: error.response.data.message,
>>>>>>> parent of bb3e5595 (save)
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
<<<<<<< HEAD
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
=======
};
>>>>>>> parent of bb3e5595 (save)

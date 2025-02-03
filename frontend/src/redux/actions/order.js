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

// Get admin orders
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersAdminRequest" });

    const { data } = await axios.get(`${server}/order/admin-all-orders`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      withCredentials: true
    });

    dispatch({
      type: "getAllOrdersAdminSuccess",
      payload: {
        orders: data.orders || [],
        totalAmount: data.totalAmount || 0,
        ordersCount: data.ordersCount || 0
      }
    });
  } catch (error) {
    dispatch({
      type: "getAllOrdersAdminFailed",
      payload: error.response?.data?.message || "Error fetching admin orders"
    });
  }
};

// Update order status
export const updateOrderStatus = (orderId, status) => async (dispatch) => {
  try {
    dispatch({ type: "updateOrderStatusRequest" });

    const { data } = await axios.put(
      `${server}/order/update-order-status/${orderId}`,
      { status },
      { withCredentials: true }
    );

    dispatch({
      type: "updateOrderStatusSuccess",
      payload: data.order,
    });
  } catch (error) {
    dispatch({
      type: "updateOrderStatusFailed",
      payload: error.response?.data?.message || "Error updating order status",
    });
  }
};

export const getOrderDetails = (orderId) => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersUserRequest" });

    const { data } = await axios.get(
      `${server}/order/user-order/${orderId}`,
      { 
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    dispatch({
      type: "getAllOrdersUserSuccess",
      payload: [data.order],
    });

    return data.order;
  } catch (error) {
    dispatch({
      type: "getAllOrdersUserFailed",
      payload: error.response?.data?.message || "Error fetching order details",
    });
    throw error;
  }
};
// Clear order errors
export const clearOrderErrors = () => (dispatch) => {
  dispatch({ type: "clearOrderErrors" });
};
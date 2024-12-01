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
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "getAllOrdersUserSuccess",
      payload: data.orders,
    });
  } catch (error) {
    dispatch({
      type: "getAllOrdersUserFailed",
      payload: error.response.data.message,
    });
  }
};

// get all orders of seller
export const getAllOrdersOfShop = (shopId) => async (dispatch) => {
  try {
    dispatch({
      type: "getAllOrdersShopRequest",
    });

    const { data } = await axios.get(
      `${server}/order/get-seller-all-orders/${shopId}`,
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "getAllOrdersShopSuccess",
      payload: data.orders,
    });
  } catch (error) {
    dispatch({
      type: "getAllOrdersShopFailed",
      payload: error.response.data.message,
    });
  }
};

// get all orders of Admin
// actions/order.js
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersOfAdminRequest" });

    const config = {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    };

    const { data } = await axios.get(
      `${server}/order/admin-all-orders`, 
      config
    );

    dispatch({
      type: "getAllOrdersOfAdminSuccess",
      payload: data
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    dispatch({
      type: "getAllOrdersOfAdminFailed",
      payload: error.response?.data?.message || "Failed to fetch orders"
    });
  }
};
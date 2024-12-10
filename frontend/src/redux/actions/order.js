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

    dispatch({
      type: "getAllOrdersShopSuccess",
      payload: data.orders || []
    });
  } catch (error) {
    console.error('Shop orders fetch error:', error);
    dispatch({
      type: "getAllOrdersShopFailed",
      payload: error.response?.data?.message || "Failed to fetch orders"
    });
  }
};
// get all orders of Admin
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllOrdersOfAdminRequest" });

    const { data } = await axios.get(`${server}/order/admin-all-orders`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      },
      withCredentials: true
    });

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch orders');
    }

    dispatch({
      type: "getAllOrdersOfAdminSuccess",
      payload: {
        orders: data.orders || [],
        totalAmount: data.totalAmount || 0,
        ordersCount: data.ordersCount || 0
      }
    });
  } catch (error) {
    console.error('Admin orders fetch error:', error);
    dispatch({
      type: "getAllOrdersOfAdminFailed",
      payload: error.response?.data?.message || error.message || "Failed to fetch orders"
    });
  }
};
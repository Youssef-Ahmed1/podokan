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
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  try {
    dispatch({ type: "adminAllOrdersRequest" });

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      withCredentials: true,
    };

    const { data } = await axios.get(
      `${server}/order/admin-all-orders`,
      config
    );

    dispatch({
      type: "adminAllOrdersSuccess",
      payload: {
        orders: data.orders,
        totalAmount: data.totalAmount,
        ordersCount: data.ordersCount,
      },
    });
  } catch (error) {
    dispatch({
      type: "adminAllOrdersFailed",
      payload: error.response?.data?.message || "Failed to fetch orders",
    });
  }
};
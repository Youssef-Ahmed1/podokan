import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
// get all sellers --- admin
export const getAllSellers = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllSellersRequest" });
    const { data } = await axios.get(`${server}shop/admin-all-sellers`, {
      withCredentials: true,
    });
    dispatch({ type: "getAllSellersSuccess", payload: data.sellers });
  } catch (error) {
    dispatch({
      type: "getAllSellersFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const loginSeller = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: "SellerLoginRequest" });

    const { data } = await axios.post(`${server}/shop/login-shop`, {
      email,
      password
    });

    localStorage.setItem('seller_token', data.token);
    axios.defaults.headers['Seller-Authorization'] = `Bearer ${data.token}`;

    dispatch({ 
      type: "SellerLoginSuccess",
      payload: data.seller
    });
  } catch (error) {
    dispatch({
      type: "SellerLoginFail",
      payload: error.response?.data?.message || "Login failed"
    });
  }
};

export const logoutSeller = () => async (dispatch) => {
  try {
    localStorage.removeItem('seller_token');
    delete axios.defaults.headers['Seller-Authorization'];
    
    await axios.get(`${server}/shop/logout`);
    
    dispatch({ type: "SellerLogoutSuccess" });
  } catch (error) {
    dispatch({
      type: "SellerLogoutFail",
      payload: error.response?.data?.message || "Logout failed"
    });
  }
};
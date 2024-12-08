import axios from "axios";
import { server  } from "../../server";
import { toast } from "react-toastify";
export const getAllSellers = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllSellersRequest" });

    const config = {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      withCredentials: true,
    };

    const { data } = await axios.get(
      `${server}/shop/admin-all-sellers`,
      config
    );

    dispatch({
      type: "getAllSellersSuccess",
      payload: {
        sellers: data.sellers,
        sellersCount: data.sellersCount,
      },
    });
  } catch (error) {
    dispatch({
      type: "getAllSellersFailed",
      payload: error.response?.data?.message || "Failed to fetch sellers",
    });
  }
};


export const loginSeller = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: "SellerLoginRequest" });

    const { data } = await axios.post(`${server}/shop/login-shop`, {
      email,
      password
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (data.success && data.token) {
      localStorage.setItem('seller_token', data.token);
      
      // Set the token in headers for future requests
      axios.defaults.headers.common['Seller-Authorization'] = `Bearer ${data.token}`;
    }

    dispatch({ 
      type: "SellerLoginSuccess",
      payload: data.seller
    });
  } catch (error) {
    console.error('Seller login error:', error);
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
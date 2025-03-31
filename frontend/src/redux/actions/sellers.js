// redux/actions/seller.js
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

// Get all sellers (admin)
export const getAllSellers = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllSellersRequest" });

    const { data } = await axios.get(`${server}/shop/admin-all-sellers`, {
      withCredentials: true,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      }
    });

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

// Load seller
export const loadSeller = () => async (dispatch) => {
  try {
    dispatch({ type: "LoadSellerRequest" });

    const seller_token = localStorage.getItem("seller_token");
    if (!seller_token) {
      dispatch({ type: "LoadSellerFail", payload: "No seller token found" });
      return;
    }

    const { data } = await axios.get(`${server}/shop/getSeller`, {
      withCredentials: true,
      headers: {
        "Seller-Authorization": `Bearer ${seller_token}`
      }
    });

    if (data.success) {
      dispatch({
        type: "LoadSellerSuccess",
        payload: data.seller,
      });
    } else {
      throw new Error(data.message || "Failed to load seller");
    }
  } catch (error) {
    localStorage.removeItem("seller_token");
    delete axios.defaults.headers.common["Seller-Authorization"];
    
    dispatch({
      type: "LoadSellerFail",
      payload: error.response?.data?.message || error.message || "Failed to load seller",
    });
  }
};


// Seller login
export const loginSeller = (email, password, navigate) => async (dispatch) => {
  try {
    dispatch({ type: "SellerLoginRequest" });

    const { data } = await axios.post(
      `${server}/shop/login-shop`,
      { email, password },
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (data.success && data.token) {
      localStorage.setItem("seller_token", data.token);
      
      // First dispatch success
      dispatch({
        type: "SellerLoginSuccess",
        payload: data.seller,
      });

      // Then set headers
      axios.defaults.headers.common["Seller-Authorization"] = `Bearer ${data.token}`;
      
      toast.success("Login successful!");

      // Use setTimeout to prevent rapid navigation
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    }
  } catch (error) {
    localStorage.removeItem("seller_token");
    delete axios.defaults.headers.common["Seller-Authorization"];
    
    toast.error(error.response?.data?.message || "Login failed");
    dispatch({
      type: "SellerLoginFail",
      payload: error.response?.data?.message || "Login failed",
    });
  }
};
export const logoutSeller = () => async (dispatch) => {
  try {
    dispatch({ type: "SellerLogoutRequest" });
    
    await axios.get(`${server}/shop/logout`, {
      withCredentials: true
    });

    localStorage.removeItem("seller_token");
    delete axios.defaults.headers.common["Seller-Authorization"];
    
    toast.success("Logout successful!");
    
    dispatch({ type: "SellerLogoutSuccess" });
  } catch (error) {
    toast.error(error.response?.data?.message || "Logout failed");
    dispatch({
      type: "SellerLogoutFail",
      payload: error.response?.data?.message || "Logout failed",
    });
  }
};

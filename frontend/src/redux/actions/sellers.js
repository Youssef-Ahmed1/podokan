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
export const logoutSeller = () => async (dispatch) => {
  try {
    await axios.get(`${server}/shop/logout`, { withCredentials: true });
    
    // Clear localStorage
    localStorage.removeItem('seller_token');
    
    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
    
    dispatch({ type: "LoadSellerFail" });
    
    toast.success("Seller logout successful");
  } catch (error) {
    console.error("Seller logout error:", error);
  }
};

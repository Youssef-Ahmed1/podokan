import axios from "axios";
import { createReducer } from "@reduxjs/toolkit";
import { server } from "../../server";
import { toast } from "react-toastify";



axios.defaults.withCredentials = true;

// Set auth token
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

const initialState = {
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null
};


export const userReducer = createReducer(initialState, (builder) => {
  builder.addCase("LoadUserRequest", (state) => {
      state.loading = true;
    })
    .addCase("LoadUserSuccess", (state, action) => {
      state.isAuthenticated = true;
      state.loading = false;
      state.user = action.payload;
    })
    .addCase("LoadUserFail", (state, action) => {
      state.loading = false;
      state.error = action.payload;
      state.isAuthenticated = false;
    })
    .addCase("updateUserInfoRequest", (state) => {
      state.loading = true;
    })
    .addCase("updateUserInfoSuccess", (state, action) => {
      state.loading = false;
      state.user = action.payload;
    })
    .addCase("updateUserInfoFailed", (state, action) => {
      state.loading = false;
      state.error = action.payload;
    })
    .addCase("updateUserAddressRequest", (state) => {
      state.addressloading = true;
    })
    .addCase("updateUserAddressSuccess", (state, action) => {
      state.addressloading = false;
      state.successMessage = action.payload.successMessage;
      state.user = action.payload.user;
    })
    .addCase("updateUserAddressFailed", (state, action) => {
      state.addressloading = false;
      state.error = action.payload;
    })
    .addCase("deleteUserAddressRequest", (state) => {
      state.addressloading = true;
    })
    .addCase("deleteUserAddressSuccess", (state, action) => {
      state.addressloading = false;
      state.successMessage = action.payload.successMessage;
      state.user = action.payload.user;
    })
    .addCase("deleteUserAddressFailed", (state, action) => {
      state.addressloading = false;
      state.error = action.payload;
    })
    .addCase("getAllUsersRequest", (state) => {
      state.usersLoading = true;
    })
    .addCase("getAllUsersSuccess", (state, action) => {
      state.usersLoading = false;
      state.users = action.payload;
    })
    .addCase("getAllUsersFailed", (state, action) => {
      state.usersLoading = false;
      state.error = action.payload;
    })
    .addCase("clearErrors", (state) => {
      state.error = null;
    })
    .addCase("clearMessages", (state) => {
      state.successMessage = null;
    });
});
// load user
export const loadUser = () => async (dispatch) => {
  try {
    dispatch({ type: "LoadUserRequest" });

    const { data } = await axios.get(`${server}/user/getuser`);

    dispatch({
        type: "LoadUserSuccess",
        payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "LoadUserFail",
      payload: error.response?.data?.message || "Authentication failed"
    });
  }
};

export const loadSeller = () => async (dispatch) => {
  try {
    dispatch({ type: "LoadSellerRequest" });

    const config = {
      headers: {
        'Seller-Authorization': sellerToken ? `Bearer ${sellerToken}` : '',
      }
    };

    const { data } = await axios.get(`${server}/shop/getSeller`, config);

    dispatch({
        type: "LoadSellerSuccess",
        payload: data.seller,
    });
  } catch (error) {
    dispatch({
      type: "LoadSellerFail",
      payload: error.response?.data?.message || "Authentication failed"
    });
  }
};

// user update information
export const updateUserInformation =
  (name, email, phoneNumber, password) => async (dispatch) => {
    try {
      dispatch({ type: "updateUserInfoRequest" });

      const { data } = await axios.put(
        `${server}/user/update-user-info`,
        { email, password, phoneNumber, name },
        { withCredentials: true, headers: { "Access-Control-Allow-Credentials": true } }
      );

      dispatch({ type: "updateUserInfoSuccess", payload: data.user });
    } catch (error) {
      dispatch({
        type: "updateUserInfoFailed",
        payload: error.response?.data?.message || error.message,
      });
    }
  };

// update user address
export const updateUserAddress =
  (country, city, address1, address2, zipCode, addressType) =>
  async (dispatch) => {
    try {
      dispatch({ type: "updateUserAddressRequest" });

      const { data } = await axios.put(
        `${server}/user/update-user-addresses`,
        { country, city, address1, address2, zipCode, addressType },
        { withCredentials: true }
      );

      dispatch({
        type: "updateUserAddressSuccess",
        payload: {
          successMessage: "User address updated successfully!",
          user: data.user,
        },
      });
    } catch (error) {
      dispatch({
        type: "updateUserAddressFailed",
        payload: error.response?.data?.message || error.message,
      });
    }
  };
export const login = (email, password) => async (dispatch) => {
  try {
    dispatch({ type: "LoginRequest" });

    const { data } = await axios.post(`${server}/user/login-user`, {
      email,
      password,
    });

    axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;

    dispatch({
      type: "LoginSuccess",
      payload: data.user,
    });
  } catch (error) {
    dispatch({
      type: "LoginFail",
      payload: error.response?.data?.message || "Login failed",
    });
  }
};
export const logout = () => async (dispatch) => {
  try {
      delete axios.defaults.headers.common["Authorization"];

      await axios.get(`${server}/user/logout`);

      dispatch({ type: "LogoutSuccess" });
  } catch (error) {
      dispatch({
          type: "LogoutFail",
          payload: error.response?.data?.message || "Logout failed",
      });
  }
};
// delete user address
export const deleteUserAddress = (id) => async (dispatch) => {
  try {
    dispatch({ type: "deleteUserAddressRequest" });

    const { data } = await axios.delete(
      `${server}/user/delete-user-address/${id}`,
      {
        withCredentials: true,
      }
    );

    dispatch({
      type: "deleteUserAddressSuccess",
      payload: {
        successMessage: "User deleted successfully!",
        user: data.user,
      },
    });
  } catch (error) {
    dispatch({
      type: "deleteUserAddressFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// get all users --- admin
export const getAllUsers = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllUsersRequest" });
    const { data } = await axios.get(`${server}/user/admin-all-users`, {
      withCredentials: true,
    });
    dispatch({ type: "getAllUsersSuccess", payload: data.users });
  } catch (error) {
    dispatch({
      type: "getAllUsersFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
export const clearErrors = () => (dispatch) => {
  dispatch({ type: "clearErrors" });
};

// Clear Success Messages Action Creator
export const clearMessages = () => (dispatch) => {
  dispatch({ type: "clearMessages" });
};

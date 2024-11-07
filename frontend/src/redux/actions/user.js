import axios from "axios";
import { createReducer } from "@reduxjs/toolkit";
import { server } from "../../server";
import { toast } from "react-toastify";


axios.defaults.withCredentials = true;

// Helper function to set auth headers
const setAuthHeader = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};


const initialState = {
  isAuthenticated: false,
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

    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setAuthHeader(storedToken);
    }

    const { data } = await axios.get(`${server}/user/getuser`, {
      withCredentials: true,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (data.success) {
      dispatch({ 
        type: "LoadUserSuccess", 
        payload: data.user 
      });
    }
  } catch (error) {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      setAuthHeader(null);
    }
    dispatch({
      type: "LoadUserFail",
      payload: error.response?.data?.message || "Authentication failed"
    });
  }
};

// Load seller
export const loadSeller = () => async (dispatch) => {
  try {
    dispatch({ type: "LoadSellerRequest" });
    
    const { data } = await axios.get(`${server}/shop/getSeller`, {
      withCredentials: true
    });
    
    if (data.success) {
      setAuthToken(data.token);
      dispatch({ type: "LoadSellerSuccess", payload: data.seller });
    }
  } catch (error) {
    dispatch({
      type: "LoadSellerFail",
      payload: error.response?.data?.message || "Authentication failed"
    });
  }
};

// user update information
export const updateUserInformation = (userData) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateUserRequest" });

    const { data } = await axios.put(
      `${server}/user/update-user-info`,
      userData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    dispatch({ 
      type: "UpdateUserSuccess",
      payload: data.user
    });
  } catch (error) {
    dispatch({
      type: "UpdateUserFail",
      payload: error.response?.data?.message || "Update failed"
    });
  }
};


// update user address
export const updateUserAddress = (addressData) => async (dispatch) => {
  try {
    dispatch({ type: "UpdateAddressRequest" });

    const { data } = await axios.put(
      `${server}/user/update-user-addresses`,
      addressData,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    dispatch({
      type: "UpdateAddressSuccess",
      payload: {
        user: data.user,
        successMessage: "Address updated successfully"
      }
    });
  } catch (error) {
    dispatch({
      type: "UpdateAddressFail",
      payload: error.response?.data?.message || "Address update failed"
    });
  }
};
  export const login = (email, password) => async (dispatch) => {
    try {
      dispatch({ type: "LoginRequest" });
  
      const { data } = await axios.post(
        `${server}/user/login-user`,
        { email, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );
  
      if (data.success) {
        localStorage.setItem('token', data.token);
        setAuthHeader(data.token);
        dispatch({ type: "LoginSuccess", payload: data.user });
      }
    } catch (error) {
      dispatch({
        type: "LoginFail",
        payload: error.response?.data?.message || "Login failed"
      });
    }
  };
  export const logout = () => async (dispatch) => {
    try {
      await axios.get(`${server}/user/logout`, {
        withCredentials: true
      });
      
      localStorage.removeItem('token');
      setAuthHeader(null);
      
      dispatch({ type: "LoadUserFail" });
      dispatch({ type: "Logout" });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
  
// delete user address
export const deleteUserAddress = (addressId) => async (dispatch) => {
  try {
    dispatch({ type: "DeleteAddressRequest" });

    const { data } = await axios.delete(
      `${server}/user/delete-user-address/${addressId}`,
      {
        withCredentials: true
      }
    );

    dispatch({
      type: "DeleteAddressSuccess",
      payload: {
        user: data.user,
        successMessage: "Address deleted successfully"
      }
    });
  } catch (error) {
    dispatch({
      type: "DeleteAddressFail",
      payload: error.response?.data?.message || "Delete failed"
    });
  }
};

// get all users --- admin
export const getAllUsers = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllUsersRequest" });
    const { data } = await axios.get(`${server}/api/v2/user/admin-all-users`, {
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

import axios from "axios";
import { server } from "../../server";
import { DesignDownloader } from "../../utils/designDownload"; // Ensure correct path
import { toast } from "react-toastify";

// Constants for action types
export const ORDER_ACTIONS = {
  // Create Order
  CREATE_REQUEST: "orderCreateRequest",
  CREATE_SUCCESS: "orderCreateSuccess",
  CREATE_FAIL: "orderCreateFail",

  // Get User Orders
  GET_USER_REQUEST: "getAllOrdersUserRequest",
  GET_USER_SUCCESS: "getAllOrdersUserSuccess",
  GET_USER_FAIL: "getAllOrdersUserFailed",

  // Get Shop Orders
  GET_SHOP_REQUEST: "getAllOrdersShopRequest",
  GET_SHOP_SUCCESS: "getAllOrdersShopSuccess",
  GET_SHOP_FAIL: "getAllOrdersShopFailed",

  // Get Admin Orders
  GET_ADMIN_REQUEST: "adminAllOrdersRequest",
  GET_ADMIN_SUCCESS: "adminAllOrdersSuccess",
  GET_ADMIN_FAIL: "adminAllOrdersFail",

  // Update Order Status (generic) - Might remove if using specific roles
  UPDATE_STATUS_REQUEST: "updateOrderStatusRequest",
  UPDATE_STATUS_SUCCESS: "updateOrderStatusSuccess",
  UPDATE_STATUS_FAIL: "updateOrderStatusFail",

  // Admin Update Status
  ADMIN_UPDATE_STATUS_REQUEST: "adminUpdateOrderStatusRequest",
  ADMIN_UPDATE_STATUS_SUCCESS: "adminUpdateOrderStatusSuccess",
  ADMIN_UPDATE_STATUS_FAIL: "adminUpdateOrderStatusFail",

  // Seller Update Status
  SELLER_UPDATE_STATUS_REQUEST: "sellerUpdateOrderStatusRequest",
  SELLER_UPDATE_STATUS_SUCCESS: "sellerUpdateOrderStatusSuccess",
  SELLER_UPDATE_STATUS_FAIL: "sellerUpdateOrderStatusFail",

  // Download Actions
  DOWNLOAD_SPECS_REQUEST: "downloadSpecsRequest",
  DOWNLOAD_SPECS_SUCCESS: "downloadSpecsSuccess",
  DOWNLOAD_SPECS_FAIL: "downloadSpecsFail",

  DOWNLOAD_DESIGN_REQUEST: "downloadDesignRequest",
  DOWNLOAD_DESIGN_SUCCESS: "downloadDesignSuccess",
  DOWNLOAD_DESIGN_FAIL: "downloadDesignFail",

  // Delivery Actions (Keep structure, implement based on features)
  ASSIGN_DELIVERY_REQUEST: "assignDeliveryRequest",
  ASSIGN_DELIVERY_SUCCESS: "assignDeliverySuccess",
  ASSIGN_DELIVERY_FAIL: "assignDeliveryFail",

  UPDATE_DELIVERY_REQUEST: "updateDeliveryRequest",
  UPDATE_DELIVERY_SUCCESS: "updateDeliverySuccess",
  UPDATE_DELIVERY_FAIL: "updateDeliveryFail",

  // Refund Actions
  REFUND_REQUEST_USER: "refundRequestUser", // User initiates
  REFUND_REQUEST_USER_SUCCESS: "refundRequestUserSuccess",
  REFUND_REQUEST_USER_FAIL: "refundRequestUserFail",

  REFUND_PROCESS_SELLER: "refundProcessSeller", // Seller approves/rejects
  REFUND_PROCESS_SELLER_SUCCESS: "refundProcessSellerSuccess",
  REFUND_PROCESS_SELLER_FAIL: "refundProcessSellerFail",

  // Clear Errors
  CLEAR_ERRORS: "clearErrors",
};

/**
 * Gets the token from localStorage and formats it as a Bearer token.
 * @param {string} tokenKey - Key for the token in localStorage ('token' or 'seller_token').
 * @returns {string | null} - Formatted Bearer token or null if not found.
 */
const getFormattedBearerToken = (tokenKey = "token") => {
  const token = localStorage.getItem(tokenKey);
  if (!token) return null;
  // Ensure Bearer prefix exists only once
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

/**
 * Helper function for API requests with standardized error handling & toast notifications.
 * @param {Function} dispatch - Redux dispatch function
 * @param {string} requestType - Action type for request start
 * @param {string} successType - Action type for success
 * @param {string} failType - Action type for failure
 * @param {Function} apiCall - Async function that makes the API call and returns response data relevant to payload
 * @param {Function} [successCallback] - Optional callback on success, receives the payload
 * @param {boolean} [showSuccessToast=false] - Whether to show a generic success toast
 * @param {string} [successToastMessage] - Custom success toast message
 * @returns {Promise<any>} - The payload from the successful API call
 * @throws {Error} - Throws an error on failure, allowing caller to catch
 */
const handleApiRequest = async (
  dispatch,
  requestType,
  successType,
  failType,
  apiCall,
  successCallback = null,
  showSuccessToast = false,
  successToastMessage = "Operation successful!"
) => {
  dispatch({ type: requestType });

  try {
    const payload = await apiCall(); // Expects apiCall to return relevant data for reducer

    dispatch({
      type: successType,
      payload: payload,
    });

    if (showSuccessToast) {
      toast.success(successToastMessage);
    }

    if (successCallback) {
      successCallback(payload);
    }

    return payload; // Return payload for promise chaining if needed
  } catch (error) {
    console.error(`API Request Error (${requestType}):`, error);
    const errorMessage =
      error.response?.data?.message || error.message || `Request failed`;

    dispatch({
      type: failType,
      payload: errorMessage,
    });

    // Specific Error Toasts
    if (error.response?.status === 401) {
      // Unauthorized
      toast.error("Authentication failed. Please log in again.");
      // Potentially dispatch a logout action here
    } else if (error.response?.status === 403) {
      // Forbidden
      toast.error("Permission denied to perform this action.");
    } else if (error.response?.status === 400) {
      // Bad Request (Validation etc.)
      toast.error(`Action failed: ${errorMessage}`);
    } else if (error.response?.status >= 500) {
      // Server Error
      toast.error("Server error. Please try again later.");
    } else if (axios.isCancel(error)) {
      console.log("Request canceled:", error.message); // Ignore toast for cancellations
    } else {
      // Network or other errors
      toast.error(errorMessage); // Generic toast for other failures
    }

    throw new Error(errorMessage); // Re-throw standardized error for component catching
  }
};

// Action: Create Order
export const createOrder = (orderData) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.CREATE_REQUEST,
    ORDER_ACTIONS.CREATE_SUCCESS,
    ORDER_ACTIONS.CREATE_FAIL,
    async () => {
      console.log("Dispatching createOrder with data:", orderData);
      // Using withCredentials suggests backend expects cookies for session/CSRF, standard JWT might just use headers.
      const { data } = await axios.post(
        `${server}/order/create-order`,
        orderData,
        { withCredentials: true } // Assumes user token is sent via cookie managed by browser/axios default
      );
      if (!data.success)
        throw new Error(data.message || "Order creation failed");
      return data.orders; // Backend returns the created orders array
    },
    null, // No specific success callback needed here
    true, // Show success toast
    "Order placed successfully!"
  );
};

// Action: Get all orders for authenticated user
export const getAllOrdersOfUser = () => async (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.GET_USER_REQUEST }); // Manual dispatch start for different try/catch logic

  try {
    const token = getFormattedBearerToken("token");
    console.log(
      "getAllOrdersOfUser using token:",
      token ? "Present" : "MISSING"
    );
    if (!token) {
      // Don't throw, just dispatch fail and return empty. Let component decide if login needed.
      dispatch({
        type: ORDER_ACTIONS.GET_USER_FAIL,
        payload: "User token not found",
      });
      return { success: false, orders: [] };
    }

    const { data } = await axios.get(`${server}/order/get-user-orders`, {
      // withCredentials: true, // Use ONLY if relying on cookies; redundant if using Bearer token
      headers: {
        Authorization: token, // Explicitly send Bearer token
      },
    });

    if (!data.success) {
      throw new Error(data.message || "Failed to fetch user orders");
    }

    // Ensure orders is always an array in the payload
    const orders = Array.isArray(data.orders) ? data.orders : [];

    dispatch({
      type: ORDER_ACTIONS.GET_USER_SUCCESS,
      payload: orders,
    });

    return data; // Return full response if needed by caller
  } catch (error) {
    console.error("Error fetching user orders:", error);
    const errorMessage =
      error.response?.data?.message || "Failed to fetch orders";
    dispatch({
      type: ORDER_ACTIONS.GET_USER_FAIL,
      payload: errorMessage,
    });
    if (error.response?.status === 401)
      toast.error("Session expired. Please login again.");
    // Always return shape expected by component to prevent crashes
    return { success: false, orders: [] };
  }
};

// Action: Get all orders for authenticated seller shop
export const getAllOrdersOfShop = () => async (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.GET_SHOP_REQUEST });

  try {
    // **FIX: Use Seller-Authorization header** based on app.js CORS config
    //    AND ensure getFormattedBearerToken retrieves from 'seller_token' localStorage key
    const sellerToken = getFormattedBearerToken("seller_token"); // Ensure this uses 'seller_token'
    console.log(
      "getAllOrdersOfShop using seller token:",
      sellerToken ? "Present" : "MISSING"
    );
    if (!sellerToken) {
      dispatch({
        type: ORDER_ACTIONS.GET_SHOP_FAIL,
        payload: "Seller authentication token not found.",
      });
      toast.error("Seller login required.");
      return { success: false, orders: [] }; // Return predictable shape
    }

    const { data } = await axios.get(`${server}/order/get-seller-orders`, {
      // withCredentials: true, // Use ONLY if backend relies on session cookies IN ADDITION to token
      headers: {
        "Seller-Authorization": sellerToken, // Use the specific header for seller
      },
    });

    console.log("Shop orders response:", data);
    if (!data.success) {
      throw new Error(data.message || "Failed to fetch shop orders");
    }

    const orders = Array.isArray(data.orders) ? data.orders : [];
    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_SUCCESS,
      payload: orders,
    });

    return data;
  } catch (error) {
    console.error("Error in getAllOrdersOfShop:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Failed to fetch shop orders";

    dispatch({
      type: ORDER_ACTIONS.GET_SHOP_FAIL,
      payload: errorMessage,
    });

    if (error.response?.status === 401) {
      toast.error(
        "Seller authentication failed or expired. Please log in again."
      );
      // Consider dispatching seller logout action
    } else if (error.response?.status === 403) {
      toast.error("You are not authorized as a seller.");
    } else {
      toast.error(`Failed to load shop orders: ${errorMessage}`);
    }

    // Do NOT throw here if component should handle empty state, return predictable shape
    return { success: false, orders: [] };
  }
};

// Action: Get all orders for Admin
export const getAllOrdersOfAdmin = () => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.GET_ADMIN_REQUEST,
    ORDER_ACTIONS.GET_ADMIN_SUCCESS,
    ORDER_ACTIONS.GET_ADMIN_FAIL,
    async () => {
      const token = getFormattedBearerToken("token"); // Admin uses the standard user token
      console.log(
        "getAllOrdersOfAdmin using admin token:",
        token ? "Present" : "MISSING"
      );
      if (!token) throw new Error("Admin token not found");

      const { data } = await axios.get(`${server}/order/admin/all-orders`, {
        // withCredentials: true, // Usually not needed with Bearer token
        headers: { Authorization: token },
      });

      console.log("Admin orders raw response:", data);
      if (!data.success)
        throw new Error(data.message || "Failed to fetch admin orders");
      // Ensure payload is always an array
      return Array.isArray(data.orders) ? data.orders : [];
    },
    (payload) => {
      console.log(`Successfully fetched ${payload.length} admin orders.`);
    },
    false // Don't show success toast for background fetches
  );
};

// Action: Update order status as Admin
export const adminUpdateOrderStatus = (orderId, status) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST,
    ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS,
    ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FAIL,
    async () => {
      const token = getFormattedBearerToken("token");
      if (!token) throw new Error("Admin authentication required.");
      console.log(`Admin updating order ${orderId} to status ${status}`);

      const { data } = await axios.put(
        `${server}/order/admin/update-status/${orderId}`,
        { status }, // Send status in request body
        { headers: { Authorization: token } }
      );

      if (!data.success)
        throw new Error(data.message || "Failed to update order status");
      return data.order; // Return the updated order object
    },
    (updatedOrder) => {
      // Optionally refresh all admin orders in the background after update success
      // Debounce this if updates happen frequently
      dispatch(getAllOrdersOfAdmin()); // Refresh list after single update
      console.log(`Admin status update successful for ${updatedOrder._id}`);
    },
    true, // Show success toast
    `Order status updated to ${status}`
  );
};

// Action: Update order status as Seller
export const sellerUpdateOrderStatus =
  (orderId, status) => async (dispatch) => {
    return handleApiRequest(
      dispatch,
      ORDER_ACTIONS.SELLER_UPDATE_STATUS_REQUEST,
      ORDER_ACTIONS.SELLER_UPDATE_STATUS_SUCCESS,
      ORDER_ACTIONS.SELLER_UPDATE_STATUS_FAIL,
      async () => {
        const sellerToken = getFormattedBearerToken("seller_token");
        if (!sellerToken) throw new Error("Seller authentication required.");
        console.log(`Seller updating order ${orderId} to status ${status}`);

        // Use the correct endpoint for seller status update
        const { data } = await axios.put(
          `${server}/order/update-order-status/${orderId}`, // Endpoint for Seller
          { status },
          { headers: { "Seller-Authorization": sellerToken } } // Use seller token header
        );

        if (!data.success)
          throw new Error(data.message || "Failed to update order status");
        return data.order;
      },
      (updatedOrder) => {
        // Refresh seller's order list
        dispatch(getAllOrdersOfShop()); // Refresh list
        console.log(`Seller status update successful for ${updatedOrder._id}`);
      },
      true,
      `Order status updated to ${status}`
    );
  };

// Action: Download design package (Admin)
export const adminDownloadDesign = (orderId, itemId) => async (dispatch) => {
  // No need for Redux state change during download itself, handle loading in component
  dispatch({
    type: ORDER_ACTIONS.DOWNLOAD_DESIGN_REQUEST,
    payload: { orderId, itemId },
  });

  try {
    const token = getFormattedBearerToken("token");
    if (!token) throw new Error("Admin authentication required.");
    console.log(
      `Admin requesting download for order ${orderId}, item ${itemId}`
    );

    // 1. Fetch the design data (URL, specs etc) from backend
    const { data } = await axios.get(
      `${server}/order/download-design/${orderId}/${itemId}`,
      { headers: { Authorization: token } }
    );

    if (!data.success || !data.designData) {
      throw new Error(
        data.message || "Failed to retrieve design data from server."
      );
    }
    console.log("Received design data from backend:", data.designData);

    // 2. Use DesignDownloader utility on the frontend to process and initiate download
    await DesignDownloader.downloadSingleDesign(data.designData); // Pass the whole designData object

    dispatch({
      type: ORDER_ACTIONS.DOWNLOAD_DESIGN_SUCCESS,
      payload: { orderId, itemId },
    });
    toast.success("Design package download initiated!");
  } catch (error) {
    console.error("Admin Design Download failed:", error);
    const errorMsg = error.message || "Failed to download design package.";
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_DESIGN_FAIL, payload: errorMsg });
    toast.error(errorMsg);
    // No need to throw again, toast informs user, Redux state has error
  }
};

// Action: Download order specifications (Admin/User/Seller)
export const downloadOrderSpecs = (orderId) => async (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST });

  try {
    // Determine token type based on who is downloading (needs logic based on current user role)
    // For simplicity, assuming standard user/admin token for now
    const token =
      getFormattedBearerToken("token") ||
      getFormattedBearerToken("seller_token"); // Try both maybe? Or pass role context.
    if (!token) throw new Error("Authentication required to download specs.");

    // Fetch specs data as JSON first
    const { data } = await axios.get(
      `${server}/order/download-specs/${orderId}`,
      { headers: { Authorization: token } }
    );

    if (!data.success || !data.specsData) {
      throw new Error(data.message || "Failed to retrieve specification data.");
    }

    // Create a JSON blob and trigger download
    const jsonString = JSON.stringify(data.specsData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `order_specs_${orderId}.json`);
    document.body.appendChild(link);
    link.click();

    // Clean up
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS });
    toast.success("Order specifications downloaded.");
  } catch (error) {
    console.error("Download Order Specs failed:", error);
    const errorMsg = error.message || "Failed to download specifications.";
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL, payload: errorMsg });
    toast.error(errorMsg);
  }
};

// Action: Request Refund (User)
export const requestRefund = (orderId, reason) => async (dispatch) => {
  return handleApiRequest(
    dispatch,
    ORDER_ACTIONS.REFUND_REQUEST_USER,
    ORDER_ACTIONS.REFUND_REQUEST_USER_SUCCESS,
    ORDER_ACTIONS.REFUND_REQUEST_USER_FAIL,
    async () => {
      const token = getFormattedBearerToken("token");
      if (!token) throw new Error("Authentication required.");
      const { data } = await axios.put(
        `${server}/order/request-refund/${orderId}`,
        { reason }, // Send reason in body
        { headers: { Authorization: token } }
      );
      if (!data.success)
        throw new Error(data.message || "Failed to request refund");
      return data.order; // Return updated order
    },
    (updatedOrder) => {
      // Maybe refresh user's order list
      dispatch(getAllOrdersOfUser());
    },
    true,
    "Refund request submitted successfully."
  );
};

// Action: Process Refund (Seller: Approve/Reject)
export const processRefundBySeller =
  (orderId, status, refundNotes = "") =>
  async (dispatch) => {
    return handleApiRequest(
      dispatch,
      ORDER_ACTIONS.REFUND_PROCESS_SELLER,
      ORDER_ACTIONS.REFUND_PROCESS_SELLER_SUCCESS,
      ORDER_ACTIONS.REFUND_PROCESS_SELLER_FAIL,
      async () => {
        const sellerToken = getFormattedBearerToken("seller_token");
        if (!sellerToken) throw new Error("Seller authentication required.");
        const { data } = await axios.put(
          `${server}/order/process-refund/${orderId}`, // Use correct endpoint
          { status, refundNotes }, // Send status ('Refund Approved' / 'Refund Rejected') and notes
          { headers: { "Seller-Authorization": sellerToken } }
        );
        if (!data.success)
          throw new Error(data.message || "Failed to process refund request");
        return data.order; // Return updated order
      },
      (updatedOrder) => {
        // Refresh seller's order list
        dispatch(getAllOrdersOfShop());
      },
      true,
      `Refund request processing status updated to ${status}.` // Use final status from response ideally
    );
  };

// ---- Placeholder Actions for Delivery Flow ----

// Action: Assign Delivery Partner (Seller Action potentially)
export const assignDeliveryPartner =
  (orderId, deliveryPartnerInfo) => async (dispatch) => {
    // Requires backend implementation calling delivery partner API
    // This is just a structure
    return handleApiRequest(
      dispatch,
      ORDER_ACTIONS.ASSIGN_DELIVERY_REQUEST,
      ORDER_ACTIONS.ASSIGN_DELIVERY_SUCCESS,
      ORDER_ACTIONS.ASSIGN_DELIVERY_FAIL,
      async () => {
        const sellerToken = getFormattedBearerToken("seller_token");
        if (!sellerToken) throw new Error("Seller authentication required.");
        const { data } = await axios.post(
          `${server}/order/assign-delivery`, // Use your endpoint
          { orderId, deliveryPartnerInfo },
          { headers: { "Seller-Authorization": sellerToken } }
        );
        if (!data.success)
          throw new Error(data.message || "Failed to assign delivery partner");
        return data.order;
      },
      (updatedOrder) => {
        dispatch(getAllOrdersOfShop());
      },
      true,
      "Delivery partner assigned."
    );
  };

// ---- End Delivery Placeholders ----

// Action: Clear Errors
export const clearErrors = () => (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
};

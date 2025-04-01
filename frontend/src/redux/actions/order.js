import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
// DesignDownloader utility is intended to be called from UI components, not directly within Redux actions.

export const ORDER_ACTIONS = Object.freeze({
  CREATE_REQUEST: "o/crReq",
  CREATE_SUCCESS: "o/crSuc",
  CREATE_FAIL: "o/crFail",
  CREATE_FINALLY: "o/crFin",
  GET_USER_REQUEST: "o/guReq",
  GET_USER_SUCCESS: "o/guSuc",
  GET_USER_FAIL: "o/guFail",
  GET_USER_FINALLY: "o/guFin",
  GET_SHOP_REQUEST: "o/gsReq",
  GET_SHOP_SUCCESS: "o/gsSuc",
  GET_SHOP_FAIL: "o/gsFail",
  GET_SHOP_FINALLY: "o/gsFin",
  GET_ADMIN_REQUEST: "o/gaReq",
  GET_ADMIN_SUCCESS: "o/gaSuc",
  GET_ADMIN_FAIL: "o/gaFail",
  GET_ADMIN_FINALLY: "o/gaFin",
  GET_DETAIL_REQUEST: "o/gdReq",
  GET_DETAIL_SUCCESS: "o/gdSuc",
  GET_DETAIL_FAIL: "o/gdFail",
  GET_DETAIL_FINALLY: "o/gdFin",
  ADMIN_UPDATE_STATUS_REQUEST: "o/ausReq",
  ADMIN_UPDATE_STATUS_SUCCESS: "o/ausSuc",
  ADMIN_UPDATE_STATUS_FAIL: "o/ausFail",
  ADMIN_UPDATE_STATUS_FINALLY: "o/ausFin",
  SELLER_UPDATE_REFUND_REQUEST: "o/surReq",
  SELLER_UPDATE_REFUND_SUCCESS: "o/surSuc",
  SELLER_UPDATE_REFUND_FAIL: "o/surFail",
  SELLER_UPDATE_REFUND_FINALLY: "o/surFin",
  DOWNLOAD_DESIGN_DATA_REQUEST: "o/dddReq",
  DOWNLOAD_DESIGN_DATA_SUCCESS: "o/dddSuc",
  DOWNLOAD_DESIGN_DATA_FAIL: "o/dddFail",
  DOWNLOAD_DESIGN_DATA_FINALLY: "o/dddFin",
  USER_REQUEST_REFUND_REQUEST: "o/urrReq",
  USER_REQUEST_REFUND_SUCCESS: "o/urrSuc",
  USER_REQUEST_REFUND_FAIL: "o/urrFail",
  USER_REQUEST_REFUND_FINALLY: "o/urrFin",
  DOWNLOAD_SPECS_REQUEST: "o/dlSpecReq",
  DOWNLOAD_SPECS_SUCCESS: "o/dlSpecSuc",
  DOWNLOAD_SPECS_FAIL: "o/dlSpecFail",
  DOWNLOAD_SPECS_FINALLY: "o/dlSpecFin",
  CLEAR_ERRORS: "o/clrErr",
});

const getFormattedBearerToken = (tokenKey = "token") => {
  const token = localStorage.getItem(tokenKey);
  return token
    ? token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`
    : null;
};

const getAuthHeaders = (tokenType = "user") => {
  const tokenKey = tokenType === "seller" ? "seller_token" : "token";
  const headerKey =
    tokenType === "seller" ? "Seller-Authorization" : "Authorization";
  const token = getFormattedBearerToken(tokenKey);
  // Return header only if token exists to avoid sending empty Authorization header
  return token
    ? { [headerKey]: token, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
};

const handleApiRequest = async ({
  dispatch,
  reqT,
  sucT,
  failT,
  finT,
  apiCall,
  loadK = "isLoading",
  sucMsg = "Success!",
  showSuc = false,
}) => {
  dispatch({ type: reqT, payload: { [loadK]: true } });
  try {
    const response = await apiCall();
    if (response.data.success === false)
      throw new Error(response.data.message || "API indicated failure");
    const payload =
      response.data.order ??
      response.data.orders ??
      response.data.designData ??
      response.data.payload ??
      response.data;
    dispatch({ type: sucT, payload });
    if (showSuc) toast.success(sucMsg);
    return response.data;
  } catch (error) {
    let msg = "An unexpected error occurred.";
    if (error.response) {
      msg =
        error.response.data?.message ||
        `Server Error: ${error.response.status}`;
      if (error.response.status === 401)
        msg = "Authentication failed/expired. Please login again.";
      else if (error.response.status === 403) msg = "Permission denied.";
    } else if (error.request) msg = "Network Error: Could not connect.";
    else msg = error.message || msg;
    console.error(`API Request Error (${reqT}):`, msg, error);
    dispatch({ type: failT, payload: msg });
    toast.error(msg, { autoClose: 5000 }); // Show error longer
    throw error;
  } finally {
    if (finT) dispatch({ type: finT, payload: { [loadK]: false } });
  }
};

// --- Action Creators ---

export const createOrder = (orderData) => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.CREATE_REQUEST,
    sucT: ORDER_ACTIONS.CREATE_SUCCESS,
    failT: ORDER_ACTIONS.CREATE_FAIL,
    finT: ORDER_ACTIONS.CREATE_FINALLY,
    apiCall: () =>
      axios.post(`${server}/order/create-order`, orderData, {
        headers: getAuthHeaders("user"),
      }), // Send user token if needed by backend logic
    loadK: "isUpdating",
    sucMsg: "Order placed!",
    showSuc: true,
  });

export const getAllOrdersOfUser = () => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.GET_USER_REQUEST,
    sucT: ORDER_ACTIONS.GET_USER_SUCCESS,
    failT: ORDER_ACTIONS.GET_USER_FAIL,
    finT: ORDER_ACTIONS.GET_USER_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/get-user-orders`, {
        headers: getAuthHeaders("user"),
      }),
    loadK: "isLoading",
  });

export const getAllOrdersOfShop = () => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.GET_SHOP_REQUEST,
    sucT: ORDER_ACTIONS.GET_SHOP_SUCCESS,
    failT: ORDER_ACTIONS.GET_SHOP_FAIL,
    finT: ORDER_ACTIONS.GET_SHOP_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/get-seller-orders`, {
        headers: getAuthHeaders("seller"),
      }),
    loadK: "isLoading",
  });

export const getAllOrdersOfAdmin = () => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.GET_ADMIN_REQUEST,
    sucT: ORDER_ACTIONS.GET_ADMIN_SUCCESS,
    failT: ORDER_ACTIONS.GET_ADMIN_FAIL,
    finT: ORDER_ACTIONS.GET_ADMIN_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/admin/all-orders`, {
        headers: getAuthHeaders("admin"),
      }),
    loadK: "isLoading",
  });

export const adminUpdateOrderStatus = (orderId, status) => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_REQUEST,
    sucT: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_SUCCESS,
    failT: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FAIL,
    finT: ORDER_ACTIONS.ADMIN_UPDATE_STATUS_FINALLY,
    apiCall: () =>
      axios.put(
        `${server}/order/admin/update-status/${orderId}`,
        { status },
        { headers: getAuthHeaders("admin") }
      ),
    loadK: "isUpdating",
    sucMsg: `Status updated.`,
    showSuc: true,
  });

export const sellerUpdateRefundStatus = (orderId, status) => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.SELLER_UPDATE_REFUND_REQUEST,
    sucT: ORDER_ACTIONS.SELLER_UPDATE_REFUND_SUCCESS,
    failT: ORDER_ACTIONS.SELLER_UPDATE_REFUND_FAIL,
    finT: ORDER_ACTIONS.SELLER_UPDATE_REFUND_FINALLY,
    apiCall: () =>
      axios.put(
        `${server}/order/accept-refund/${orderId}`,
        { status },
        { headers: getAuthHeaders("seller") }
      ),
    loadK: "isUpdating",
    sucMsg: `Refund status updated.`,
    showSuc: true,
  });

// Action only fetches data; component calls DesignDownloader utility
export const adminGetDesignDataForDownload = (orderId, itemId) => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_REQUEST,
    sucT: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_SUCCESS,
    failT: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FAIL,
    finT: ORDER_ACTIONS.DOWNLOAD_DESIGN_DATA_FINALLY,
    apiCall: () =>
      axios.get(`${server}/order/download-design/${orderId}/${itemId}`, {
        headers: getAuthHeaders("admin"),
      }),
    loadK: "isDownloading",
  }).then((response) => response.designData); // Resolve with the designData for the component

export const userRequestRefund = (orderId, reason) => (dispatch) =>
  handleApiRequest({
    dispatch,
    reqT: ORDER_ACTIONS.USER_REQUEST_REFUND_REQUEST,
    sucT: ORDER_ACTIONS.USER_REQUEST_REFUND_SUCCESS,
    failT: ORDER_ACTIONS.USER_REQUEST_REFUND_FAIL,
    finT: ORDER_ACTIONS.USER_REQUEST_REFUND_FINALLY,
    // Ensure backend endpoint '/request-refund/:id' exists and expects this body
    apiCall: () =>
      axios.put(
        `${server}/order/request-refund/${orderId}`,
        { reason /*, status might be set by backend */ },
        { headers: getAuthHeaders("user") }
      ),
    loadK: "isUpdating",
    sucMsg: "Refund request submitted.",
    showSuc: true,
  });

// Action initiates spec download directly in browser
export const downloadOrderSpecs = (orderId) => async (dispatch) => {
  dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_REQUEST });
  try {
    const token =
      getFormattedBearerToken("token") ||
      getFormattedBearerToken("seller_token");
    if (!token) throw new Error("Authentication required.");

    const { data } = await axios.get(
      `${server}/order/download-specs/${orderId}`,
      { headers: { Authorization: token } }
    );
    if (!data.success || !data.specsData)
      throw new Error(data.message || "Failed to get specs data.");

    const jsonString = JSON.stringify(data.specsData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `order_specs_${orderId}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_SUCCESS });
    toast.success("Specifications download started.");
  } catch (error) {
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Failed to download specs.";
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_FAIL, payload: msg });
    toast.error(msg);
  } finally {
    dispatch({ type: ORDER_ACTIONS.DOWNLOAD_SPECS_FINALLY });
  }
};

export const clearErrors = () => (dispatch) =>
  dispatch({ type: ORDER_ACTIONS.CLEAR_ERRORS });
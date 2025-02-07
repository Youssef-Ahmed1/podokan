
import axios from "axios";
import { server } from "../../server";


axios.defaults.withCredentials = true;
const getAuthHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('token');
  const sellerToken = localStorage.getItem('seller_token');
  
  const headers = {
    'Accept': 'application/json',
    ...(isMultipart ? {} : {'Content-Type': 'application/json'})
  };

  if (sellerToken) {
    headers['Seller-Authorization'] = `Bearer ${sellerToken}`;
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Create product
export const createProduct = (formData) => async (dispatch) => {
  try {
    dispatch({ type: "productCreateRequest" });

    // Try to get auth headers
    let headers;
    try {
      headers = getAuthHeaders(true); // true for multipart/form-data
    } catch (error) {
      dispatch({ type: "productCreateFail", payload: "Authentication required" });
      throw new Error("Please login as a seller to create products");
    }

    const config = {
      headers,
      withCredentials: true
    };

    const { data } = await axios.post(
      `${server}/product/create-product`,
      formData,
      config
    );

    dispatch({ 
      type: "productCreateSuccess", 
      payload: data.product 
    });

    return data;
  } catch (error) {
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Clear tokens on authentication failure
      localStorage.removeItem('token');
      localStorage.removeItem('seller_token');
      
      dispatch({
        type: "productCreateFail",
        payload: "Session expired. Please login again"
      });
      
      // You might want to dispatch an action to clear user/seller state
      dispatch({ type: "clearSellerData" });
    } else {
      dispatch({
        type: "productCreateFail",
        payload: error.response?.data?.message || error.message || "Failed to create product"
      });
    }
    throw error;
  }
};
// Fetch pending products
export const fetchPendingProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "fetchPendingProductsRequest" });

    const token = localStorage.getItem('token');
    console.log('Using auth token for admin request:', token ? 'Token present' : 'No token');

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      withCredentials: true
    };

    const { data } = await axios.get(
      `${server}/product/admin/pending-products`,
      config
    );

    console.log('Pending products response:', data);

    dispatch({ 
      type: "fetchPendingProductsSuccess", 
      payload: data.products 
    });
  } catch (error) {
    console.error('Fetch pending products error:', {
      status: error.response?.status,
      message: error.response?.data?.message,
      error: error.message
    });
    
    dispatch({
      type: "fetchPendingProductsFail",
      payload: error.response?.data?.message || "Failed to fetch pending products"
    });
  }
};
// Approve/Reject product
// redux/actions/product.js
export const approveRejectProduct = (productId, status, reason, productData) => async (dispatch) => {
  try {
    dispatch({ type: "approveRejectProductRequest" });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true
    };

    const requestData = {
      status,
      statusReason: reason,
      originalPrice: Number(productData.originalPrice),
      discountPrice: Number(productData.discountPrice),
      DesignScale: productData.DesignScale,
      DesignPosition: productData.DesignPosition,
      mainTags: productData.mainTags,
      Designtags: productData.Designtags
    };

    const { data } = await axios.put(
      `${server}/product/approve-reject-product/${productId}`,
      requestData,
      config
    );

    dispatch({ 
      type: "approveRejectProductSuccess",
      payload: data
    });

    return data;

  } catch (error) {
    console.error('Approve/Reject Error:', error);
    dispatch({
      type: "approveRejectProductFail",
      payload: error.response?.data?.message || "Failed to update product status"
    });
    throw error;
  }
};// Get all products
export const getAllProducts = (page = 1, limit = 20) => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsRequest" });

    const config = {
      headers: getAuthHeaders(),
      withCredentials: true,
      params: { page, limit }
    };


    const { data } = await axios.get(`${server}/product/get-all-products`, config);

    // Handle the response with proper pagination
    const products = Array.isArray(data.products) ? data.products : [];

    dispatch({ 
      type: "getAllProductsSuccess", 
      payload: {
        products,
        currentPage: data.currentPage || 1,
        totalPages: data.totalPages || 1,
        totalProducts: data.totalProducts || 0,
      }
    });
    dispatch({
      type: "updatePagination",
      payload: {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message
    });
  }
};
export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsShopRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products-shop/${id}`);
    
    const products = data.products.map(product => ({
      ...product,
      availableColors: product.availableColors || ['white']
    }));

    dispatch({ type: "getAllProductsShopSuccess", payload: products });
  } catch (error) {
    dispatch({
      type: "getAllProductsShopFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
//
export const updateProductDesign = (productId) => async (dispatch) => {
  try {
    dispatch({ type: "updateProductDesignRequest" });

    const { data } = await axios.put(
      `${server}/product/update-product-design/${productId}`,
      { withCredentials: true }
    );

    dispatch({ type: "updateProductDesignSuccess", payload: data.message });
  } catch (error) {
    dispatch({
      type: "updateProductDesignFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({ type: "deleteProductRequest" });

    const { data } = await axios.delete(`${server}/product/delete-shop-product/${id}`, {
      withCredentials: true,
    });

    dispatch({ type: "deleteProductSuccess", payload: data.message });
  } catch (error) {
    dispatch({
      type: "deleteProductFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
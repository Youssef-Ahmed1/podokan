
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

    const config = {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Seller-Authorization': `Bearer ${localStorage.getItem('seller_token')}`,
        // Don't set Content-Type - let browser set it with boundary for multipart/form-data
      },
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
    dispatch({
      type: "productCreateFail",
      payload: error.response?.data?.message || "Failed to create product"
    });
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
// frontend/redux/actions/product.js

export const approveRejectProduct = (productId, status, reason) => async (dispatch) => {
  try {
    dispatch({ type: "approveRejectProductRequest" });

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      withCredentials: true,
      timeout: 30000
    };

    const response = await axios.put(
      `${server}/product/approve-reject-product/${productId}`,
      {
        status,
        statusReason: reason || ''
      },
      config
    );

    if (response.data.success) {
      dispatch({ 
        type: "approveRejectProductSuccess",
        payload: response.data
      });

      // Refresh products lists
      dispatch(fetchPendingProducts());
      dispatch(getAllProducts());

      return response.data;
    }
  } catch (error) {
    console.error('Approve/Reject Error:', error);
    dispatch({
      type: "approveRejectProductFail",
      payload: error.response?.data?.message || 
               "Failed to update product status"
    });
    throw error;
  }
};
// Get all products
export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products`, {
      headers: getAuthHeaders(),
      withCredentials: true
    });

    const products = data.products?.map(product => ({
      ...product,
      DesignScale: product.DesignScale || 1,
      DesignPosition: product.DesignPosition || { x: 50, y: 25 },
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || null,
      availableColors: Array.isArray(product.availableColors) 
        ? product.availableColors 
        : [product.ProductColor || 'white']
    })) || [];

    dispatch({ 
      type: "getAllProductsSuccess", 
      payload: products 
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
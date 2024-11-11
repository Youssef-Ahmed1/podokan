
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
      headers: getAuthHeaders(true), // true for multipart/form-data
      withCredentials: true,
      timeout: 30000
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

    return { 
      success: true, 
      product: data.product,
      message: data.message
    };
  } catch (error) {
    console.error("Product creation error:", error);
    throw error;
  }
};

// Fetch pending products
export const fetchPendingProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "fetchPendingProductsRequest" });
    
    const config = {
      headers: getAuthHeaders(),
      withCredentials: true,
      timeout: 60000 
    };

    const { data } = await axios.get(
      `${server}/product/admin/pending-products?limit=10`, 
      config
    );

    dispatch({ 
      type: "fetchPendingProductsSuccess", 
      payload: data.products 
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      dispatch({
        type: "fetchPendingProductsFail",
        payload: "Request timed out - please try again"
      });
    } else {
      dispatch({
        type: "fetchPendingProductsFail",
        payload: error.response?.data?.message || 
                 "Failed to fetch pending products"
      });
    }
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
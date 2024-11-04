// redux/actions/product.js

import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

// create product
// redux/actions/product.js

export const createProduct = (formData) => async (dispatch) => {
  try {
    dispatch({ type: "productCreateRequest" });

    // Ensure formData has the correct content type
    const config = {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('seller_token')}`,
      },
      withCredentials: true,
      timeout: 30000 // 30 second timeout
    };

    // Log formData contents for debugging
    const formDataObj = {};
    formData.forEach((value, key) => {
      try {
        formDataObj[key] = value instanceof Blob ? 'File' : value;
      } catch (err) {
        formDataObj[key] = value;
      }
    });
    console.log('Creating product with data:', formDataObj);

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
      message: data.message || "Product created successfully!"
    };

  } catch (error) {
    console.error("Product creation error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.error || 
                        error.message || 
                        "Failed to create product";

    dispatch({
      type: "productCreateFail",
      payload: errorMessage
    });

    throw new Error(errorMessage);
  }
};

export const fetchPendingProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "fetchPendingProductsRequest" });
    const { data } = await axios.get(`${server}/product/admin/pending-products`, {
      withCredentials: true,
    });
    
    if (!data || !data.products) {
      throw new Error('Invalid response format');
    }

    const products = Array.isArray(data.products) ? data.products.map(product => ({
      ...product,
      _id: product._id || '',
      designImage: product.designImage?.url || product.designImage || '',
      DesignPosition: product.DesignPosition || { x: 50, y: 50 },
      DesignScale: product.DesignScale || 1,
      ProductView: product.ProductView || 'front',
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || null,
      availableColors: product.availableColors || ['white'],
      status: product.status || 'pending',
      Designtags: Array.isArray(product.Designtags) ? product.Designtags : []
    })) : [];

    dispatch({ 
      type: "fetchPendingProductsSuccess", 
      payload: products 
    });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    dispatch({
      type: "fetchPendingProductsFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const approveRejectProduct = (productId, newStatus, rejectionReason, updates) => async (dispatch) => {
  try {
    dispatch({ type: "approveRejectProductRequest" });

    const cleanUpdates = {
      status: newStatus,
      statusReason: rejectionReason || '',
      originalPrice: parseFloat(updates.originalPrice) || 0,
      discountPrice: updates.discountPrice ? parseFloat(updates.discountPrice) : null,
      ProductType: updates.ProductType || 't-shirt',
      ProductColor: updates.ProductColor || 'white',
      ProductView: updates.ProductView || 'front',
      availableColors: Array.isArray(updates.availableColors) 
        ? updates.availableColors 
        : [updates.ProductColor || 'white']
    };

    console.log('Sending data:', {
      productId,
      cleanUpdates
    });

    const response = await axios.put(
      `${server}/product/approve-reject-product/${productId}`,
      cleanUpdates,
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Server response:', response.data);

    if (response.data.success) {
      dispatch({ 
        type: "approveRejectProductSuccess", 
        payload: {
          message: response.data.message,
          product: response.data.product
        }
      });

      // Refresh products lists
      await dispatch(fetchPendingProducts());
      await dispatch(getAllProducts());

      return { success: true, message: response.data.message };
    }
  } catch (error) {
    console.error('Action Error:', error);
    console.error('Error response:', error.response?.data);
    
    dispatch({
      type: "approveRejectProductFail",
      payload: error.response?.data?.message || error.message
    });

    throw error;
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

export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products`);

    const publicProducts = data.products
      .filter(product => product.status === 'public')
      .map(product => ({
        ...product,
        DesignScale: product.DesignScale || 1,
        DesignPosition: product.DesignPosition || { x: 50, y: 25 },
        originalPrice: product.originalPrice || 0,
        discountPrice: product.discountPrice || null,
        availableColors: Array.isArray(product.availableColors) 
          ? product.availableColors 
          : [product.ProductColor || 'white']
      }));

    console.log('Fetched products:', publicProducts.length);

    dispatch({ 
      type: "getAllProductsSuccess", 
      payload: publicProducts
    });
  } catch (error) {
    console.error("Error fetching all products:", error);
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
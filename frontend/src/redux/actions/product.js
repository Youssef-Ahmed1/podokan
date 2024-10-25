import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

// create product
export const createProduct = (formData) => async (dispatch) => {
  try {
    dispatch({ type: "productCreateRequest" });

    const { data } = await axios.post(`${server}/product/create-product`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });

    dispatch({ type: "productCreateSuccess", payload: data.product });
    return { success: true, message: "Product created successfully!" };
  } catch (error) {
    console.error("Error creating product:", error);
    let errorMessage = "An error occurred while creating the product.";
    if (error.response) {
      if (error.response.status === 413) {
        errorMessage = "File size exceeds the limit (50MB). Please choose a smaller file.";
      } else {
        errorMessage = error.response.data.message || errorMessage;
      }
      console.error("Error status:", error.response.status);
    } else if (error.request) {
      console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    dispatch({
      type: "productCreateFail",
      payload: errorMessage,
    });
    return { success: false, message: errorMessage };
  }
};

export const fetchPendingProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "fetchPendingProductsRequest" });
    const { data } = await axios.get(`${server}/product/admin/pending-products`, {
      withCredentials: true,
    });
    
    // Ensure we have an array of products
    const products = Array.isArray(data?.products) ? data.products.map(product => ({
      ...product,
      designImage: product.designImage 
        ? (typeof product.designImage === 'string' 
            ? product.designImage 
            : product.designImage.url)
        : null,
      DesignScale: product.DesignScale || 1,
      DesignPosition: product.DesignPosition || { x: 50, y: 50 },
      ProductView: product.ProductView || 'front',
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || null,
      availableColors: product.availableColors || ['white']
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
export const approveRejectProduct = ({ productId, status, statusReason, updates }) => async (dispatch) => {
  try {
    dispatch({ type: "approveRejectProductRequest" });

    const response = await axios.put(
      `${server}/product/approve-reject-product/${productId}`,
      { 
        status, 
        statusReason, 
        ...updates,
        visibility: status === 'public' ? 'public' : 'restricted',
        availableColors: updates.availableColors || ['white']
      },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.data.success) {
      dispatch({ 
        type: "approveRejectProductSuccess", 
        payload: response.data.message 
      });
      return { success: true, message: `Product ${status === 'public' ? 'approved' : status}` };
    } else {
      throw new Error(response.data.message || 'Failed to update product status');
    }
  } catch (error) {
    const errorMessage = error.response?.data?.message || error.message;
    console.error("Error in approveRejectProduct:", error);
    dispatch({
      type: "approveRejectProductFail",
      payload: errorMessage,
    });
    throw new Error(errorMessage);
  }
};
// get all products of a shop
export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsShopRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products-shop/${id}`);
    
    // Add availableColors to each product
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

// update product design
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

// delete product of a shop
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

// get all products (only approved ones)
export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products`);

    const approvedProducts = data.products
    .filter(product => product.status === 'public' || product.status === 'restricted')
    .map(product => ({
      ...product,
      DesignScale: product.DesignScale || 1,
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || product.originalPrice || 0,
      availableColors: product.availableColors || ['white'] // Added availableColors
    }));
    dispatch({ type: "getAllProductsSuccess", payload: approvedProducts });
  } catch (error) {
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
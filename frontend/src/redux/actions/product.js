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
    
    if (!data || !data.products) {
      throw new Error('Invalid response format');
    }

    // Ensure we have an array and transform the data
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

    const formattedData = {
      status: newStatus,
      statusReason: rejectionReason || '',
      visibility: newStatus === 'public' ? 'public' : 'restricted',
      ...updates,
      // Ensure arrays are properly formatted
      availableColors: Array.isArray(updates.availableColors) 
        ? updates.availableColors 
        : [updates.ProductColor || 'white'],
      availableProductTypes: Array.isArray(updates.availableProductTypes)
        ? updates.availableProductTypes
        : [updates.ProductType || 't-shirt'],
      mainTags: Array.isArray(updates.mainTags) ? updates.mainTags : [],
      Designtags: Array.isArray(updates.Designtags) ? updates.Designtags : [],
    };

    const response = await axios.put(
      `${server}/product/approve-reject-product/${productId}`,
      formattedData,
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

      // Refresh both pending and all products lists
      dispatch(fetchPendingProducts());
      if (newStatus === 'public') {
        dispatch(getAllProducts());
      }

      return { 
        success: true, 
        message: `Product ${newStatus === 'public' ? 'approved' : 'rejected'} successfully` 
      };
    } else {
      throw new Error(response.data.message || 'Failed to update product status');
    }
  } catch (error) {
    console.error("Error in approveRejectProduct:", error);
    dispatch({
      type: "approveRejectProductFail",
      payload: error.response?.data?.message || error.message,
    });
    throw error;
  }
};



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

export const getAllProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products`);

    // Only filter by status, not visibility
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

    console.log('Fetched products:', publicProducts.length); // Debug log

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
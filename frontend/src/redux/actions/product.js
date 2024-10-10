import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";
// create product
export const createProduct = (formData) => async (dispatch) => {
  try {
    dispatch({ type: "productCreateRequest" });

    // console.log("Sending formData:", formData);
    for (let pair of formData.entries()) {
      // console.log(pair[0] + ': ' + pair[1]);
    }

    const { data } = await axios.post(`${server}/product/create-product`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });

    // console.log("Server response:", data);

    dispatch({ type: "productCreateSuccess", payload: data.product });
    return { success: true, message: "Product created successfully!" };
  }  catch (error) {
    console.error("Error creating product:", error);
    if (error.response) {
      // console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
    } else if (error.request) {
      // console.error("No response received:", error.request);
    } else {
      console.error("Error setting up request:", error.message);
    }
    dispatch({
      type: "productCreateFail",
      payload: error.response?.data?.message || error.message,
    });
    return { success: false, message: error.response?.data?.message || "An error occurred while creating the product." };
  }
};
// fetch pending products (for admin)
export const fetchPendingProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "fetchPendingProductsRequest" });
    const { data } = await axios.get(`${server}/product/admin/pending-products`, {
      withCredentials: true,
    });
    
    const products = data.products.map(product => ({
      ...product,
      designImage: product.designImage 
        ? (typeof product.designImage === 'string' 
            ? product.designImage 
            : product.designImage.url)
        : null,
      DesignScale: product.DesignScale || 1,
      originalPrice: product.originalPrice || 0,
      discountPrice: product.discountPrice || product.originalPrice || 0
    }));

    // console.log("Fetched and processed pending products:", products);
    dispatch({ type: "fetchPendingProductsSuccess", payload: products });
  } catch (error) {
    console.error("Error fetching pending products:", error);
    dispatch({
      type: "fetchPendingProductsFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};


// approve or reject product (for admin)

export const approveRejectProduct = (productId, status, rejectionReason, updates) => async (dispatch) => {
  try {
    dispatch({ type: "approveRejectProductRequest" });

    // console.log("Sending request to approve/reject product");
    // console.log("Product ID:", productId);
    // console.log("Status:", status);
    // console.log("Rejection Reason:", rejectionReason);
    // console.log("Updates:", updates);

    const response = await axios.put(
      `${server}/product/approve-reject-product/${productId}`,
      { status, rejectionReason, ...updates },
      {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    // console.log("Server response:", response.data);

    if (response.data.success) {
      dispatch({ type: "approveRejectProductSuccess", payload: response.data.message });
      return { success: true, message: `Product status updated to ${status} successfully` };
    } else {
      throw new Error(response.data.message || 'Failed to update product status');
    }
  } catch (error) {
    console.error("Error in approveRejectProduct:", error);
    let errorMessage = "An unknown error occurred";
    if (error.response) {
      console.error("Error response:", error.response.data);
      console.error("Error status:", error.response.status);
      errorMessage = error.response.data.message || `Server error: ${error.response.status}`;
      if (error.response.data.stack) {
        console.error("Error stack:", error.response.data.stack);
      }
    } else if (error.request) {
      console.error("No response received:", error.request);
      errorMessage = "No response received from server";
    } else {
      console.error("Error setting up request:", error.message);
      errorMessage = error.message;
    }
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

    dispatch({ type: "getAllProductsShopSuccess", payload: data.products });
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
      discountPrice: product.discountPrice || product.originalPrice || 0
    }));
  // console.log("Approved products:", approvedProducts);
  dispatch({ type: "getAllProductsSuccess", payload: approvedProducts });
  } catch (error) {
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

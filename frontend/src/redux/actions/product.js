import axios from "axios";
import { server } from "../../server";

// create product
export const createProduct = (formData) => async (dispatch) => {
  try {
    dispatch({ type: "productCreateRequest" });

    const { data } = await axios.post(`${server}/product/create-product`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    });

    dispatch({ type: "productCreateSuccess", payload: data.product });
  } catch (error) {
    dispatch({
      type: "productCreateFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// fetch pending products (for admin)
export const fetchPendingProducts = () => async (dispatch) => {
  try {
    dispatch({ type: "fetchPendingProductsRequest" });

    const { data } = await axios.get(`${server}/admin/pending-products`, {
      withCredentials: true,
    });

    dispatch({ type: "fetchPendingProductsSuccess", payload: data.products });
  } catch (error) {
    dispatch({
      type: "fetchPendingProductsFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// approve or reject product (for admin)
export const approveRejectProduct = (productId, status, rejectionReason = "") => async (dispatch) => {
  try {
    dispatch({ type: "approveRejectProductRequest" });

    const { data } = await axios.put(
      `${server}/admin/product/${productId}/approve`,
      { status, rejectionReason },
      { withCredentials: true }
    );

    dispatch({ type: "approveRejectProductSuccess", payload: data.message });
    dispatch(fetchPendingProducts());
  } catch (error) {
    dispatch({
      type: "approveRejectProductFail",
      payload: error.response?.data?.message || error.message,
    });
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
export const updateProductDesign = (productId, newDesignImage) => async (dispatch) => {
  try {
    dispatch({ type: "updateProductDesignRequest" });

    const { data } = await axios.put(
      `${server}/product/update-product-design/${productId}`,
      { newDesignImage },
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

    const approvedProducts = data.products.filter(
      product => ['public', 'restricted', 'sitePick'].includes(product.status)
    );

    dispatch({ type: "getAllProductsSuccess", payload: approvedProducts });
  } catch (error) {
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

import axios from "axios";
import { server } from "../../server";

// create product
export const createProduct = (
  name,
  description,
  category,
  tags,
  originalPrice,
  discountPrice,
  stock,
  shopId,
  images
) => async (dispatch) => {
  try {
    dispatch({
      type: "productCreateRequest",
    });

    const { data } = await axios.post(`${server}/product/create-product`, {
      name,
      description,
      category,
      tags,
      originalPrice,
      discountPrice,
      stock,
      shopId,
      images,
      status: 'pending',
    });

    dispatch({
      type: "productCreateSuccess",
      payload: data.product,
    });
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
    dispatch({
      type: "fetchPendingProductsRequest",
    });

    const { data } = await axios.get(`${server}/admin/pending-products`, {
      withCredentials: true,
    });

    dispatch({
      type: "fetchPendingProductsSuccess",
      payload: data.products,
    });
  } catch (error) {
    dispatch({
      type: "fetchPendingProductsFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// approve or reject product (for admin)
export const approveRejectProduct = (productId, status, rejectionReason) => async (dispatch) => {
  try {
    dispatch({
      type: "approveRejectProductRequest",
    });

    const { data } = await axios.put(
      `${server}/admin/product/${productId}/approve`,
      { status, rejectionReason },
      { withCredentials: true }
    );

    dispatch({
      type: "approveRejectProductSuccess",
      payload: data.message,
    });

    dispatch(fetchPendingProducts());
  } catch (error) {
    dispatch({
      type: "approveRejectProductFail",
      payload: error.response?.data?.message || error.message,
    });
  }
};

export const getAllProductsShop = (id) => async (dispatch) => {
  try {
    dispatch({ type: "getAllProductsShopRequest" });

    const { data } = await axios.get(`${server}/product/get-all-products-shop/${id}`);
    
    const productsWithStatus = data.products.map(product => ({
      ...product,
      statusInfo: getStatusInfo(product.status),
    }));

    dispatch({
      type: "getAllProductsShopSuccess",
      payload: productsWithStatus,
    });
  } catch (error) {
    dispatch({
      type: "getAllProductsShopFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};

// Helper function to get status information
const getStatusInfo = (status) => {
  switch (status) {
    case 'pending':
      return 'Awaiting admin approval';
    case 'restricted':
      return 'Approved but only visible via direct link';
    case 'public':
      return 'Approved and publicly visible';
    case 'sitePick':
      return 'Approved and promoted by the site';
    case 'rejected':
      return 'Rejected by admin';
    default:
      return 'Unknown status';
  }
};

// delete product of a shop
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({
      type: "deleteProductRequest",
    });

    const { data } = await axios.delete(`${server}/product/delete-shop-product/${id}`, {
      withCredentials: true,
    });

    dispatch({
      type: "deleteProductSuccess",
      payload: data.message,
    });
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
    dispatch({
      type: "getAllProductsRequest",
    });

    const { data } = await axios.get(`${server}/product/get-all-products`);
    
    // Filter out products that are not approved
    const approvedProducts = data.products.filter(
      product => ['public', 'restricted', 'sitePick'].includes(product.status)
    );

    dispatch({
      type: "getAllProductsSuccess",
      payload: approvedProducts,
    });
  } catch (error) {
    dispatch({
      type: "getAllProductsFailed",
      payload: error.response?.data?.message || error.message,
    });
  }
};
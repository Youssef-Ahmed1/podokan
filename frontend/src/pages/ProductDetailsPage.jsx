// src/pages/ProductDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import ProductDetails from "../components/Products/ProductDetails";
import SuggestedProduct from "../components/Products/SuggestedProduct";
import { useSelector } from "react-redux";
import Loader from "../components/Layout/Loader";
import axios from "axios";
import { server } from "../server";

const ProductDetailsPage = () => {
  const { allProducts } = useSelector((state) => state.products);
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${server}/product/get-product/${id}`);
        setData(response.data.product);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch product details");
        toast.error(err.response?.data?.message || "Failed to fetch product details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Find related products based on main tag
  const suggestedProducts = allProducts?.filter(
    (product) => 
      product._id !== id && 
      product.Maintag === data?.Maintag &&
      product.status === 'public' &&
      product.visibility === 'public'
  ).slice(0, 4);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Product not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <ProductDetails data={data} />
      {suggestedProducts?.length > 0 && (
        <div className="p-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Related Products
          </h2>
          <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-4 lg:gap-[25px] xl:grid-cols-4 xl:gap-[30px] mb-12">
            {suggestedProducts.map((product) => (
              <SuggestedProduct key={product._id} data={product} />
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
// src/pages/ProductDetailsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Footer from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import ProductDetails from "../components/Products/ProductDetails";
import SuggestedProduct from "../components/Products/SuggestedProduct";
import { useSelector } from "react-redux";
import Loader from "../components/Layout/Loader";
import axios from "axios";
import { server } from "../server";
import { toast } from "react-toastify";

const ProductDetailsPage = () => {
  const { allProducts } = useSelector((state) => state.products);
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState(null);

  // Process product data to ensure consistent design positioning
  const processProductData = useCallback((productData) => {
    if (!productData) return null;

    return {
      ...productData,
      DesignPosition: productData.DesignPosition || { x: 50, y: 40 },
      DesignScale: productData.DesignScale || 0.8,
      designImage: productData.designImage?.url || productData.designImage || '',
      ProductType: productData.ProductType || 'hoodie',
      ProductColor: productData.ProductColor || 'white',
      ProductView: productData.ProductView || 'front',
      // Ensure other required fields have default values
      mainTags: Array.isArray(productData.mainTags) ? productData.mainTags : [],
      Designtags: Array.isArray(productData.Designtags) ? productData.Designtags : [],
      DesignTitle: productData.DesignTitle || 'Untitled Design',
      Description: productData.Description || '',
      originalPrice: productData.originalPrice || 0,
      discountPrice: productData.discountPrice || productData.originalPrice,
      status: productData.status || 'draft',
      visibility: productData.visibility || 'private'
    };
  }, []);

  // Fetch product data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${server}/product/get-product/${id}`);
        const rawData = response.data.product;
        setData(rawData);
        
        // Process the data to ensure consistent design display
        const processed = processProductData(rawData);
        setProcessedData(processed);
      } catch (err) {
        const errorMessage = err.response?.data?.message || "Failed to fetch product details";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, processProductData]);

  // Find related products based on main tag
  const suggestedProducts = allProducts?.filter(
    (product) => 
      product._id !== id && 
      product.Maintag === processedData?.Maintag &&
      product.status === 'public' &&
      product.visibility === 'public'
  ).slice(0, 4);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Error state
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

  // Not found state
  if (!processedData) {
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow">
        <ProductDetails 
          data={processedData}
          key={`${processedData._id}-${processedData.DesignScale}-${processedData.DesignPosition.x}-${processedData.DesignPosition.y}`}
        />
        
        {suggestedProducts?.length > 0 && (
          <div className="p-4 max-w-[1280px] mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Related Products
            </h2>
            <div className="grid grid-cols-1 gap-[20px] md:grid-cols-2 md:gap-[25px] lg:grid-cols-4 lg:gap-[25px] xl:grid-cols-4 xl:gap-[30px] mb-12">
              {suggestedProducts.map((product) => (
                <SuggestedProduct 
                  key={product._id} 
                  data={processProductData(product)} 
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
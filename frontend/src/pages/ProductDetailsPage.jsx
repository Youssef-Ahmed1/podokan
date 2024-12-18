// pages/ProductDetailsPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Footer from "../components/Layout/Footer";
import Header from "../components/Layout/Header";
import ProductDetails from "../components/Products/ProductDetails";
import SuggestedProduct from "../components/Products/SuggestedProduct";
import { useSelector } from "react-redux";

const ProductDetailsPage = () => {
  const { allProducts } = useSelector((state) => state.products);
  const { allEvents } = useSelector((state) => state.events);
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const eventData = searchParams.get("isEvent");

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top when component mounts
    
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (eventData !== null) {
          const event = allEvents?.find((i) => i._id === id);
          setData(event || null);
        } else {
          const product = allProducts?.find(
            (i) => i._id === id && i.status === 'public'
          );
          setData(product || null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [allProducts, allEvents, id, eventData]);

  // Meta tags for SEO
  useEffect(() => {
    if (data) {
      document.title = `${data.name || data.DesignTitle} | Your Store Name`;
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', data.Description || '');
      }
    }
  }, [data]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      {isLoading ? (
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
        </div>
      ) : !data ? (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            The product you're looking for might have been removed or is temporarily unavailable.
          </p>
        </div>
      ) : (
        <>
          <ProductDetails data={data} />
          {!eventData && <SuggestedProduct data={data} />}
        </>
      )}
      <Footer />
    </div>
  );
};

export default ProductDetailsPage;
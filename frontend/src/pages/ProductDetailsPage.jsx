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
    const [searchParams] = useSearchParams();
    const eventData = searchParams.get("isEvent");
    const [error, setError] = useState(null);
  
    useEffect(() => {
      try {
        if (eventData !== null) {
          const eventItem = allEvents && allEvents.find((i) => i._id === id);
          setData(eventItem);
        } else {
          const product = allProducts && allProducts.find((i) => i._id === id);
          
          // Verify product is public and visible
          if (product && product.status === 'public' && product.visibility === 'public') {
            setData(product);
          } else {
            setError('Product not available');
          }
        }
      } catch (err) {
        console.error('Error loading product:', err);
        setError('Failed to load product');
      }
    }, [allProducts, allEvents, id, eventData]);
  
    if (error) {
      return (
        <div>
          <Header />
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-2">{error}</h2>
              <p className="text-gray-600">The product you're looking for is not available.</p>
            </div>
          </div>
          <Footer />
        </div>
      );
    }
  
    return (
      <div>
        <Header />
        {data ? (
          <>
            <ProductDetails data={data} />
            {!eventData && <SuggestedProduct data={data} />}
          </>
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}
        <Footer />
      </div>
    );
  };

export default ProductDetailsPage;
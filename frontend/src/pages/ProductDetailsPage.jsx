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

  useEffect(() => {
    try {
      if (eventData !== null) {
        const eventItem = allEvents && allEvents.find((i) => i._id === id);
        setData(eventItem);
      } else {
        // Show all products with public status, regardless of visibility
        const product = allProducts && allProducts.find(
          (i) => i._id === id && i.status === 'public'
        );
        
        if (product) {
          setData(product);
        }
      }
    } catch (err) {
      console.error('Error loading product:', err);
    }
  }, [allProducts, allEvents, id, eventData]);

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
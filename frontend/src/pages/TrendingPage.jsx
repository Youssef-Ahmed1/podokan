// pages/TrendingPage.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import ProductCard from '../components/Route/ProductCard/ProductCard';

const TrendingPage = () => {
  const { allProducts } = useSelector((state) => state.products);

  const sections = [
    {
      title: "Trending Now",
      products: allProducts?.filter(p => p.trending)?.slice(0, 8) || []
    },
    {
      title: "New Arrivals",
      products: allProducts?.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      )?.slice(0, 8) || []
    },
    {
      title: "Popular Designs",
      products: allProducts?.sort((a, b) => 
        b.sold_out - a.sold_out
      )?.slice(0, 8) || []
    }
  ];

  return (
    <div className="bg-white">
      {sections.map(section => (
        <section key={section.title} className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-[#4e64df] to-[#b131ea] 
              bg-clip-text text-transparent">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {section.products.map(product => (
                <ProductCard key={product._id} data={product} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
};

export default TrendingPage;
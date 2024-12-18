import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const FeaturedProduct = () => {
  const { allProducts, isLoading } = useSelector((state) => state.products);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;

  const publicProducts = useMemo(() => {
    return allProducts.filter(product => product.status === 'public');
  }, [allProducts]);

  const currentProducts = useMemo(() => {
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    return publicProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  }, [publicProducts, currentPage]);

  const pageNumbers = Math.ceil(publicProducts.length / productsPerPage);

  return (
    <div className="bg-[#1E1E2D] py-10">
      <div className={`${styles.section}`}>
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-center md:text-left mb-4 md:mb-0"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Featured Designs
              </h2>
              <p className="text-gray-400">
                Explore our most popular and trending designs
              </p>
            </motion.div>
          </div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {isLoading ? (
                Array(8).fill(0).map((_, index) => (
                  <div key={index} className="bg-[#2A2A3C] rounded-xl p-4">
                    <Skeleton height={200} baseColor="#3D3D56" highlightColor="#4A4A6A"/>
                    <div className="mt-4">
                      <Skeleton count={2} baseColor="#3D3D56" highlightColor="#4A4A6A"/>
                    </div>
                  </div>
                ))
              ) : currentProducts.length > 0 ? (
                currentProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <ProductCard data={product} />
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <div className="text-5xl mb-4">✨</div>
                  <p className="text-gray-400">No featured products available</p>
                </div>
              )}
            </div>
          </AnimatePresence>

          {/* Pagination */}
          {pageNumbers > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-full bg-[#2A2A3C] text-white 
                  hover:bg-[#3D3D56] disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-all"
              >
                ←
              </button>
              
              {Array.from({ length: pageNumbers }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-10 h-10 rounded-full transition-all
                    ${currentPage === index + 1
                      ? 'bg-[#6366F1] text-white'
                      : 'bg-[#2A2A3C] text-gray-300 hover:bg-[#3D3D56]'
                    }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageNumbers))}
                disabled={currentPage === pageNumbers}
                className="px-4 py-2 rounded-full bg-[#2A2A3C] text-white 
                  hover:bg-[#3D3D56] disabled:opacity-50 disabled:cursor-not-allowed 
                  transition-all"
              >
                →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeaturedProduct;

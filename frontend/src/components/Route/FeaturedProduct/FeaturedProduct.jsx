import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import styles from "../../../styles/styles";
import ProductCard from "../ProductCard/ProductCard";

const FeaturedProduct = () => {
  const { allProducts } = useSelector((state) => state.products);
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
    <div className={`${styles.section}`}>
      <div className="flex flex-col gap-8">
        {/* Section Header */}
        <div className={`${styles.heading}`}>
          <h1>Featured Designs</h1>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => (
              <ProductCard key={product._id} data={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 font-Roboto">No featured products available</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pageNumbers > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pageNumbers }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                className={`w-10 h-10 rounded-full font-Roboto font-[500] transition-all
                  ${currentPage === index + 1
                    ? 'bg-[#333] text-white'
                    : 'bg-gray-100 text-[#333] hover:bg-gray-200'
                  }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedProduct;

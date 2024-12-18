import React from 'react'
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { motion } from "framer-motion";

const ArtistSign = () => {
    const { isSeller } = useSelector((state) => state.seller);
    const location = useLocation();
    
    if (location.pathname !== '/') return null;

    return (
      <div className="w-full px-4 md:px-8 lg:px-12 py-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-r from-[#2b2b3b] to-[#363650] rounded-xl overflow-hidden"
        >
          <div className="flex flex-col md:flex-row items-center justify-between p-6 md:p-8">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-white text-xl md:text-2xl font-semibold mb-2">
                Turn your passion into profit
              </h2>
              <p className="text-gray-300">
                Sell your art on podokan today!
              </p>
            </div>
            
            <Link 
              to={`${isSeller ? "/dashboard" : "/shop-create"}`}
              className="inline-flex items-center px-6 py-3 bg-[#4e64df] hover:bg-[#4055d0] 
                transition-all duration-300 rounded-xl text-white font-medium"
            >
              {isSeller ? "Go Dashboard" : "Artist SignUp"}
              <FiArrowRight className="ml-2" />
            </Link>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100 0v100H0C0 44.8 44.8 0 100 0z" fill="currentColor"/>
            </svg>
          </div>
        </motion.div>
      </div>
    );
};

export default ArtistSign;

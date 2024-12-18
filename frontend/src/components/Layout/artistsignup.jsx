// components/ArtistSign/ArtistSign.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { FiArrowRight } from 'react-icons/fi';

const ArtistSign = () => {
  const { isSeller } = useSelector((state) => state.seller);
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="relative bg-white rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50" />
        
        <div className="relative px-6 py-12 sm:px-12 sm:py-16">
          <div className="text-center max-w-2xl mx-auto">
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Turn Your Passion into Profit
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join our community of artists and start selling your designs today
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to={isSeller ? "/dashboard" : "/shop-create"}
                className="inline-flex items-center px-8 py-3 bg-[#4e64df] text-white
                  rounded-full font-medium shadow-lg hover:bg-[#4055d0] transition-colors
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4e64df]"
              >
                <span>{isSeller ? "Go to Dashboard" : "Start Selling"}</span>
                <FiArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </motion.div>

            {!isSeller && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-6 text-sm text-gray-500"
              >
                No registration fees. Start earning today.
              </motion.p>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 hidden sm:block">
          <svg
            width="404"
            height="384"
            fill="none"
            viewBox="0 0 404 384"
            className="text-gray-100 transform rotate-45"
          >
            <defs>
              <pattern
                id="de316486-4a29-4312-bdfc-fbce2132a2c1"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect
              width="404"
              height="384"
              fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c1)"
            />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 hidden sm:block">
          <svg
            width="404"
            height="384"
            fill="none"
            viewBox="0 0 404 384"
            className="text-gray-100 transform -rotate-45"
          >
            <defs>
              <pattern
                id="de316486-4a29-4312-bdfc-fbce2132a2c2"
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <rect x="0" y="0" width="4" height="4" fill="currentColor" />
              </pattern>
            </defs>
            <rect
              width="404"
              height="384"
              fill="url(#de316486-4a29-4312-bdfc-fbce2132a2c2)"
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default ArtistSign;
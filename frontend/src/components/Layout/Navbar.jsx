import React from 'react';
import { Link } from 'react-router-dom';
import { categoriesData } from '../../static/data';

const Navbar = ({ active }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/all-designs" className="text-white hover:text-gray-300 mr-4">Shop All Designs</Link>
        {categoriesData.slice(0, 8).map((category) => (
          <Link key={category.id} to={`/category/${category.title.toLowerCase()}`} className="flex items-center text-white hover:text-gray-300 mr-4">
            <img src={category.icon} alt={category.title} className="w-5 h-5 mr-1" />
            {category.title}
          </Link>
        ))}
      </div>
      <div className="flex items-center">
        {categoriesData.slice(8).map((category) => (
          <Link key={category.id} to={`/category/${category.title.toLowerCase()}`} className="flex items-center text-white hover:text-gray-300 ml-4">
            <img src={category.icon} alt={category.title} className="w-5 h-5 mr-1" />
            {category.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Navbar;
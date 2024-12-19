// src/pages/HomePage.jsx
import React from 'react';
import Header from "../components/Layout/Header";
import BestDeals from "../components/Route/BestDeals/BestDeals";
import FeaturedProduct from "../components/Route/FeaturedProduct/FeaturedProduct";
import Footer from "../components/Layout/Footer";
import ArtistSign from "../components/Layout/artistsignup";
import CategoryFinder from '../components/Route/CategoryFinder/CategoryFinder';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-[#F6F6F5]">
      <Header activeHeading={1} />
      <div className="bg-[#151523]">
        <ArtistSign/>
      </div>
      <CategoryFinder />
      <div className="max-w-[1200px] mx-auto">
        <BestDeals />
        <FeaturedProduct />
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;
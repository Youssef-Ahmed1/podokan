import React from 'react'
import Header from "../components/Layout/Header";
import Hero from "../components/Route/Hero/Hero";
import BestDeals from "../components/Route/BestDeals/BestDeals";
import FeaturedProduct from "../components/Route/FeaturedProduct/FeaturedProduct";
// import Events from "../components/Events/Events";
import Sponsored from "../components/Route/Sponsored";
import Footer from "../components/Layout/Footer";
import ArtistSign from "../../src/components/Layout/artistsignup";
import CategoryFinder from '../routes/CategoryFinder/CategoryFinder'

const HomePage = () => {
  return (
    <div>
      <Header activeHeading={1} />
      <div className="bg-[#151523] rounded-b-lg">
        <ArtistSign/>
      </div>
      <CategoryFinder /> {/* Add it here */}
      <BestDeals />
      <FeaturedProduct />
      <Footer />
    </div>
  );
};

export default HomePage
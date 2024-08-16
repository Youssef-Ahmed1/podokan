import React from 'react';
import homepageHero from '/home/user/podokan/frontend/src/Assests/homepageHero.webp';

const Hero = () => {
  return (
    <div className="bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto ">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 ">
          <div className="md:col-span-4">
            <img 
              src={homepageHero} 
              alt="T-shirt designs collage" 
              className="w-full h-auto rounded-lg shadow-md relative left-64"
            />
          </div>
          <div className="md:col-span-1 bg-purple-600 text-white rounded-lg shadow-md flex flex-col justify-center items-center p-4 relative right-[1040px]">
            <h2 className="text-5xl font-bold mb-4">only for 72 hours</h2>
            <h3 className="text-2xl font-semibold mb-4 text-center">NEW DESIGNS OUT NOW!</h3>
            <button className="bg-orange-500 text-white px-6 py-2 rounded-full text-lg font-semibold hover:bg-orange-600 transition duration-300">
              SHOP NOW
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
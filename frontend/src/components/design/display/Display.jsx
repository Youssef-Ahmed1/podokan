import React from 'react';
import './Display.css';

const Display = ({ tshirtColor, designImg, productType, productView, designScale }) => {
  const tshirtImageUrl = `https://res.cloudinary.com/dkot9tyjm/image/upload/v1714163748/shirts/mockup${productType}-${tshirtColor}-${productView}.png`;

  return (
    <div className='display-container'>
      <div className='imgTshirt text-center'>
        <img 
          className='img-responsive'
          src={tshirtImageUrl}
          alt='Product'
        />
        {designImg && (
          <div 
            className='design-overlay'
            style={{
              backgroundImage: `url(${designImg})`,
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              transform: `scale(${designScale})`,
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '50%',
              height: '50%',
              transformOrigin: 'center',
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Display;

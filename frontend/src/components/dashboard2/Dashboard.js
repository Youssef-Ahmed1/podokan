import React from 'react';
import Display from '../design/display/Display';

const Dashboard = ({
  productType,
  productColor,
  productView,
  DesignScale,
  designImage,
}) => {
  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <Display
            tshirtColor={productColor}
            designImg={designImage}
            productType={productType}
            productView={productView}
            DesignScale={DesignScale}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

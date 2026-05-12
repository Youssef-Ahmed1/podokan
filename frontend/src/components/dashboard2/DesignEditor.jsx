import React, { useState, useRef } from 'react';
import { Rnd } from 'react-rnd';

const DesignEditor = () => {
  const [DesignPosition, setDesignPosition] = useState({ x: -19, y: 23 });
  const [designSize, setDesignSize] = useState({ width: 214, height: 214 });
  const designRef = useRef(null);

  const handleDragStop = (e, d) => {
    setDesignPosition({ x: d.x, y: d.y });
  };

  const handleReSizeStop = (e, direction, ref, delta, position) => {
    setDesignPosition({ x: position.x, y: position.y });
    setDesignSize({ width: ref.style.width, height: ref.style.height });
  };

  return (
      <div className="design_div" style={{ position: "relative" }}>
          <Rnd
              ref={designRef}
              size={designSize}
              position={DesignPosition}
              onDragStop={handleDragStop}
              onReSizeStop={handleReSizeStop}
              bounds="parent"
              enableResizing={true}
          >
              <img
                  id="design"
                  className="design"
                  src={`https://res.cloudinary.com/dkot9tyjm/image/upload/v1714163748/shirts/mockupshirt-/${this.state.tshirtColor}.png`}
                  data-id="845"
                  alt="design"
                  style={{ width: "100%", height: "100%" }}
              />
          </Rnd>
      </div>
  );
};

export default DesignEditor;

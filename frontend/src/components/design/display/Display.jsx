import React, { useState, useEffect, useRef } from 'react';
import './Display.css';
import { Rnd } from 'react-rnd';

const Display = ({ tshirtColor, designImg, onDesignUpload, onDragStop, onResizeStop }) => {
    const [designDimensions, setDesignDimensions] = useState({ width: 200, height: 200, x: 250, y: 300 });
    const designRef = useRef(null);
    const borderRef = useRef(null);

    useEffect(() => {
        if (designImg) {
            updateDesignDimensions();
        }
    }, [designImg, tshirtColor]);

    const updateDesignDimensions = () => {
        const tshirtImg = new Image();
        tshirtImg.crossOrigin = "anonymous";
        tshirtImg.src = `https://res.cloudinary.com/dkot9tyjm/image/upload/v1714163748/shirts/mockupshirt-${tshirtColor}.png`;
        
        tshirtImg.onload = () => {
            const DesignScale = 0.8;
            const designWidth = tshirtImg.width * DesignScale;
            const loadedDesignImg = new Image();
            loadedDesignImg.onload = () => {
                const scale = designWidth / loadedDesignImg.width;
                const designHeight = loadedDesignImg.height * scale;
                const x = (tshirtImg.width - designWidth) / 2;
                const y = (tshirtImg.height - designHeight) / 2;
                setDesignDimensions({ width: designWidth, height: designHeight, x, y });
            };
            loadedDesignImg.src = designImg;
        };
    };

    const handleDragStop = (e, d) => {
        setDesignDimensions(prev => ({ ...prev, x: d.x, y: d.y }));
        if (onDragStop) {
            onDragStop(e, d);
        }
    };

    const handleResizeStop = (e, direction, ref, delta, position) => {
        setDesignDimensions(prev => ({
            ...prev,
            width: ref.style.width,
            height: ref.style.height,
            ...position,
        }));
        if (onResizeStop) {
            onResizeStop(e, direction, ref, delta, position);
        }
    };

    return (
        <div className='display-container'>
            <div className='imgTshirt text-center'>
                <img 
                    className='img-responsive'
                    src={`https://res.cloudinary.com/dkot9tyjm/image/upload/v1714163748/shirts/mockupshirt-${tshirtColor}.png`}
                    alt='T-shirt'
                />
                <div className='tshirt-border' ref={borderRef}></div>
                {designImg && (
                    <Rnd
                        size={{ width: designDimensions.width, height: designDimensions.height }}
                        position={{ x: designDimensions.x, y: designDimensions.y }}
                        onDragStop={handleDragStop}
                        onResizeStop={handleResizeStop}
                        bounds='.tshirt-border'
                    >
                        <img src={designImg} alt='Design' className='design-image' ref={designRef} />
                    </Rnd>
                )}
            </div>
            <div className="design-upload-area mt-4">
                <div className="bg-gray-100 w-[400px] h-[400px] mx-auto flex flex-col items-center justify-center">
                    {designImg ? (
                        <img src={designImg} alt="Design Preview" className="w-full h-full object-contain" />
) : (
<>
<p className="text-gray-500 mb-4">Your design will appear here</p>
<button onClick={onDesignUpload} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" >
Upload Design
</button>
</>
)}
</div>
</div>
</div>
);
};

export default Display;
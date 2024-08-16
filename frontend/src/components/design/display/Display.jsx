import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import './Display.css';
import { Rnd } from 'react-rnd';

const Display = ({ tshirtColor, designImg, onDragStop, onResizeStop }) => {
    const [designDimensions, setDesignDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });
    const designRef = useRef(null);
    const borderRef = useRef(null);

    useEffect(() => {
        const updateDesignDimensions = () => {
            const tshirtImg = new Image();
            tshirtImg.crossorigin = "anonymous";
            tshirtImg.src = `https://res.cloudinary.com/dkot9tyjm/image/upload/v1714163748/shirts/mockupshirt-${this.state.tshirtColor}.png`;
            
            const designImg = new Image();
            designImg.crossorigin = "anonymous";
            designImg.src = this.state.designImg;
            tshirtImg.onload = () => {
                const designScale = 0.8;
                const designWidth = tshirtImg.width * designScale;
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
            tshirtImg.src = tshirtImgSrc;
        };

        if (tshirtColor && designImg) {
            updateDesignDimensions();
        }
    }, [tshirtColor, designImg]);

    useLayoutEffect(() => {
        checkDesignBorder();
    }, [designDimensions]);

    const handleDragStop = (e, d) => {
        setDesignDimensions(prev => ({ ...prev, x: d.x, y: d.y }));
        if (onDragStop) {
            onDragStop(e, d);
        }
    };

    const handleResizeStop = (e, direction, ref) => {
        setDesignDimensions(prev => ({
            ...prev,
            width: ref.offsetWidth,
            height: ref.offsetHeight
        }));
        if (onResizeStop) {
            onResizeStop(e, direction, ref);
        }
    };

    const checkDesignBorder = () => {
        const designRect = designRef.current.getBoundingClientRect();
        const borderRect = borderRef.current.getBoundingClientRect();

        if (
            designRect.left < borderRect.left ||
            designRect.right > borderRect.right ||
            designRect.top < borderRect.top ||
            designRect.bottom > borderRect.bottom
        ) {
            designRef.current.style.opacity = '0';
        } else {
            designRef.current.style.opacity = '1';
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
                        enableResizing={true}
                    >
                        <img src={designImg} alt='Design' className='design-image' ref={designRef} />
                    </Rnd>
                )}
            </div>
        </div>
    );
};

export default Display;
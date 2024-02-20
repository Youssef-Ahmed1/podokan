import React, { useState, useEffect, useRef } from 'react';
import './Display.css';
import { Rnd } from 'react-rnd';

const Display = ({ tshirtColor, designImg, onDragStop, onResizeStop }) => {
    const [designDimensions, setDesignDimensions] = useState({ width: 0, height: 0, x: 0, y: 0 });
    const canvasRef = useRef(null);    
     
    useEffect(() => {
        const updateDesignDimensions = async () => {
            const tshirtImgSrc = `https://res.cloudinary.com/dkkgmzpqd/image/upload/v1545217305/T-shirt%20Images/${tshirtColor}.png`;
            const tshirtImg = await loadImage(tshirtImgSrc);
            const designImgLoaded = await loadImage(designImg);

            const designScale = 0.5;
            const designWidth = tshirtImg.width * designScale;
            const scale = designWidth / designImgLoaded.width;
            const designHeight = designImgLoaded.height * scale;
            const x = (tshirtImg.width - designWidth) / 2;
            const y = (tshirtImg.height - designHeight) / 2;

            setDesignDimensions({ width: designWidth, height: designHeight, x, y });
        };

        if (tshirtColor && designImg) {
            updateDesignDimensions();
        }
    }, [tshirtColor, designImg]);




    const loadImage = (src) => {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error("Image source URL is undefined or empty."));
                return;
            }
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.error("Error loading image:", src);
                reject(new Error(`Failed to load image: ${src}`));
            };
            img.src = src;
        });
    };
    
    const drawImagesOnCanvas = async () => {
        const tshirtImgSrc = `https://res.cloudinary.com/dkkgmzpqd/image/upload/v1545217305/T-shirt%20Images/${tshirtColor}.png`;
        const designImgSrc = designImg; // Ensure this is a valid URL
    
        try {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
    
            const tshirtImg = await loadImage(tshirtImgSrc);
            const designImg = await loadImage(designImgSrc);
    
            canvas.width = tshirtImg.width;
            canvas.height = tshirtImg.height;
            ctx.drawImage(tshirtImg, 0, 0, tshirtImg.width, tshirtImg.height);
    
            const { width, height, x, y } = designDimensions;
    
            // Adjust the position
            const adjustedX = x - 12; // Adjust based on your requirements
            const adjustedY = y - 4; // Adjust based on your requirements
    
            ctx.drawImage(designImg, adjustedX, adjustedY, width, height);
        } catch (error) {
            console.error("Error loading images:", error);
        }
    };
    
    
    const downloadCompositeImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error("Canvas is null at the time of download.");
            return;
        }
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = `Design_${new Date().getTime()}.png`;
        link.href = image;
        link.click();
    };
    
    
        const handleDownloadClick = async () => {
            await drawImagesOnCanvas();
            downloadCompositeImage();
        };
    
        const handleDragStop = (e, d) => {
            setDesignDimensions(prev => ({ ...prev, x: d.x, y: d.y }));
        };
            
        const handleResizeStop = (e, direction, ref) => {
            setDesignDimensions(prev => ({
                ...prev,
                width: ref.offsetWidth,
                height: ref.offsetHeight
            }));
        };
    
        
   
        return (
            <div className=''>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                <div className='imgTshirt text-center'>
                    <img 
                        className='img-responsive'
                        src={`https://res.cloudinary.com/dkkgmzpqd/image/upload/v1545217305/T-shirt%20Images/${tshirtColor}.png`}
                        alt='T-shirt'
                    />
                    {designImg && (
                        <button className="btn btn-primary" onClick={handleDownloadClick}>
                            Download Design
                        </button>
                    )}
                    {designImg && (
                        <Rnd
                            size={{ width: designDimensions.width, height: designDimensions.height }}
                            position={{ x: designDimensions.x, y: designDimensions.y }}
                            onDragStop={handleDragStop}
                            onResizeStop={handleResizeStop}
                            enableResizing={{
                                top:true, right:true, bottom:true, left:true,
                                topRight:true, bottomRight:true, bottomLeft:true, topLeft:true
                            }}
                        >
                            <img src={designImg} alt='Design' className='design-image' />
                        </Rnd>
                    )}
                </div>
            </div>
        );
    };

export default Display;

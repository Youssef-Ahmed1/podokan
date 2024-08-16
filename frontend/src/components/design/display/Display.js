import React from 'react';
import './Display.css';
import { Rnd } from 'react-rnd';

const Display = ({ tshirtColor, designImg, width, height, x, y, onDragStop, onResizeStop }) => {
    return (
        <div className='display-container'>
            <div className='imgTshirt text-center'>
                <img 
                    className='img-responsive'
                    src={`https://res.cloudinary.com/dkot9tyjm/image/upload/v1714163738/shirts/mockupshirt-${tshirtColor}.png`}
                    alt='T-shirt'
                />
                
                <div className='tshirt-border'></div>
                {designImg && 
                    <Rnd
                        size={{ width, height }}
                        position={{ x, y }}
                        onDragStop={onDragStop}
                        onResizeStop={onResizeStop}
                        bounds='.tshirt-border'
                        enableResizing={{
                            top: true, right: true, bottom: true, left: true,
                            topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
                        }}
                    >
                        <img src={designImg} alt='Design' className='design-image' />
                    </Rnd>
                }
            </div>
        </div>
    );
};

export default Display;
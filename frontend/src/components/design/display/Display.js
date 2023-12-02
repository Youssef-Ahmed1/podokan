import React from 'react';
import './Display.css';
import { Rnd } from 'react-rnd';

const Display = ({ tshirtColor, designImg, width, height, x, y, onDragStop, onResizeStop }) => {
    return (
        <div className=''>
            <div className='imgTshirt text-center'>
                <img 
                    className='img-responsive'
                    src={`https://res.cloudinary.com/dkkgmzpqd/image/upload/v1545217305/T-shirt%20Images/${tshirtColor}.png`}
                    alt='T-shirt'
                />
                  {designImg && 
                    <Rnd
                        size={{ width, height }}
                        position={{ x, y }}
                        onDragStop={onDragStop}
                        onResizeStop={onResizeStop}
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

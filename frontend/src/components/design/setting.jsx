import React from 'react';

const Setting = ({ onColorChange, uploadImage }) => {
    return (
        <div className=" bg-light container border-2 border-slate-700">
            <h3 className="text-center">Settings</h3>
            <h4>T-shirt Color : </h4>

            <br/>
            <br/>
            
            <div className="tshirt-color flex justify-around">
          
                {['white', 'black', 'grey', 'blue', 'red']
                .map(color => (
               <button key={color} onClick={() => 
               onColorChange(color)}>{color}</button>
                ))}
                
            </div>
            <hr />
            <br />
                <br />
                <br />
            <h4>Upload Design</h4>
            <br />
                
                
            <div className="form-group">
                <input type="file" className="form-control-file" onChange={uploadImage} />
            </div>
            <br />
                
                
        </div>
    );
};

export default Setting;

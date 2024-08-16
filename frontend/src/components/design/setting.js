import React from 'react';

const Setting = ({ onColorChange, uploadImage }) => {
    return (
        <div className="bg-light container border-2 border-slate-700 p-4">
            <h3 className="text-center">Settings</h3>
            <h4>T-shirt Color:</h4>
            <div className="tshirt-color flex justify-around my-4">
                {['white', 'black', 'gray', 'lightblue', 'red', 'indigo', 'green', 'darkblue', 'pictisho']
                .map(color => (
                    <button key={color} onClick={() => onColorChange(color)}
                            className="p-2 rounded border border-blue-400 hover:bg-gray-200">
                        {color}
                    </button>
                ))}
            </div>
            <hr />
            <div className='group'>
                <div className="form-group">
                    <div className="cursor-pointer relative flex items-center justify-center h-12 overflow-hidden
                    rounded-md bg-neutral-950 px-6 font-medium text-neutral-200 duration-500">
                        <span className="
                        translate-x-0 transition-transform duration-500
                        group-hover:-translate-x-full absolute inset-y-0 left-0 w-full
                        flex items-center justify-center cursor-pointer">
                            Upload your design
                        </span>

                        <span className="cursor-pointer translate-x-full transition-transform duration-300
                        group-hover:translate-x-0 absolute inset-y-0 
                        left-0 w-full flex items-center justify-center">
                            Thinking something new?
                        </span>
                        <input type="file" 
                            accept="image/*"
                            className="cursor-pointer group absolute inset-0 w-full h-full opacity-0" 
                            onChange={uploadImage} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Setting;
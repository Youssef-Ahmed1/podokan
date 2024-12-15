import React from 'react';

const Setting = ({ onColorChange, uploadImage, onProductTypeChange, ProductType }) => {
     const colors = ['white', 'black', ] //'gray', 'lightblue', 'red', 'indigo', 'green', 'darkblue', 'pictisho'];
    const ProductTypes =  ['hoodie']  // ['t-shirt' 'long-sleeve-shirt', 'kids-shirt', 'kids-hoodie'];

    return (
        <div className="bg-light container border-2 border-slate-700 p-4">
            <h3 className="text-center">Settings</h3>
            <h4>hoodieColor:</h4>
            <div className="tshirt-color flex flex-wrap justify-around my-4">
                {colors.map(color => (
                    <button
                        key={color}
                        onClick={() => onColorChange(color)}
                        className="p-2 m-1 rounded border border-blue-400 hover:bg-gray-200"
                        style={{ backgroundColor: color, color: color === 'white' ? 'black' : 'white' }}
                    >
                        {color}
                    </button>
                ))}
            </div>
            <hr />
            <div className="mt-4">
                <h4>Product Type:</h4>
                <select
                    value={ProductType}
                    onChange={onProductTypeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {ProductTypes.map(type => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default Setting;

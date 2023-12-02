import React, { Component } from 'react';
import Display from '../design/display/Display';
import Setting from '../design/setting';
import storage from '../../Config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

class Dashboard extends Component {
    state = {
        tshirtColor: 'white',
        designImg: '',
        width: 200,  // Default width
        height: 200, // Default height
        x: 50,       // Default x position
        y: 50,       // Default y position
    };

    handleTshirtColor = (color) => {
        this.setState({ tshirtColor: color });
    }

    handleImageUpload = (e) => {
        if (e.target.files[0]) {
            const image = e.target.files[0];
            const storageRef = ref(storage, `designs/${image.name}`);
            uploadBytes(storageRef, image).then(snapshot => {
                getDownloadURL(snapshot.ref).then(url => {
                    this.setState({ designImg: url });
                    console.log('Uploaded image URL:', url); 
                }) });
        }
    }
// Inside Dashboard.js

handleSaveDesign = () => {
    // Create canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

 
    canvas.width = 500; 
    canvas.height = 500; 

    // Load the T-shirt image
    const tshirtImg = new Image();
    tshirtImg.src = `path_to_tshirt_images/${this.state.tshirtColor}.png`;
    tshirtImg.onload = () => {
        ctx.drawImage(tshirtImg, 0, 0, canvas.width, canvas.height);

        // Load the design image
        const designImg = new Image();
        designImg.src = this.state.designImg;
        designImg.onload = () => {
            // Draw the design image onto the canvas
            ctx.drawImage(designImg, this.state.x, this.state.y, this.state.width, this.state.height);

            // Create a link for downloading
            const link = document.createElement('a');
            link.download = 'tshirt-design.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        };
    };
};

    render() {
      
           
        return (
            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-8">
                    
                    <Display 
    tshirtColor={this.state.tshirtColor} 
    designImg={this.state.designImg}
    width={this.state.width}
    height={this.state.height}
    x={this.state.x}
    y={this.state.y}
    onDragStop={(e, d) => this.setState({ x: d.x, y: d.y })}
    onResizeStop={(e, direction, ref, delta, position) => {
        this.setState({
            width: ref.offsetWidth,
            height: ref.offsetHeight,
            ...position,
        });
    }}
/>
                  
                    </div>
                    <div className="col-lg-4">
                        <Setting onColorChange={this.handleTshirtColor} uploadImage={this.handleImageUpload} />
                    </div>
                </div>
                <button onClick={this.handleSaveDesign}>Save Design</button>
            </div>
        );

    }
}

export default Dashboard;

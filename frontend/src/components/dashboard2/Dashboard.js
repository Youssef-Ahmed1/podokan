import React, { Component } from 'react';
import Display from '../design/display/Display';
import Setting from '../design/setting';
import storage from '../../Config/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

class Dashboard extends Component {
    state = {
        tshirtColor: 'white',
        designImg: '',
        width: 200,
        height: 200,
        x: 250,
        y: 300,
        saveClicked: false, // New state to track if save button was clicked
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
                }).catch(error => {
                    console.error('Error getting download URL:', error);
                });
            }).catch(error => {
                console.error('Error uploading image:', error);
            });
        }
    }

    compileDesignData = () => {
        return {
            tshirtColor: this.state.tshirtColor,
            designImage: this.state.designImg,
            designPosition: {
                x: this.state.x,
                y: this.state.y
            },
            designSize: {
                width: this.state.width,
                height: this.state.height
            }
        };
    }

    handleSaveDesign = () => {
        console.log("Save Design button clicked");
        this.setState({ saveClicked: true }); // Set state to show feedback

        // Compile design data immediately
        const designData = this.compileDesignData();
        console.log("Design data compiled:", designData);

        // Check if onSave prop is a function
        if (typeof this.props.onSave === 'function') {
            this.props.onSave(designData);
            console.log("onSave function called");
        } else {
            console.error('onSave is not a function or not provided');
        }

        // Reset the saveClicked state after 3 seconds
        setTimeout(() => this.setState({ saveClicked: false }), 3000);
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
               <button 
                   onClick={this.handleSaveDesign} 
                   className={`btn btn-primary mt-4 ${this.state.saveClicked ? 'btn-success' : ''}`}
               >
                    {this.state.saveClicked ? 'Design Saved!' : 'Save Design'}
               </button>
               {this.state.saveClicked && <p>Check console for design data</p>}
            </div>
        );
    }
}

export default Dashboard;
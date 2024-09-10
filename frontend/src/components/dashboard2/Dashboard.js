import React, { Component } from 'react';
import Display from '../design/display/Display';
import Setting from '../design/setting';

class Dashboard extends Component {
    state = {
        tshirtColor: 'white',
        designImg: '',
        ProductType: 't-shirt',
    };

    handleTshirtColor = (color) => {
        this.setState({ tshirtColor: color });
    };

    handleDesignUpload = () => {
        document.getElementById('design-upload').click();
    };

    handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                this.setState({ designImg: event.target.result });
                if (this.props.onDesignUpload) {
                    this.props.onDesignUpload(event.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    handleProductTypeChange = (e) => {
        this.setState({ ProductType: e.target.value });
    };

    render() {
        return (
            <div className="container py-5">
                <div className="row">
                    <div className="col-lg-8">
                        <Display
                            tshirtColor={this.state.tshirtColor}
                            designImg={this.state.designImg}
                            onDesignUpload={this.handleDesignUpload}
                            onDragStop={(e, d) => console.log('Drag stopped', e, d)}
                            onResizeStop={(e, direction, ref, delta, position) =>
                                console.log('Resize stopped', e, direction, ref, delta, position)
                            }
                        />
                        <input
                            type="file"
                            id="design-upload"
                            accept="image/png"
                            onChange={this.handleFileChange}
                            style={{ display: 'none' }}
                        />
                    </div>
                    <div className="col-lg-4">
                        <Setting
                            onColorChange={this.handleTshirtColor}
                            onProductTypeChange={this.handleProductTypeChange}
                            ProductType={this.state.ProductType}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

export default Dashboard;
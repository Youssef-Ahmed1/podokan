// utils/designDownload.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export const DesignDownloader = {
  async downloadSingleDesign(item) {
    try {
      const zip = new JSZip();

      // Add design image
      const imageResponse = await fetch(item.designImage.url);
      const imageBlob = await imageResponse.blob();
      zip.file(`design_${item._id}.png`, imageBlob);

      // Create specs JSON
      const specs = {
        product: {
          type: item.ProductType,
          color: item.ProductColor,
          size: item.size,
          view: item.ProductView || 'front'
        },
        design: {
          title: item.DesignTitle,
          position: item.DesignPosition,
          scale: item.DesignScale
        },
        order: {
          quantity: item.qty,
          itemId: item._id
        }
      };

      zip.file(`specs_${item._id}.json`, JSON.stringify(specs, null, 2));

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `design_${item._id}.zip`);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  async downloadOrderDesigns(order) {
    try {
      const zip = new JSZip();
      
      // Create a designs folder in the zip
      const designsFolder = zip.folder("designs");
      
      // Download each design in the order
      for (const item of order.cart) {
        // Add design image
        const imageResponse = await fetch(item.designImage.url);
        const imageBlob = await imageResponse.blob();
        designsFolder.file(`${item._id}/design.png`, imageBlob);

        // Add specs JSON
        const specs = {
          product: {
            type: item.ProductType,
            color: item.ProductColor,
            size: item.size,
            view: item.ProductView || 'front'
          },
          design: {
            title: item.DesignTitle,
            position: item.DesignPosition,
            scale: item.DesignScale
          },
          order: {
            quantity: item.qty,
            itemId: item._id
          }
        };

        designsFolder.file(
          `${item._id}/specs.json`, 
          JSON.stringify(specs, null, 2)
        );
      }

      // Add order summary
      const orderSummary = {
        orderId: order._id,
        customerName: order.user.name,
        orderDate: order.createdAt,
        totalItems: order.cart.length,
        status: order.status
      };

      zip.file("order_summary.json", JSON.stringify(orderSummary, null, 2));

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `order_${order._id}_designs.zip`);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }
};
// utils/designDownload.js
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// utils/designDownload.js
export const DesignDownloader = {
  async downloadSingleDesign(item) {
    try {
      // Check if item exists
      if (!item) {
        throw new Error('No item data available');
      }

      // Log the item structure to debug
      console.log('Item data:', item);

      // Check all possible locations for the design image
      const designImage = 
        item.designImage?.url || // Standard path
        item.cart?.[0]?.designImage?.url || // If item is an order with cart
        item.design?.url || // Alternative path
        item.products?.[0]?.designImage?.url || // If nested in products array
        (Array.isArray(item.cart) && item.cart[0]?.design?.url); // Nested in cart with different structure

      if (!designImage) {
        throw new Error('Design image URL not found in order data');
      }

      const zip = new JSZip();

      // Add design image with error handling
      try {
        const imageResponse = await fetch(designImage);
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch design image: ${imageResponse.statusText}`);
        }
        const imageBlob = await imageResponse.blob();
        zip.file(`design_${item._id || 'unknown'}.png`, imageBlob);
      } catch (imageError) {
        console.error('Image download error:', imageError);
        throw new Error('Failed to download design image');
      }

      // Get product details with fallbacks
      const productDetails = item.cart?.[0] || item.products?.[0] || item;

      // Create specs JSON with fallback values
      const specs = {
        product: {
          type: productDetails.ProductType || productDetails.productType || 'unknown',
          color: productDetails.ProductColor || productDetails.color || 'white',
          size: productDetails.size || 'default',
          view: productDetails.ProductView || productDetails.view || 'front'
        },
        design: {
          title: productDetails.DesignTitle || productDetails.title || `Design_${item._id || 'unknown'}`,
          position: productDetails.DesignPosition || productDetails.position || { x: 50, y: 40 },
          scale: productDetails.DesignScale || productDetails.scale || 0.8
        },
        order: {
          quantity: productDetails.qty || productDetails.quantity || 1,
          itemId: item._id || 'unknown',
          orderDate: item.createdAt || new Date().toISOString()
        }
      };

      zip.file(`specs_${item._id || 'unknown'}.json`, JSON.stringify(specs, null, 2));

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `design_${item._id || 'unknown'}.zip`);

      return true;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  async downloadOrderDesigns(order) {
    try {
      if (!order) {
        throw new Error('No order data available');
      }

      // Get cart items, handling different possible structures
      const cartItems = order.cart || order.products || [];
      
      if (!cartItems.length) {
        throw new Error('No items found in order');
      }

      const zip = new JSZip();
      const designsFolder = zip.folder("designs");
      
      // Track successful and failed downloads
      const results = {
        success: [],
        failed: []
      };

      // Process each design
      for (const item of cartItems) {
        try {
          const designImage = 
            item.designImage?.url ||
            item.design?.url ||
            (item.products?.[0]?.designImage?.url);

          if (!designImage) {
            results.failed.push({
              id: item._id,
              reason: 'Design image URL not found'
            });
            continue;
          }

          // Download image
          const imageResponse = await fetch(designImage);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
          }
          const imageBlob = await imageResponse.blob();
          designsFolder.file(`${item._id}/design.png`, imageBlob);

          // Create specs
          const specs = {
            product: {
              type: item.ProductType || item.productType || 'unknown',
              color: item.ProductColor || item.color || 'white',
              size: item.size || 'default',
              view: item.ProductView || item.view || 'front'
            },
            design: {
              title: item.DesignTitle || item.title || `Design_${item._id}`,
              position: item.DesignPosition || item.position || { x: 50, y: 40 },
              scale: item.DesignScale || item.scale || 0.8
            },
            order: {
              quantity: item.qty || item.quantity || 1,
              itemId: item._id,
              orderDate: order.createdAt || new Date().toISOString()
            }
          };

          designsFolder.file(`${item._id}/specs.json`, JSON.stringify(specs, null, 2));
          results.success.push(item._id);
        } catch (itemError) {
          results.failed.push({
            id: item._id,
            reason: itemError.message
          });
        }
      }

      // Add download summary
      const summary = {
        orderId: order._id,
        downloadDate: new Date().toISOString(),
        successfulDownloads: results.success,
        failedDownloads: results.failed,
        customerInfo: {
          name: order.user?.name || 'Unknown',
          orderId: order._id || 'Unknown',
          orderDate: order.createdAt || new Date().toISOString()
        }
      };

      zip.file("download_summary.json", JSON.stringify(summary, null, 2));

      // Only create zip if there were successful downloads
      if (results.success.length > 0) {
        const content = await zip.generateAsync({ type: "blob" });
        saveAs(content, `order_${order._id || 'unknown'}_designs.zip`);
      } else {
        throw new Error('No designs were available for download');
      }

      return results;
    } catch (error) {
      console.error('Order download error:', error);
      throw error;
    }
  }
};
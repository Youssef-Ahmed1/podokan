const { sendProductRejectionEmail } = require('../utils/sendMail');

// In your product approval/rejection controller
const approveRejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, rejectionReason } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    product.status = status;

    if (status === 'rejected') {
      product.rejectionReason = rejectionReason;
      
      // Fetch the seller's email (assuming you have a Shop model with an email field)
      const shop = await Shop.findById(product.shopId);
      
      // Send rejection email
      await sendProductRejectionEmail(shop.email, product.name, rejectionReason);
    }

    await product.save();

    res.status(200).json({ message: "Product status updated successfully" });
  } catch (error) {
    console.error("Error in approveRejectProduct:", error);
    res.status(500).json({ message: "An error occurred while updating product status" });
  }
};
export default approveRejectProduct
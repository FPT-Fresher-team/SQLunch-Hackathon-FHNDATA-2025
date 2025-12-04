const product = require('../../models/productModel')

async function setTopSellingProducts() {
  console.log("Running setTopSellingProducts cron...")
  try {
    const productsToUpdate = await product
    .find({})
    .sort({ saleNumber: -1 })   // highest sales first
    .limit(10)
    .select('_id')
    .lean()

    if (productsToUpdate.length === 0) {
      console.log("No eligible products found for top selling.")
      return
    }

    // Step 2: Extract IDs
    const productIds = productsToUpdate.map(p => p._id)

    // Step 3: Update them all at once
    const result = await product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { 
          isTopSelling: true,
        }
      }
    )

    console.log(`Successfully set ${result.modifiedCount} products to top-selling!`)
  } catch (error) {
    console.error("Error in setTopSellingProducts:", error)
  }
}

module.exports = { setTopSellingProducts }
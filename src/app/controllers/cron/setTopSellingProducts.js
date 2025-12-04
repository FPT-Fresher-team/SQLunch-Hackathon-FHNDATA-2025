const product = require('../../models/productModel')

async function setTopSellingProducts() {
  console.log("Running setTopSellingProducts cron...")
  try {
    const productsToUpdate = await product
    .find({
      group: { $in: ['high_high', 'low_high'] } 
    })

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
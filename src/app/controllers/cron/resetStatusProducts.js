const product = require('../../models/productModel')

async function resetStatusProducts() {
  console.log("Running resetStatusProducts cron...")
  try {
    // Step 3: Update them all at once
    const result = await product.updateMany(
      {},
      { 
        $set: { 
          isTopSelling: false,
          isFlashDeal: false,
          isNewArrival: false
        }
      }
    )

    console.log(`Successfully reset ${result.modifiedCount} products!`)
  } catch (error) {
    console.error("Error in resetStatusProducts:", error)
  }
}

module.exports = { resetStatusProducts }
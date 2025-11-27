const product = require('../../models/productModel')

async function setNewArrivalProducts() {
  console.log("Running setNewArrivalProducts cron...")
  try {
    const productsToUpdate = await product
    .find({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }) // added in last 30 days
    .select('_id')
    .lean()

    if (productsToUpdate.length === 0) {
      console.log("No eligible products found for new arrival.")
      return
    }

    // Step 2: Extract IDs
    const productIds = productsToUpdate.map(p => p._id)

    // Step 3: Update them all at once
    const result = await product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { 
          isNewArrival: true,
        }
      }
    )

    console.log(`Successfully set ${result.modifiedCount} products to new arrival!`)
    console.log("Updated product IDs:", productIds)

  } catch (error) {
    console.error("Error in setNewArrivalProducts:", error)
  }
}

module.exports = { setNewArrivalProducts }
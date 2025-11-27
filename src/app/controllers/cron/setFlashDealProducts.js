const product = require('../../models/productModel')

async function setFlashDealProducts() {
  console.log("Running setFlashDealProducts cron...")

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Step 1: Get 5 oldest + lowest-selling products
    const productsToUpdate = await product.find({
      createdAt: { $lt: thirtyDaysAgo },
      price: { $gt: 0 }                     // ensure price exists
    })
    .sort({ saleNumber: 1 })   // lowest sales first
    .limit(5)
    .select('_id price name')  // we need current price
    .lean()

    if (productsToUpdate.length === 0) {
      console.log("No products eligible for flash deal.")
      return
    }

    // Step 2: Bulk update with 50% discount + status
    const bulkOps = productsToUpdate.map(p => ({
      updateOne: {
        filter: { _id: p._id },
        update: {
          $set: {
            isFlashDeal: true,
            oldPrice: p.price,                    // save original price
            price: Math.round(p.price * 0.5),     // 50% off, rounded
          }
        }
      }
    }))

    const result = await product.bulkWrite(bulkOps)

    console.log(`Successfully set ${result.modifiedCount} products to 50% Flash Deal!`)
    console.log("Flash deal products:", productsToUpdate.map(p => `${p.name} → ${p.price}đ`))

  } catch (error) {
    console.error("Error setting flash deals:", error)
  }
}

module.exports = { setFlashDealProducts }
const product = require('../../models/productModel')

async function setFlashDealProducts() {
  console.log("Running setFlashDealProducts cron...")

  try {
    // Step 1: Get 5 oldest + lowest-selling products
    const productsToUpdate = await product.find({
      createdAt: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      group: 'low_low',
    })

    if (productsToUpdate.length === 0) {
      console.log("No products eligible for flash deal.")
      return
    }

    // Step 2: Bulk update with 50% discount + status
    const bulkOps = productsToUpdate.map(p => ({
      updateOne: {
        filter: { _id: p._id, group: { $in: ['low_low', 'low_high'] }},
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
  } catch (error) {
    console.error("Error setting flash deals:", error)
  }
}

async function randomizeSaleNumber() {
  try {
    const result = await product.updateMany(
      {group: true},
      [// 1st: create saleNumber (0 - 10)
    {
      $set: {
        saleNumber: { $floor: { $multiply: [ { $rand: {} }, 11 ] } }
      }
    },
    // 2nd: set rateNumber < saleNumber
    {
      $set: {
        rateNumber: {
          $floor: {
            $multiply: [
              { $rand: {} },
              "$saleNumber" // random scaled by saleNumber
            ]
          }
        }
      }
    }]
    );

    console.log(`Updated ${result.modifiedCount} products`);
  } catch (err) {
    console.error(err);
  }
}

module.exports = { setFlashDealProducts, randomizeSaleNumber }
const express = require('express')
const router = express.Router()
const homeController = require('../../app/controllers/user/homeController')

router.get('/'                          , homeController.show)
router.post('/data/vouchers'            , homeController.getVouchers)
router.post('/data/products'            , homeController.getProducts)
router.get('/data/out-of-order-products', homeController.getOutOfOrderProducts)
router.post('/data/order-products'      , homeController.getOrderProducts)
router.post('/data/brands'              , homeController.getBrands)
router.get('/data/user'                 , homeController.getUsers)
router.post('/data/search'              , homeController.searchInfo)
router.post('/data/notification'        , homeController.setNotification)
router.post('/data/streamingKafka'      , homeController.streamingKafka)

router.post('/test_cdc', homeController.testCDC)

// Ví dụ Node.js/Express API chạy localhost
router.get('/api/top-users', async (req, res) => {
  const response = await fetch(
    'https://bkjr54bowwyufnypvcecwxiehm-mx5ogorkkv7e3i7zyga6qv3alm.datawarehouse.fabric.microsoft.com:443/v1/query',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + FABRIC_TOKEN   // lấy ở bước dưới
      },
      body: JSON.stringify({
        query: `
          SELECT userId, COUNT(*) as clicks
          FROM user_events
          WHERE eventDate >= DATEADD(day, -7, GETDATE())
          GROUP BY userId
          ORDER BY clicks DESC
          LIMIT 10
        `
      })
    }
  );

  const data = await response.json();
  res.json(data.rows);
});


module.exports = router
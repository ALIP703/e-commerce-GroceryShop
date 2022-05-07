var express = require('express');
const { response } = require('../app');
const { get } = require('../config/connection');
const productHelpers = require('../helpers/product-helpers');
const shopHelpers = require('../helpers/shop_helpers');
const userHelpers = require('../helpers/user-helpers');
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if (req.session.shopLoggedin) {
    next()
  }
  else {
    res.redirect('/shop/login-shop')
  }
}
var otp = null;  // Global variable
var DATA = null;
router.get('/', verifyLogin, async (req, res) => {
  let shop = req.session.shop.center//check keep user data in section already
  console.log(shop);
  console.log("check");
  // =0
  let orderCount = await shopHelpers.getALLOrderCount(shop.center)
  let requireCount = await shopHelpers.getReqCount(shop.center)
  let prodCount = await shopHelpers.getprodCount(shop)
  let  profit  = 0
  // await shopHelpers.getTotalProfit(shop)
  console.log("hlo");
  console.log(profit);
  let ordercount = await shopHelpers.getOrderCounts(shop)
  console.log(ordercount);
  res.render('shop/home', { shop, orderCount, requireCount, prodCount, ordercount, profit })
}) 
router.get('/view-products', verifyLogin, function (req, res, next) {
  let shop = req.session.shop//check keep user data in section already
  console.log(shop);
  shopHelpers.getAllProducts().then((products) => { //here use promise
    res.render('shop/view-products', { center: true, shop, products })
  })
})
router.get('/login-shop', (req, res) => {
  if (req.session.shop) {
    res.redirect('/shop/')
  } else {
    res.render('shop/login-shop', { center: true, shop: false, 'loginErr': req.session.shopLoginErr })//data validation through check err
    req.session.shopLoginErr = false
  }
})
router.post('/login-shop',async (req, res) => {
  shopHelpers.checkShop(req.body).then(async (response) => {
    if (response.status) {
      let recipients = req.body.Email
    otp = await userHelpers.sendEmail(recipients)
    DATA=req.body
    res.redirect('/shop/loginVerification')
    }
    else {      
      req.session.shopLoginErr = "Invalid Email or Password"//set err if keep err in session
      res.redirect('/shop/login-shop')
        }
  })
});

router.get('/loginVerification',(req,res)=>{
  res.render('shop/loginVerification',{  'loginErr': req.session.shopLoginErr })
  req.session.shopLoginErr = false
})
router.post('/loginVerification',(req,res)=>{
  let userOtp = parseInt(req.body.otp);
  if (otp == userOtp) {
    let data=DATA
    shopHelpers.doLogin(data).then((response) => {
      if (response.status) {
        req.session.shop = response.shop//save user datat into session
        req.session.shopLoggedin = true //set a variable
        res.redirect('/shop')      }
      else {
        req.session.shopLoginErr = "Invalid user name or Password"//set err if keep err in session
        console.log("err");
        res.redirect('/shop/login-shop')
      }
    })
   
  }
  else {
    req.session.shopLoginErr = "Invalid OTP"//set err if keep err in session
    res.redirect('/shop/loginVerification')
  }
})

router.get('/logout-shop', (req, res) => {
  req.session.shop = null
  req.session.shopLoggedin = false
  res.redirect('/shop/login-shop')
});
router.get('/view-orders', verifyLogin, async (req, res) => {
  let shop = req.session.shop
  console.log(shop);
  await shopHelpers.getOrders(shop.center).then((orders) => {
    console.log(orders);
    res.render('shop/view-orders', { shop, orders })
  })
})
router.get('/view-order-products/:id', async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('shop/view-order-products', { shop: true, products })
})
router.get('/shipped/:id', (req, res) => {
  let orderId = req.params.id//params id = :id
  console.log(orderId)
  shopHelpers.shipped(orderId).then((response) => {
    res.redirect('/shop/view-orders')
  })
});
router.get('/transport/:id', (req, res) => {
  let orderId = req.params.id//params id = :id
  console.log(orderId)
  shopHelpers.transport(orderId).then((response) => {
    res.redirect('/shop/view-orders')
  })
});
router.get('/delivered/:id', (req, res) => {
  let orderId = req.params.id//params id = :id
  console.log(orderId)
  shopHelpers.delivered(orderId).then((response) => {
    res.redirect('/shop/view-orders')
  })
});
router.get('/view-producers', verifyLogin, (req, res) => {
  let shop = req.session.shop
  let shopb = req.session.shop.center
  console.log(shopb);
  let producers = shopHelpers.getAllProducers(shopb).then((producers) => {
    res.render('shop/view-producers', { producers, shop })
  })
})
router.get('/request-product', verifyLogin, (req, res) => {
  let shop = req.session.shop
  res.render('shop/request-product', { shop })
})
router.post('/request-product', (req, res, next) => {
  let shop = req.session.shop
  let block = shop.center
  // console.log(req.body)//cheque data at body  // console.log(req.files.image)
  shopHelpers.requestProduct(req.body, block).then((id) => { //here use call back id founstion
    console.log(id + " this is ");
    let image = req.files.Image
    console.log(image);
    image.mv('./public/product-images/' + id + '.jpg', (err, done) => {
      if (!err) {
        res.redirect('/shop/request-product')
      }
      else {
        console.log(err + 'detect errors')
      }
    })//middlewere

  })
});
router.get('/requirements', verifyLogin, (req, res) => {
  let shop = req.session.shop
  let shopb = req.session.shop.center
  shopHelpers.getRequirements(shopb).then((products) => {
    console.log(products);
    res.render('shop/requirements', { shop, products })
  })
})
router.get('/delete-requrement/:id', (req, res) => {
  let prodId = req.params.id;
  shopHelpers.deleteRequrement(prodId).then((response) => {
    res.redirect('/shop/requirements')
  })
})
router.get('/edit-requrement/:id', verifyLogin, async (req, res) => {
  let prodId = req.params.id;
  let shop = req.session.shop
  let products = await shopHelpers.getRequirementDetails(prodId)
  console.log(products);
  res.render('shop/edit-requrement', { products, shop })
})
router.post('/edit-requrement/:id', (req, res) => {
  console.log(req.params.id)
  let id = req.params.id
  shopHelpers.updateRequirement(req.params.id, req.body).then(() => {
    res.redirect('/shop')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')
    }//image check for uploading
  })
})
router.get('/producer-claims', verifyLogin, async (req, res) => {
  let shop = req.session.shop
  console.log(shop);
  let claims = await shopHelpers.getProducerclaims(shop.center)
  res.render('shop/producer-claims', { shop, claims })
})
router.get('/view-claimed-products/:id', verifyLogin,async (req, res) => {
  let shop = req.session.shop
  let products = await shopHelpers.getClaimProducts(req.params.id)
  console.log(products);
  res.render('producer/view-claimed-products', { products, shop })
})
router.get('/claimed/:id', (req, res) => {
  let claimId = req.params.id//params id = :id
  console.log(claimId)
  shopHelpers.claimed(claimId).then((response) => {
    res.redirect('/shop/producer-claims')
  })
});
module.exports = router;

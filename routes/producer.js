var express = require('express');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const producer_helpers = require('../helpers/producer_helpers');
const shop_helpers = require('../helpers/shop_helpers');
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if (req.session.producerLoggedin) {
    next()
  }
  else {
    res.redirect('/producer/login')
  }
}
var otp = null;  // Global variable
var DATA = null;
router.get('/', verifyLogin, (req, res) => {
  let producer = req.session.producer
  console.log(producer);
  if (producer) {
    let block = producer.block
    console.log(block);
    producer_helpers.getAllRequirements(block).then((products) => {
      console.log(products.length+"check");
      if (products.length==0) {
        let status=true
        res.render('producer/home', { producer, products ,status})
      }
      else{
        res.render('producer/home', { producer, products })

      }
    })
  }
});

router.get('/report', verifyLogin, async (req, res, next) => {
  let producer = req.session.producer//check keep user data in section already
  console.log(producer);
  let orderCount = await producer_helpers.getALLCLamCount(producer._id)
  let requireCount = await shop_helpers.getReqCount(producer.block)
  let profit = await producer_helpers.getProfit(producer._id)
  console.log(orderCount + "  here");
  console.log(producer);
  res.render('producer/report', { producer, orderCount, requireCount, profit })
})
router.get('/login', (req, res) => {
  if (req.session.producer) {
    res.redirect('/producer')
  } else {
    res.render('producer/login', { seller: true, 'loginErr': req.session.producerLoginErr })//data validation through check err
    req.session.producerLoginErr = false
  }
})
router.post('/login', async (req, res) => {
  producer_helpers.checkUser(req.body).then(async (response) => {
    if (response.status) {
      console.log(req.body);
      let recipients = req.body.Email
      otp = await userHelpers.sendEmail(recipients)
      DATA = req.body
      res.redirect('/producer/loginVerification')
    }
    else {
      req.session.producerLoginErr = "Invalid Email or Password"//set err if keep err in session
      res.redirect('/producer/login')
    }
  })
});
router.get('/loginVerification', (req, res) => {
  res.render('producer/loginVerification',{'loginErr': req.session.producerLoginErr })
  req.session.producerLoginErr = false
})
router.post('/loginVerification', (req, res) => {
  let userOtp = parseInt(req.body.otp);
  if (otp == userOtp) {
    let data = DATA
    producer_helpers.doLogin(data).then((response) => {
      if (response.status) {
        req.session.producer = response.producer//save user datat into session
        req.session.producerLoggedin = true //set a variable
        console.log(req.session.producer);
        res.redirect('/producer')
      }
      else {
        req.session.producerLoginErr = "Invalid user name or Password"//set err if keep err in session
        console.log("err");
        res.redirect('/producer/login')
      }
    })

  }
  else {
    req.session.producerLoginErr = "Invalid otp"//set err if keep err in session
    res.redirect('/producer/loginVerification')
  }
})
router.get('/logout', (req, res) => {
  req.session.producer = null
  req.session.producerLoggedin = false//here clear session by using destroy function
  res.redirect('/')
});
router.get('/register',async (req, res) => {
  let block=await productHelpers.getallshopdetails()
  res.render('producer/register', { block,seller: true ,'loginErr': req.session.producerLoginErr })
  req.session.producerLoginErr=false
})
router.post('/register', async (req, res) => {
  let email = req.body.Email
  let producer = await producer_helpers.checkthruser(email)
  if (producer) {
    req.session.producerLoginErr = "Email is already used"//set err if keep err in session
    res.redirect('/producer/register')
  }
  else {
    DATA = req.body
    otp = await userHelpers.sendEmail(email)
    res.redirect('/producer/signupVerificatiion')
  }
});
router.get('/signupVerificatiion', (req, res) => {
  res.render('producer/signupVerificatiion',{'loginErr': req.session.producerLoginErr })
  req.session.producerLoginErr=false
})
router.post('/signupVerificatiion', (req, res) => {
  console.log(req.body.otp);
  userOtp = parseInt(req.body.otp);
  console.log(userOtp);
  console.log(DATA);
  if (otp == userOtp) {
    let data = DATA
    producer_helpers.doSignup(data).then((response) => {
      req.session.producer = response
      req.session.producerLoggedin = true //create session
      res.redirect('/producer')
    })
  }
  else {
    req.session.producerLoginErr = "Invalid otp"//set err if keep err in session
    res.redirect('/producer/signupVerificatiion')
  }
})
router.get('/requirements', verifyLogin, (req, res) => {
  let producer = req.session.producer
  let block = producer.block
  console.log(block);
  producer_helpers.getAllRequirements(block).then((products) => {
    res.render('producer/requirements', { producer, products })
  })
})
router.get('/add-to-wishlist/:id', verifyLogin, (req, res) => {
  console.log(req.params.id);
  console.log("api call");
  producer_helpers.addWishList(req.params.id, req.session.producer._id).then(() => {
    res.json({ status: true })
    // console.log(hi);
  })
})
router.get('/wish-list', verifyLogin, async (req, res) => {
  let producer = req.session.producer
  let products = await producer_helpers.getwishProducts(producer._id)
  console.log(" asyn");
  console.log(products);
  let total = 0
  if (products.length > 0) {
    total = await producer_helpers.getTotalAmount(producer._id)
  }
  res.render('producer/wish-list', { products, producer, total })
})
router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  console.log(req.body);
  producer_helpers.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})
router.post('/remove-wish-product', verifyLogin, (req, res, next) => {
  let datails = req.body
  let wishId = datails.wishId;
  let prodId = datails.product;
  producer_helpers.removewishProdect(wishId, prodId).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let producer = req.session.producer
  let total = await producer_helpers.getTotalAmount(producer._id)
  console.log(producer);
  console.log("get");
  res.render('producer/place-order', { total, producer })
})
router.post('/place-order', async (req, res) => {
  console.log(req.body.producerId);
  let products = await producer_helpers.getwishProductList(req.body.producerId)
  console.log(products.item);
  let totalPrice = 0
  console.log(products.length);
  if (products.length > 0) {
    totalPrice = await producer_helpers.getTotalAmount(req.body.producerId)
    console.log("first");
  }
  console.log("second");

  producer_helpers.placeOrder(req.body, products, totalPrice).then(async (orderId) => {
    console.log("third");
    let product = await producer_helpers.getClaimProducts(orderId)
    let stock = await producer_helpers.changeStck(product, products.length)
    if (req.body['paymentMethod'] === 'COD') {
      producer_helpers.changePaymentStatus(orderId).then((response) => {
        if (stock < 0) {
          producer_helpers.removeClaims(orderId).then((response) => {
            res.json({ outofstck: true })
          })
        }
        else {
          res.json({ cod_success: true })
        }
      })
    }
  })
})
router.get('/claims', verifyLogin, async (req, res) => {
  let producer = req.session.producer
  let claims = await producer_helpers.getProducerclaims(producer._id)
  res.render('producer/claims', { producer, claims })
})
router.get('/view-claimed-products/:id', verifyLogin, async (req, res) => {
  let producer = req.session.producer
  let products = await producer_helpers.getClaimProducts(req.params.id)
  console.log(products);
  res.render('producer/view-claimed-products', { products, producer })
})
router.get('/cancel/:id', verifyLogin, (req, res) => {
  let claimId = req.params.id//params id = :id
  console.log(claimId)
  producer_helpers.removeclaiming(claimId).then((response) => {
    res.redirect('/producer/claims')
  })
});
router.get('/profile', verifyLogin, async (req, res) => {
  let userId = req.session.producer._id
  userHelpers.getproducerProfile(userId).then((data) => {
    console.log(data);
    res.render('producer/profile', { data })
  })
})
router.get('/edit-profile', verifyLogin, (req, res) => {
  let data = req.session.producer
  res.render('producer/edit-profile', { data })
})
router.post('/edit-profile', verifyLogin, (req, res) => {
  let userId = req.session.producer._id
  console.log(req.body);
  producer_helpers.updateProfile(req.body, userId).then(() => {
    res.redirect('/producer/profile')
  })
})
router.get('/forgotpas', (req, res) => {
  res.render('producer/forgotpas', { 'loginErr': req.session.producerLoginErr })
  req.session.producerLoginErr=false
})
router.post('/forgotpas', async (req, res) => {
  let producer = await producer_helpers.Emailverify(req.body)
  if (producer) {
    console.log(producer);
    DATA = producer
    otp = await userHelpers.sendEmail(producer.Email)
    res.render('producer/verifyforgot')
  }
  else {
    req.session.producerLoginErr = "Invalid email or username"//set err if keep err in session
    res.redirect('/producer/forgotpas')
  }
})
router.post('/verifyforgot', (req, res) => {
  let userotp = parseInt(req.body.otp);
  if (userotp == otp) {
    res.redirect('/producer/updatePassword')
  }
  else {
    req.session.producerLoginErr = "Invalid otp"//set err if keep err in session
    res.redirect('/producer/forgotpas')
  }
})
router.get('/updatePassword', (req, res) => {
  res.render('producer/updatePassword', { 'loginErr': req.session.producerLoginErr })
  req.session.producerLoginErr=false
})
router.post('/updatePassword', (req, res) => {
  let password = req.body.Password
  let passwords = req.body.Passwords
  if (password === passwords) {
    producer_helpers.changePassword(DATA, password)
    res.redirect('/producer/login')
  }
  else {
    req.session.producerLoginErr = "pleace conform password is correct"//set err if keep err in session
    res.redirect('/producer/updatePassword')
  }
})
module.exports = router;

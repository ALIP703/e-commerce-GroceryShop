const { response } = require('express');
var express = require('express');
var nodemailer = require("nodemailer");
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers')
var otp = null;  // Global variable
var DATA = null;
//set middle ware for easy for check is user loged? cases //call verifyLogin before route 
const verifyLogin = (req, res, next) => {
  if (req.session.userLoggedIn) {
    next()
  }
  else {
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user//check keep user data in section already
  console.log(user)
  let cartCount = null
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id)
  }
  productHelpers.getAllProducts().then((products) => { //here use promise
    res.render('user/view-products', { products, user, cartCount })//pass section user
  })
});
router.get('/login', (req, res) => {
  if (req.session.user) {
    res.redirect('/')
  } else {
    res.render('user/login', { 'loginErr': req.session.userLoginErr })//data validation through check err
    req.session.userLoginErr = false
  }
});
router.get('/signup', (req, res) => {
  res.render('user/signup', { 'loginErr': req.session.userLoginErr })
  req.session.userLoginErr = false
});
router.post('/signup', async (req, res) => {
  console.log(req.body);
  let email = req.body.Email
  let user=await userHelpers.checkthruser(email)  
  if(user){
    req.session.userLoginErr = "Email is already used"//set err if keep err in session
    res.redirect('/signup') 
  }
  else{
    DATA = req.body
  otp = await userHelpers.sendEmail(email)
  res.redirect('/signupVerificatiion')
  }
  
});
router.get('/signupVerificatiion', (req, res) => {
  res.render('user/signupVerificatiion',{ 'loginErr': req.session.userLoginErr })
  req.session.userLoginErr = false
})
router.post('/signupVerificatiion', (req, res) => {
  userOtp = parseInt(req.body.otp);
  if (otp == userOtp) {
    let email = DATA
    userHelpers.doSignup(email).then((response) => {
      req.session.user = response
      req.session.userLoggedIn = true //create session
      res.redirect('/')
    })
  }
  else {
    req.session.userLoginErr = "Invalid OTP"
    res.redirect('/signupVerificatiion')
  }
})
router.post('/login', async (req, res) => {
  userHelpers.checkUser(req.body).then(async (response) => {
    if (response.status) {
      let recipients = req.body.Email
      otp = await userHelpers.sendEmail(recipients)
      DATA = req.body
      res.redirect('/loginVerification')
    }
    else {      
      req.session.userLoginErr = "Invalid Email or Password"//set err if keep err in session
      res.redirect('/login')
    }
  })
});
router.get('/loginVerification', (req, res) => {
  res.render('user/loginVerification', { 'loginErr': req.session.userLoginErr })
  req.session.userLoginErr = false
})
router.post('/loginVerification', (req, res) => {
  let userOtp = parseInt(req.body.otp);
  if (otp == userOtp) {
    let data = DATA
    userHelpers.doLogin(data).then((response) => {
      if (response.status) {
        req.session.user = response.user//save user data into session
        req.session.userLoggedIn = true //set a variable
        res.redirect('/')//here not calling render beacuse /root also define so call redirect
      }
      else {
        req.session.userLoginErr = "Invalid user name or Password"//set err if keep err in session
        res.redirect('/login')
      }
    })
  }
  else {
    req.session.userLoginErr = "Invalid OTP"
    res.redirect('/loginVerification')
  }
})
router.get('/logout', (req, res) => {
  req.session.user = null
  req.session.userLoggedIn = false//here clear session by using destroy function
  res.redirect('/')
});
//cutted vegs
router.get('/cutted-veg', (req, res) => {
  let user = req.session.user
  productHelpers.getVegProducts().then((products) => {
    console.log(products)
    res.render('user/cutted-veg', { products, user });
  })
});
router.get('/non-cut-veg', (req, res) => {
  let user = req.session.user
  productHelpers.getVeg2Products().then((products) => {
    console.log(products)
    res.render('user/non-cut-veg', { products, user });
  })
});
router.get('/grocerry', (req, res) => {
  let user = req.session.user
  productHelpers.getGrocerryProducts().then((products) => {
    console.log(products)
    res.render('user/grocerry', { products, user });
  })
});
router.get('/fruits', (req, res) => {
  let user = req.session.user
  productHelpers.getFruitsProducts().then((products) => {
    console.log(products)
    res.render('user/fruits', { products, user });
  })
});
router.get('/fish', (req, res) => {
  let user = req.session.user
  productHelpers.getFishProducts().then((products) => {
    console.log(products)
    res.render('user/fish', { products, user });
  })
});
router.get('/meet', (req, res) => {
  let user = req.session.user
  productHelpers.getMeetProducts().then((products) => {
    console.log(products)
    res.render('user/meet', { products, user });
  })
});
router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let total = 0
  let delivery=0
  let totall = 0
  let discountf = 0
  let discountp = 0
  if (products.length > 0) {
    console.log(" here " + req.session.user);
    total = await userHelpers.getTotalAmount(req.session.user._id)
    
    discountp = await productHelpers.getdiscountproduct(products, products.length)
    console.log(discountp);
    if (orders.length == 0) {
      discountf = total * 10 / 100;
    }
    totall = total - discountf
    totall = totall - discountp
    console.log(discountp);
    if (totall<100) {
      delivery=50
      totall=totall+delivery
    }
    else if(totall>150){
      totall=totall-delivery
      delivery=0
    }
  }
  res.render('user/cart', { products, user: req.session.user, total, discountf, discountp, totall,delivery })
})
router.get('/add-to-cart/:id', verifyLogin, async (req, res) => {
  console.log("api call");
  console.log(req.params.id);
  let stock = await userHelpers.ProductStock(req.params.id)
  if (stock > 0) {
    userHelpers.addToCart(req.params.id, req.session.user._id).then(() => {
      res.json({ status: true })
    })
  }

  else {
    res.json({ status: false })
  }
  // console.log(hi);
})
router.post('/change-product-quantity', verifyLogin, (req, res, next) => {
  console.log(req.body);
  userHelpers.changeProductQuantity(req.body).then((response) => {
    res.json(response)
  })
})
router.post('/remove-cart-product', verifyLogin, (req, res, next) => {
  let datails = req.body
  let cartId = datails.cartId;
  let prodId = datails.product;
  userHelpers.removeCartProdect(cartId, prodId).then((response) => {
    res.json(response)
  })
})
router.get('/place-order', verifyLogin, async (req, res) => {
  let discount = 0;
  let delivery=0
  let products = await userHelpers.getCartProducts(req.session.user._id)
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let discountp = await productHelpers.getdiscountproduct(products, products.length)
  let block=await productHelpers.getallshopdetails()
  total = total - discountp
  if (orders.length == 0) {
    discount = total * 10 / 100;
    total = total - discount
  }
  if (total<100) {
    delivery=50
    total=total+delivery
  }
  else if(total>150){
    total=total-delivery
    delivery=0
  }
  res.render('user/place-order', { total, user: req.session.user ,block})
})
router.post('/place-order', verifyLogin, async (req, res) => {
  let products1 = await userHelpers.getCartProducts(req.session.user._id)
  let products = await userHelpers.getCartProductList(req.body.userId)
  let orders = await userHelpers.getUserOrders(req.body.userId)
  let discountp = await productHelpers.getdiscountproduct(products1, products1.length)
  console.log("here" + discountp);
  console.log(products.item);
  let totalPrice = 0
  let discount = 0
  let delivery=0
  if (products.length > 0) {
    totalPrice = await userHelpers.getTotalAmount(req.body.userId)
    totalPrice = totalPrice - discountp
    if (orders.length == 0) {
      discount = totalPrice * 10 / 100;
      totalPrice = totalPrice - discount
    }
      }
      console.log("check");
      console.log(totalPrice);
      if (totalPrice<100) {
        delivery=50
        totalPrice=totalPrice+delivery
      }
      else if(totalPrice>150){
        totalPrice=totalPrice-delivery
        delivery=0
      }
  userHelpers.placeOrder(req.body, products, totalPrice).then(async (orderId) => {
    let product = await userHelpers.getOrderProducts(orderId)
    let stock = await productHelpers.changeStck(product, products.length)
    // 

    if (req.body['paymentMethod'] === 'COD') {
      userHelpers.changePaymentStatus(orderId).then((response) => {
        if (stock < 0) {
          userHelpers.removeOrder(orderId).then((response) => {
            res.json({ outofstck: true })
          })
        }
        else {
          res.json({ cod_success: true })
        }
      })
    }
    else {
      userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
        if (stock < 0) {
          userHelpers.removeOrder(orderId).then((response) => {
            res.json({ outofstck: true })
          })
        }
        else {
          res.json(response)
        }
      })
    }
  })
})
router.get('/orders', verifyLogin, async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders', { user: req.session.user, orders })
})
router.get('/view-order-products/:id', verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  console.log(products);
  res.render('user/view-order-products', { products, user: req.session.user })
})
router.post('/verify-payment', (req, res) => {
  console.log("verification");
  console.log(req.body);
  userHelpers.verifyPayment(req.body).then(() => {
    console.log(req.body['order[receipt]']);
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(() => {

      console.log("hlo");
      res.json({ status: true })
    })
  }).catch((err) => {
    console.log(err);
    res.json({ status: false })
  })
})
router.get('/cancel/:id', verifyLogin, (req, res) => {
  let orderId = req.params.id//params id = :id
  console.log(orderId)
  userHelpers.removeOrder(orderId).then((response) => {
    res.redirect('/orders')
  })
});
router.get('/profile', verifyLogin, async (req, res) => {
  let userId = req.session.user._id
  userHelpers.getUserProfile(userId).then((data) => {
    console.log(data);
    res.render('user/profile', { data })
  })
})
router.post('/search', verifyLogin, async (req, res) => {
  let user = req.session.user
  console.log(req.body.name);
  let prodectName = await req.body.name
  let products = await userHelpers.getProductByName(prodectName)
  console.log(products.length);
  if (products.length <= 0) {
    let outofstck = true
    res.render('user/search', { user, outofstck })
  }
  else {
    res.render('user/search', { user, products })
  }
})
router.get('/edit-profile', verifyLogin, (req, res) => {
  let data = req.session.user
  res.render('user/edit-profile', { data })
})
router.post('/edit-profile', (req, res) => {
  let userId = req.session.user._id
  console.log(req.body);
  userHelpers.updateProfile(req.body, userId).then(() => {
    res.redirect('/profile')
  })
})
router.get('/forgotpas', (req, res) => {
  res.render('user/forgotpas', { 'loginErr': req.session.userLoginErr })
  req.session.userLoginErr = false
})
router.post('/forgotpas', async (req, res) => {
  let user = await userHelpers.Emailverify(req.body)
  if (user) {
    console.log(user);
    DATA = user
    otp = await userHelpers.sendEmail(user.Email)
    res.render('user/verifyforgot')
  } 
  else {
    req.session.userLoginErr = "Invalid email or username"//set err if keep err in session
    res.redirect('/forgotpas')
  }
})
router.post('/verifyforgot', (req, res) => {
  let userotp = parseInt(req.body.otp);
  if (userotp == otp) {
    res.redirect('/updatePassword')
  }
  else {
    req.session.userLoginErr = "incorrent otp"//set err if keep err in session
    res.redirect('/forgotpas')
  }
})
router.get('/updatePassword', (req, res) => {
  res.render('user/updatePassword', { 'loginErr': req.session.userLoginErr })
  req.session.userLoginErr=false
})
router.post('/updatePassword', (req, res) => {
  let password = req.body.Password
  let passwords = req.body.Passwords
  if (password === passwords) {
    userHelpers.changePassword(DATA, password)
    res.redirect('/login')
  }
  else {
    req.session.userLoginErr = "pleace conform password is correct"//set err if keep err in session
    res.redirect('/updatePassword')
  }
})
module.exports = router;



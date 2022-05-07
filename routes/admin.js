var express = require('express');
const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const shop_helpers = require('../helpers/shop_helpers');
const userHelpers = require('../helpers/user-helpers')
const producer_helpers = require('../helpers/producer_helpers')
var router = express.Router();
const verifyLogin = (req, res, next) => {
  if (req.session.adminLoggedIn) {
    next()
  }
  else {
    res.redirect('/admin/login_admin')
  }
}
var otp = null;  // Global variable
var DATA = null;
/* GET users listing. */
router.get('/', verifyLogin,async (req, res) => {
  let getProfitOfMndy =0
let getProfitOfklpta=0
let getProfitOfbthry=0
  let ordercount = await productHelpers.getOrderCount()
  let requireCount = await productHelpers.getReqCount()
  let prodCount = await productHelpers.getproducerCount()
  let userCount = await productHelpers.getUserCount()
  let profit = await productHelpers.getTotalProfit()
  let TotalOrders = await productHelpers.getTotalOrders()
  let dilivercheckformdy=await productHelpers.checkmndydlvry()
  if(dilivercheckformdy){
    getProfitOfMndy = await shop_helpers.getProfitOfMndy()
  }
  let dilivercheckforklpta=await productHelpers.checkklpdlvry()
  if(dilivercheckformdy){
    getProfitOfklpta = await shop_helpers.getProfitOfklpta()
  }
  let dilivercheckforbthry=await productHelpers.checkbthrdlvry()
  if(dilivercheckformdy){
    getProfitOfbthry = await shop_helpers.getProfitOfbthry()
  }
  console.log(ordercount.placedCount);
  res.render('admin/home', { 
    admin: true, ordercount, requireCount, prodCount,
    getProfitOfMndy, getProfitOfklpta, getProfitOfbthry, profit, TotalOrders, userCount
  })
})
router.get('/view-products',verifyLogin, function (req, res, next) {
  productHelpers.getAllProducts().then((products) => { //here use promise   
    res.render('admin/view-products', { admin: true, products })
  })
});
router.get('/add-product',verifyLogin, function (req, res, next) {
  shop_helpers.getShops().then((shop) => {

    res.render('admin/add-product', { shop, admin: true })//sub root set for admin
  })
});
router.post('/add-product',verifyLogin, function (req, res, next) {
  // console.log(req.body)//cheque data at body  // console.log(req.files.image)
  productHelpers.addProduct(req.body, function (id) { //here use call back id founstion
    let image = req.files.Image
    image.mv('./public/product-images/' + id + '.jpg', function (err, done) {
      if (!err) {
        res.render('admin/add-product', { admin: true })
      }
      else {
        console.log(err + 'detect errors')
      }
    })//middlewere

  })
});
router.get('/delete-product/:id',verifyLogin, (req, res) => {
  let proId = req.params.id//params id = :id
  console.log(proId)
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin')
  })
});
router.get('/claim-requirement/:id',verifyLogin,(req,res)=>{
  let reqireId=req.params.id
  console.log(reqireId);
  productHelpers.getRequireDetails(reqireId).then((products)=>{
    productHelpers.ClaimProducts(products).then(()=>{
      productHelpers.deleterequirement(reqireId).then((response) => {
        res.redirect('/admin')
      })  
    })
  })  
})
router.get('/edit-product/:id',verifyLogin, async (req, res) => {
  let product = await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product', { product, admin: true })
});

router.post('/edit-product/:id',verifyLogin, (req, res) => {
  console.log(req.params.id)
  let id = req.params.id
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect('/admin')
    if (req.files.Image) {
      let image = req.files.Image
      image.mv('./public/product-images/' + id + '.jpg')
    }//image check for uploading
  })
})

router.get('/view-orders',verifyLogin, (req, res) => {
  productHelpers.getallOrders().then((orders) => {
    res.render('admin/view-orders', { admin: true, orders })
  })
})
router.get('/view-order-products/:id',verifyLogin, async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('admin/view-order-products', { admin: true, products })
})
router.get('/view-shop-details',verifyLogin, (req, res) => {
  shop_helpers.getShops().then((details) => {
    res.render('admin/view-shop-details', { admin: true, details })
  })
})
router.get('/add-shop',verifyLogin, (req, res) => {
  res.render('admin/add-shop', { admin: true })
})
router.post('/add-shop',verifyLogin, (req, res) => {
  console.log(req.body);
  shop_helpers.addShop(req.body).then((response) => {
    res.redirect('/admin')
  })
})
router.get('/delete-shop/:id',verifyLogin, (req, res) => {
  let shopId = req.params.id//params id = :id
  console.log(shopId)
  shop_helpers.deleteShop(shopId).then((response) => {
    res.redirect('/admin')
  })
});
router.get('/edit-shop/:id',verifyLogin, async (req, res) => {
  console.log(req.params.id);
  let details = await shop_helpers.getShopDetails(req.params.id)
  res.render('admin/edit-shop', { admin: true, details })
})
router.post('/edit-shop/:id',verifyLogin, (req, res) => {
  shop_helpers.updateShopDetails(req.params.id, req.body).then(() => {
    res.redirect('/admin')
  })
})
router.get('/view-all-users',verifyLogin, (req, res) => {
  userHelpers.getAllUsers().then((users) => {
    res.render('admin/view-all-users', { admin: true, users })
  })
})
router.get('/view-all-producers',verifyLogin, (req, res) => {
  producer_helpers.getAllProducers().then((producers) => {
    res.render('admin/view-all-producers', { admin: true, producers })
  })
})
//for security
// router.get('/signup',(req,res)=>{
//   res.render('admin/signup',{admin:true})
// })
// router.post('/signup',(req,res)=>{
//   productHelpers.doSignUp(req.body).then((response)=>{
//     req.session.admin = response
//     req.session.adminLoggedIn = true
//     res.redirect('/admin')
//   })
// })
router.get('/login_admin',(req,res)=>{
  if (req.session.admin) {
    res.redirect('/admin')
  } else {
    res.render('admin/login_admin', { 'loginErr': req.session.adminLoginErr ,admin:true})//data validation through check err
    req.session.adminLoginErr = false
  }
})
router.post('/login_admin',async(req,res)=>{
  userHelpers.checkAdmin(req.body).then(async (response) => {
    if (response.status) {
      console.log(req.body.Email);
      let recipients = req.body.Email
      otp = await userHelpers.sendEmail(recipients)
      DATA=req.body
      res.redirect('/admin/loginVerification')
    }
    else {      
      req.session.adminLoginErr = "Invalid Email or Password"//set err if keep err in session
      res.redirect('/admin/login_admin')
    }
  })
  
})
router.get('/logout', (req, res) => {
  req.session.admin = null
  req.session.adminLoggedIn = false//here clear session by using destroy function
  res.redirect('/')
});
router.get('/loginVerification',(req,res)=>{
  res.render('admin/loginVerification', { 'loginErr': req.session.adminLoginErr ,admin:true})
})
router.post('/loginVerification',(req,res)=>{
  let userOtp = parseInt(req.body.otp);
  if (otp == userOtp) {
    let data=DATA
    productHelpers.doLogin(data).then((response) => {
      if (response.status) {
        req.session.admin = response.admin//save user data into session
        req.session.adminLoggedIn = true //set a variable
        res.redirect('/admin')//here not calling render beacuse /root also define so call redirect
      }
      else {
        req.session.adminLoginErr = "Invalid user name or Password"//set err if keep err in session
        res.redirect('/admin/login_admin')
      }
    })  }
  else {
    req.session.adminLoginErr = "Invalid OTP"//set err if keep err in session
    res.redirect('/admin/loginVerification')
  }
})
router.get('/offers',verifyLogin,(req,res)=>{
  productHelpers.getAllProducts().then((products) => { //here use promise   
    res.render('admin/offers', { admin: true, products })
  })
})
router.get('/view-shop-requirements',verifyLogin,(req,res)=>{
  productHelpers.getAllRequirements().then((products)=>{
    res.render('admin/view-shop-requirements',{admin:req.session.admin,products})
  })
})
module.exports = router;

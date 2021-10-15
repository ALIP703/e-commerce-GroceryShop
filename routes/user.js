const { response } = require('express');
var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers=require('../helpers/user-helpers')
/* GET home page. */
router.get('/', function(req, res, next) {

let user=req.session.user//check keep user data in section already
console.log(user)
  productHelpers.getAllProducts().then((products)=>{ //here use promise
    //console.log(products)
      
    res.render('user/view-products', { products,user})//pass section user
      
    })

 //res.render('index',{title:'M_CART',products,admin:false})
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')  
  }else{
    res.render('user/login',{'loginErr':req.session.loginErr})//data validation through check err
    req.session.loginErr=false
  }
  
});
router.get('/signup',(req,res)=>{
  
  res.render('user/signup')
});
router.post('/signup',(req,res)=>{
   
  userHelpers.doSignup(req.body).then((response)=>{
    console.log(response)
    req.session.loggedIn=true //create session
    req.session.user=response
    res.redirect('/')
    
  })
    
});
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true //set a variable
      req.session.user=response.user//save user datat into session
      res.redirect('/')//here not calling render beacuse /root also define so call redirect
    }
    else{
      req.session.loginErr="Invalid user name or Password"//set err if keep err in session
      res.redirect('/login')
    }
  })  
});
router.get('/logout',(req,res)=>{
   req.session.destroy()//here clear session by using destroy function
   res.redirect('/')
});
const verifyLogin=(req,res,next)=>{//set middle ware for easy for check is user loged? cases //call verifyLogin before route 
  if(req.session.loggedIn)
  {
    next()
  }
  else{
    res.redirect('/login')
  }
};

router.get('/cart',verifyLogin,(req,res)=>{
  res.render('user/cart')
});

module.exports = router;
  

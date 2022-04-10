var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var nodeMailer = require('./node_mail_helper')
var objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_L7YsjcI9cNlZ3g',
    key_secret: '2C8pYdjzh0Ba6WPzsLskm9MG',
});

module.exports = {
    doSignup: (userData) => {//take data
        //install npm module for password dycript by using "npm install bcrypt"
        //use promise
        return new Promise(async (resolve, reject) => {

            userData.Password = await bcrypt.hash(userData.Password, 10)//10 is saltround is which fast//here use hash function 
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })
        })
    },
    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email })
            //  console.log(userData)

            // console.log(userData.Password)
            // console.log(user.Password)
            if (user) {
                bcrypt.compare(userData.Password, user.Password).then((status) => {//bycript compare old and new password are same
                    //console.log(status)
                    if (status == true) {

                        console.log('Login successfull')
                        response.user = user
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log('loginfailed')
                        resolve({ status: false })
                    }

                })

            } else {
                console.log('login faild by Email')
                resolve({ status: false })
            }
        })
    },
    addToCart: (prodId, userId) => {
        let proObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }

                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: objectId(userId) },
                        {
                            $push: {
                                products: proObj
                            }

                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                console.log(cartObj);
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'

                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }


                ,
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            console.log(cartItems);
            resolve(cartItems)

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        console.log(details);
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }

                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }
                    ).then((response) => {

                        resolve(true)
                    })

            }
        })
    },
    removeCartProdect: (cartId, prodId) => {
        console.log(prodId);
        return new Promise(async (resolve, reject) => {


            await db.get().collection(collection.CART_COLLECTION).updateOne({ _id: objectId(cartId) },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }).
                then((response) => {
                    console.log(response);
                    resolve({ removeProduct: true })
                })
        })
    },
    getTotalAmount: (userId) => {

        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
                ,

                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ['$quantity', '$product.Price']
                            }
                        }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })

    },
    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            resolve(cart.products)
        })
    },
    placeOrder: (details, products, totalPrice) => {
        return new Promise((resolve, reject) => {
            var datetime = new Date();
            let cartObj = {
                user: objectId(details.userId),
                date: datetime,
                status: 'pending',
                totalPrice: totalPrice,
                block: details.block,
                deliveryDetails: {
                    name: details.name,
                    Address: details.Address,
                    pincode: details.pincode,
                    phoneNumber: details.phoneNumber,
                    paymentMethod: details.paymentMethod
                },
                products: products
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(cartObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).removeOne({ user: objectId(details.userId) })
                let orderId = objectId(response.ops[0]._id).toString()
                resolve(orderId)
            })
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(userId);
            let orders = await db.get().collection(collection.ORDER_COLLECTION).
                find({ user: objectId(userId) }).toArray()
            resolve(orders)
        })
    },
    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
                ,
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },



    generateRazorpay: (orderId, Price) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: Price * 100,
                currency: "INR",
                receipt: "" + orderId
            }
            instance.orders.create(options, (err, order) => {
                resolve(order)
            })
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', '2C8pYdjzh0Ba6WPzsLskm9MG')
            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            }
            else {
                reject()
            }
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            console.log(orderId);
            db.get().collection(collection.ORDER_COLLECTION).updateOne({ _id: objectId(orderId) },
                {
                    $set: {
                        status: 'placed'
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    removeOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).removeOne({ _id: objectId(orderId) }).then((response) => {
                resolve(response)
            })
        })
    },
    ProductStock: (prodId) => {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) })
            console.log(product.stock);
            let stock = product.stock
            resolve(stock)
        })
    },
    getProductByName: (prodName) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Name: prodName }).toArray()
            resolve(products)
        })
    },
    updateProfile: (details, userId) => {
        return new Promise(async (resolve, reject) => {
            console.log(details);
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        Name:details.Name,
                        Email:details.Email,
                        Address:details.Address,
                        pincode:details.pincode,
                        phoneNumber:details.phoneNumber
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })

        })
    },
    getUserProfile:(userId)=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((data)=>{
                resolve(data)
            })
        })
    },
    sendEmail: (recipient) => {
        console.log("helo");
        let rand = Math.floor((Math.random() * 100) + 1000);
        console.log(recipient);
        let data={
            recipient:recipient,
            subject:"email verification for gshopp",
            message:"your one time password is "+rand
        }
        console.log(data.recipient);
        return new Promise(async(resolve, reject) => {
           await nodeMailer(data).then((response) => {
                console.log("after send mail");
                console.log(rand);
                resolve(rand)
            }).catch(err => {
                reject(err)
            })
        })
    },
    removeEmail:(data)=>{
        console.log("ivde");
        console.log(data);
        let detials={
            email:data.email,
            password:data.password
        }
        console.log(detials);
        return new Promise(async(resolve, reject) => {
        await db.get().collection(collection.USER_COLLECTION).removeOne({email:detials.email,password:detials.password})
            resolve()
        })
    }
}
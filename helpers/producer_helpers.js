var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID

module.exports = {
    doLogin: (producerData) => {
        return new Promise(async (resolve, reject) => {
            console.log(producerData);
            let loginStatus = false;
            let response = {}
            let producer = await db.get().collection(collection.PRODUCER_COLLECTION).findOne({ Email: producerData.Email })
            console.log(producer);
            if (producer) {
                bcrypt.compare(producerData.Password, producer.Password).then((status) => {//bycript compare old and new password are same
                    if (status == true) {
                        console.log('Login successfull')
                        response.producer = producer
                        response.status = true
                        resolve(response)
                    }
                    else {
                        console.log('loginfailed')
                        resolve({ status: false })
                        console.log("false");
                    }

                })

            } else {
                console.log('login faild by Email')
                resolve({ status: false })
            }
        })
    },
    doSignup: (producerData) => {//take data
        console.log(producerData);
        return new Promise(async (resolve, reject) => {

            producerData.Password = await bcrypt.hash(producerData.Password, 10)//10 is saltround is which fast//here use hash function 
            db.get().collection(collection.PRODUCER_COLLECTION).insertOne(producerData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },
    getAllProducers: () => {
        return new Promise(async (resolve, reject) => {
            let producer = await db.get().collection(collection.PRODUCER_COLLECTION).find().toArray()
            resolve(producer)
        })
    },
    getAllRequirements: (block) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.REQUIREMENT_collection).find({ block: block }).toArray()
            resolve(products)
        })
    },
    addWishList: (prodId, userId) => {

        let proObj = {
            item: objectId(prodId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == prodId)
                if (proExist != -1) {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId), 'products.item': objectId(prodId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }

                    ).then(() => {
                        resolve()
                    })
                } else {
                    db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ user: objectId(userId) },
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
                let wishObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                console.log(wishObj);
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(wishObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getwishProducts: (producerID) => {
        return new Promise(async (resolve, reject) => {
            let wishItems = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(producerID) }
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
                        from: collection.REQUIREMENT_collection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'wishList'
                    }
                }


                ,
                {
                    $project: {
                        item: 1, quantity: 1, wishList: { $arrayElemAt: ['$wishList', 0] }
                    }
                }
            ]).toArray()
            console.log(wishItems);
            console.log("list");
            resolve(wishItems)

        })
    },
    getTotalAmount: (producerID) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.WISHLIST_COLLECTION).aggregate([
                {
                    $match: { user: objectId(producerID) }
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
                        from: collection.REQUIREMENT_collection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'wishList'
                    }
                }
                ,

                {
                    $project: {
                        item: 1, quantity: 1, wishList: { $arrayElemAt: ['$wishList', 0] }
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: {
                                $multiply: ['$quantity', '$wishList.Price']
                            }
                        }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })

    },
    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        console.log(details);
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }

                ).then((response) => {
                    resolve({ removeProduct: true })
                })
            } else {
                db.get().collection(collection.WISHLIST_COLLECTION)
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
    removewishProdect: (wishId, prodId) => {
        console.log(prodId);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.WISHLIST_COLLECTION).updateOne({ _id: objectId(wishId) },
                {
                    $pull: { products: { item: objectId(prodId) } }
                }).
                then((response) => {
                    console.log(response);
                    resolve({ removeProduct: true })
                })
        })
    },
    placeOrder: (details, products, totalPrice) => {
        return new Promise((resolve, reject) => {
            var datetime = new Date();
            let cartObj = {
                producer: objectId(details.producerId),
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
            db.get().collection(collection.CLAIM_COLLECTION).insertOne(cartObj).then((response) => {
                db.get().collection(collection.WISHLIST_COLLECTION).removeOne({ user: objectId(details.producerId) })
                let orderId = objectId(response.ops[0]._id).toString()
                resolve(orderId)
            })
        })
    },
    getClaimProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.CLAIM_COLLECTION).aggregate([
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
                        from: collection.REQUIREMENT_collection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'requirement'
                    }
                }
                ,
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$requirement', 0] }
                    }
                }
            ]).toArray()
            resolve(orderItems)
        })
    },
    changeStck: (orderProducts, count) => {
        return new Promise(async (resolve, reject) => {
            let i = 0
            while (count - 1 >= i) {
                let quantity = orderProducts[i].quantity;
                let stock = orderProducts[i].product.stock;
                var total = stock - quantity;
                let prodId = orderProducts[i].item;
                console.log(total);
                if (total >= 0) {
                    let products = await db.get().collection(collection.REQUIREMENT_collection).updateOne({ _id: objectId(prodId) },
                        {
                            $set: {
                                stock: total
                            }
                        }
                    )
                    i = i + 1
                }
                else {
                    break;
                }
            }
            resolve(total)
        })
    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve, reject) => {
            console.log(orderId);
            db.get().collection(collection.CLAIM_COLLECTION).updateOne({ _id: objectId(orderId) },
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
    removeClaims: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CLAIM_COLLECTION).removeOne({ _id: objectId(orderId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getwishProductList: (producerId) => {
        console.log(producerId);
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(producerId) })
            console.log(cart);
            resolve(cart.products)
        })
    },
    getProducerclaims: (producerId) => {
        return new Promise(async (resolve, reject) => {
            console.log(producerId);
            let claims = await db.get().collection(collection.CLAIM_COLLECTION).
                find({ producer: objectId(producerId) }).toArray()
            resolve(claims)
        })
    },
    getClaimProducts: (claimId) => {
        return new Promise(async (resolve, reject) => {
            let claimItems = await db.get().collection(collection.CLAIM_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(claimId) }
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
                        from: collection.REQUIREMENT_collection,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'requirement'
                    }
                }
                ,
                {
                    $project: {
                        item: 1, quantity: 1, product: { $arrayElemAt: ['$requirement', 0] }
                    }
                }
            ]).toArray()
            resolve(claimItems)
        })

    },
    removeclaiming: (claimId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CLAIM_COLLECTION).removeOne({ _id: objectId(claimId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getALLCLamCount: (producerId) => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.CLAIM_COLLECTION).countDocuments({ producer: objectId(producerId) })
            resolve(count)
        })
    },
    getProfit: (producerId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CLAIM_COLLECTION).aggregate([
                {
                    $match:
                    {
                        $and: [
                            { status: "claimed" },
                            { producer: objectId(producerId) }
                        ]
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$totalPrice" }
                    }
                }
            ]).toArray()
            resolve(total[0].total)
        })
    },
    removeEmail: (data) => {
        console.log("ivde");
        console.log(data);
        let detials = {
            email: data.email,
            password: data.password
        }
        console.log(detials);
        return new Promise(async (resolve, reject) => {
            await db.get().collection(collection.PRODUCER_COLLECTION).removeOne({ email: detials.email, password: detials.password })
            resolve()
        })
    },
    updateProfile: (details, producerId) => {
        return new Promise(async (resolve, reject) => {
            console.log(details);
            db.get().collection(collection.PRODUCER_COLLECTION).updateOne({ _id: objectId(producerId) },
                {
                    $set: {
                        name: details.name,
                        Email: details.Email,
                        address: details.address,
                        block: details.block,
                        phone: details.phone
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })

        })
    },
    checkUser: (producerData) => {
        return new Promise(async (resolve, reject) => {
            console.log(producerData);
            let loginStatus = false;
            let response = {}
            let producer = await db.get().collection(collection.PRODUCER_COLLECTION).findOne({ Email: producerData.Email })
            console.log(producer);
            if (producer) {
                bcrypt.compare(producerData.Password, producer.Password).then((status) => {//bycript compare old and new password are same
                    if (status == true) {
                        console.log('Login successfull')
                        resolve({ status: true })
                    }
                    else {
                        console.log('loginfailed')
                        resolve({ status: false })
                        console.log("false");
                    }
                })

            } else {
                console.log('login faild by Email')
                resolve({ status: false })
            }
        })
    },
    checkthruser:(email)=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCER_COLLECTION).findOne({Email:email}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    Emailverify:(details)=>{
        console.log(details);
        let Email = details.Email
        let name = details.name
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCER_COLLECTION).findOne({ Email: Email, name: name }).then((data) => {
                console.log(data);
                console.log("here");
                resolve(data)
            })
        })
    },
    changePassword:(userDetails, password)=>{
        let userId = userDetails._id
        console.log(userId);
        return new Promise(async (resolve, reject) => {
            userDetails.Password = await bcrypt.hash(password, 10)
            db.get().collection(collection.PRODUCER_COLLECTION).updateOne({ _id: objectId(userId) },
                {
                    $set: {
                        name: userDetails.name,
                        Email: userDetails.Email,
                        address: userDetails.address,
                        block: userDetails.block,
                        phone: userDetails.phone,
                        Password: userDetails.Password
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })
        })
    }
}

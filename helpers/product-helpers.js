var db = require('../config/connection')
const bcrypt = require('bcrypt')
var collection = require('../config/collections');
const { response } = require('../app');
var objectId = require('mongodb').ObjectID//it use convert object id string into database stored type id and the compare two id for delete product
module.exports = {
    addProduct: function (product, callback) {
        // console.log(product.Price)
        //convert price and stock string to integer 
        product.Price = parseInt(product.Price);
        product.stock = parseInt(product.stock);
        db.get().collection('product').insertOne(product).then(function (data) {
            console.log(data)//here check how show dta // here needed data show ops array
            callback(data.ops[0]._id)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.PRODUCT_COLLECTION).countDocuments()
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objectId(prodId) }).then((response) => {
                // console.log(response)
                resolve(response)
            })
        })
    },
    getProductDetails: (prodId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(prodId) }).then((product) => {
                resolve(product)
            })
        })
    },
    updateProduct: (proId, ProductDetails) => {
        console.log(ProductDetails);
        ProductDetails.Price = parseInt(ProductDetails.Price)
        ProductDetails.discount = parseInt(ProductDetails.discount)
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
                $set: {
                    Name: ProductDetails.Name,
                    Category: ProductDetails.Category,
                    Price: ProductDetails.Price,
                    stock: ProductDetails.stock,
                    Description: ProductDetails.Description,
                    discount: ProductDetails.discount
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    getVegProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: 'cutted vegitable' }).toArray()
            resolve(products)
        })
    },
    getVeg2Products: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: 'non cutted vegitable' }).toArray()
            resolve(products)
        })
    },
    getGrocerryProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: 'grocerry' }).toArray()
            resolve(products)
        })
    },
    getFruitsProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: 'fruits' }).toArray()
            resolve(products)
        })
    },
    getFishProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: 'fish' }).toArray()
            resolve(products)
        })
    },
    getMeetProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ Category: 'meet' }).toArray()
            resolve(products)
        })
    },
    getOrderOfMndy: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).findOne({ deliveryDetails, block: 'mananthavady' }).toArray()
            console.log(orders);
            resolve(orders)
        })
    },
    getOrderCount: () => {
        return new Promise(async (resolve, reject) => {
            let placedCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
                status: "placed"
            })
            let deliverCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
                status: "delivered"
            })
            let transportCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
                status: "transporting"
            })
            let shippedCount = await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
                status: "shipped"
            })
            let count = {
                placedCount: placedCount,
                deliverCount: deliverCount,
                transportCount: transportCount,
                shippedCount: shippedCount
            }
            console.log(count);
            resolve(count)
        })
    },
    getproducerCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.PRODUCER_COLLECTION).countDocuments()
            resolve(count)
        })
    },
    getUserCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.USER_COLLECTION).countDocuments()
            resolve(count)
        })
    },
    getTotalProfit: () => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { status: "delivered" }
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
    getReqCount: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.REQUIREMENT_collection).countDocuments()
            resolve(count)
        })
    },
    getTotalOrders: () => {
        return new Promise(async (resolve, reject) => {
            let count = await db.get().collection(collection.ORDER_COLLECTION).countDocuments()
            resolve(count)
        })
    },
    getallOrders: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
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
                    let products = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(prodId) },
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
    doSignUp: (adminData) => {//take data
        //install npm module for password dycript by using "npm install bcrypt"
        //use promise
        return new Promise(async (resolve, reject) => {

            adminData.Password = await bcrypt.hash(adminData.Password, 10)//10 is saltround is which fast//here use hash function 
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data) => {
                resolve(data)
            })
        })
    },
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ Email: adminData.Email })
            if (admin) {
                bcrypt.compare(adminData.Password, admin.Password).then((status) => {//bycript compare old and new password are same
                    //console.log(status)
                    if (status == true) {

                        console.log('Login successfull')
                        response.admin = admin
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
    getdiscountproduct: (products, prodlenth) => {
        return new Promise(async (resolve, reject) => {
            let discount = 0
            let price=0
            for (let i = 0; i < prodlenth; i++) {
                console.log(products[i]);
                if (products[i].product.discount) {
                    discount = discount + (products[i].product.discount * products[i].quantity)
                }
            }
            resolve(discount)
        })
    },
    getallshopdetails:()=>{
        return new Promise(async (resolve, reject) => {
        let shops=await db.get().collection(collection.SHOP_COLLECTION).find().toArray()
        resolve(shops)
        })
    },
    getAllRequirements:()=>{
        return new Promise(async (resolve, reject) => {
            let products=await db.get().collection(collection.REQUIREMENT_collection).find().toArray()
        resolve(products)
        })
    },
    deleterequirement:(prodId)=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.REQUIREMENT_collection).removeOne({ _id: objectId(prodId) }).then((response) => {
                // console.log(response)
                resolve(response)
            })
        })
    },
    getRequireDetails:(prodId)=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.REQUIREMENT_collection).findOne({ _id: objectId(prodId) }).then((response) => {
                 console.log(response)
                resolve(response)
            })
        })
    },
    ClaimProducts:(ProductDetails)=>{
        let data={
            Name:ProductDetails.Name,
            Category:ProductDetails.Category,
            Price:ProductDetails.Price,
            stock:ProductDetails.stock,
            Description:ProductDetails.Description
        }
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(ProductDetails).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    checkmndydlvry:()=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({block:"mananthavady"},{status:"delivered"}).then((response)=>{
                console.log("check");
                console.log(response);
                console.log("check");

                resolve(response)
            })
        })
    },
    checkklpdlvry:()=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({block:"kalpetta"},{status:"delivered"}).then((response)=>{
                console.log("check");
                console.log(response);
                console.log("null");
                if(response!=null){
                    resolve()
                }
                else{
                    resolve(response)

                }
            })
        })
    },
    checkbthrdlvry:()=>{
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).findOne({block:"bathery"},{status:"delivered"}).then((response)=>{
                console.log("check");
                console.log(response);
                console.log("check");

                resolve(response)
            })
        })
    }
}

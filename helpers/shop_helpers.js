var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
var objectId = require('mongodb').ObjectID

module.exports = {
    doLogin: (shopData) => {
        return new Promise(async (resolve, reject) => {
            console.log(shopData);
            let loginStatus = false;
            let response = {}
            let shop = await db.get().collection(collection.SHOP_COLLECTION).findOne({ Email: shopData.Email })
            console.log(shop);
            if (shop) {
                bcrypt.compare(shopData.Password, shop.Password).then((status) => {//bycript compare old and new password are same
                    if (status == true) {
                        console.log('Login successfull')
                        response.shop = shop
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
    checkShop:(shopData)=>{
        return new Promise(async (resolve, reject) => {
            console.log(shopData);
            let loginStatus = false;
            let shop = await db.get().collection(collection.SHOP_COLLECTION).findOne({ Email: shopData.Email })
            console.log(shop);
            if (shop) {
                bcrypt.compare(shopData.Password, shop.Password).then((status) => {//bycript compare old and new password are same
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
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getShops: () => {
        return new Promise(async (resolve, reject) => {
            let details = await db.get().collection(collection.SHOP_COLLECTION).find().toArray()
            resolve(details)
        })
    },
    getShopDetails: (shopId) => {
        console.log(shopId);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.SHOP_COLLECTION).findOne({ _id: objectId(shopId) }).then((response) => {
                resolve(response)
            })
        })
    },
    addShop: (shopData) => {
        return new Promise(async(resolve, reject) => {
            shopData.Password = await bcrypt.hash(shopData.Password, 10)//10 is saltround is which fast//here use hash function 
            db.get().collection(collection.SHOP_COLLECTION).insertOne(shopData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },
    updateShopDetails: (shopId, shopDetails) => {
        return new Promise(async(resolve, reject) => {
           await db.get().collection(collection.SHOP_COLLECTION).updateOne({ _id: objectId(shopId) }, {
                $set: {
                    shopName: shopDetails.shopName,
                    address: shopDetails.address,
                    block: shopDetails.block,
                    Email: shopDetails.Email,

                }
            }).then((response) => {
                resolve()
            })
        })
    },
    deleteShop:(shopId)=>{
        return new Promise((resolve, reject)=> {
            db.get().collection(collection.SHOP_COLLECTION).removeOne({ _id: objectId(shopId) }).then((response) => {
                resolve(response)
        })
    })
},
shipped:(orderId)=>{
    return new Promise((resolve, reject)=> {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'shipped'
            }
        }
    ).then((response)=>{
            resolve(response)
        })
    })
},

transport:(orderId)=>{
    return new Promise((resolve, reject)=> {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'transporting'
            }
        }
    ).then((response)=>{
            resolve(response)
        })
    })
},
delivered:(orderId)=>{
    return new Promise((resolve, reject)=> {
        db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
        {
            $set:{
                status:'delivered'
            }
        }
    ).then((response)=>{
            resolve(response)
        })
    })
},

getAllProducers:(blockName)=>{
    return new Promise(async(resolve, reject)=> {
        let producers=await  db.get().collection(collection.PRODUCER_COLLECTION).find({block:blockName}).toArray()
        console.log(producers);
        resolve(producers)
      })
},
requestProduct:(product,block)=>{
    //convert price and stock string to integer 
     product.Price=parseInt(product.Price);
     product.stock=parseInt(product.stock);
     console.log(block);
     let details={
        block:block,
        Name:product.Name,
        Category:product.Category,
        Price:product.Price,
        stock:product.stock,
        Description:product.Description
       
     }
     console.log(details);
     return new Promise(async(resolve, reject)=> {

  await  db.get().collection(collection.REQUIREMENT_collection).insertOne(details).then((data)=> {
        console.log(data.ops[0]._id)//here check how show dta // here needed data show ops array
        resolve(data.ops[0]._id)
    })
})
},
getRequirements:(center)=>{
    return new Promise(async(resolve, reject)=> {
        let products=await db.get().collection(collection.REQUIREMENT_collection).find({block:center}).toArray()
            resolve(products)
    })
},
deleteRequrement:(prodId)=>{
    return new Promise((resolve, reject)=> {
        db.get().collection(collection.REQUIREMENT_collection).removeOne({_id:objectId(prodId)}).then((response)=>{
            resolve(response)
        })
    })
},
getRequirementDetails:(prodId)=>{
    return new Promise((resolve, reject)=> {
    db.get().collection(collection.REQUIREMENT_collection).findOne({_id:objectId(prodId)}).then((response)=>{
        resolve(response)
    })
    })
},
updateRequirement:(proId, ProductDetails) => {
    return new Promise((resolve, reject) => {
        db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) }, {
            $set: {
                Name: ProductDetails.Name,
                Category: ProductDetails.Category,
                Price: ProductDetails.Price,
                stock:ProductDetails.stock,
                Description: ProductDetails.Description,

            }
        }).then((response) => {
            resolve()
        })
    })
},
getALLOrderCount:(shop)=>{
    return new Promise(async (resolve, reject) => {
        let count =await db.get().collection(collection.ORDER_COLLECTION).countDocuments({block:shop})
        resolve(count)
    })
},
getReqCount:(center)=>{
    return new Promise(async (resolve, reject) => {
        let count =await db.get().collection(collection.REQUIREMENT_collection).countDocuments({block:center})
        resolve(count)
    })
},
getprodCount:(shop)=>{    
    return new Promise(async (resolve, reject) => {
        let count =await db.get().collection(collection.PRODUCER_COLLECTION).countDocuments({
            block:shop.center
        })        
        resolve(count)
    })
},
getTotalProfit: (blockName) => {
    console.log(blockName);
    return new Promise(async (resolve, reject) => {
        let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:
                {
                    $and: [
                    {status: "delivered"}, 
                    {block: blockName}
                    ]
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }                }
            }
        ]).toArray()
        console.log(total);
        // = undefined && total.lenth
        if (total != null) {
            resolve(total[0].total)
        }
        else{
            resolve()
        }
    })
},
getOrderCounts:(shop)=>{
    console.log(shop);
    return new Promise(async (resolve, reject) => {
    let placedCount=await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        block:shop,status: "placed"
    })
    let deliverCount=await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        block:shop,status: "delivered"
    })
    let transportCount=await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        block:shop,status: "transporting"
    })
    let shippedCount=await db.get().collection(collection.ORDER_COLLECTION).countDocuments({
        block:shop,status: "shipped"
    })
    let count={
        placedCount:placedCount,
        deliverCount:deliverCount,
        transportCount:transportCount,
        shippedCount:shippedCount
    }
    console.log(count);
    resolve(count)
    })
},
getOrders: (center) => {
    return new Promise(async (resolve, reject) => {
     let orders=await db.get().collection(collection.ORDER_COLLECTION).find({block:center}).toArray()
            console.log(orders);
            resolve(orders)
        

    })
},
getProfitOfMndy:()=>{
    
    return new Promise(async (resolve, reject) => {
        let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:
                {
                    $and: [
                    {status: "delivered"}, 
                    {block: "mananthavady"}
                    ]
                }
                
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }                }
            }
        ]).toArray()

        console.log(total);
        resolve(total[0].total)
    })
},
getProfitOfklpta:()=>{
        
    return new Promise(async (resolve, reject) => {
        let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:
                {
                    $and: [
                    {status: "delivered"}, 
                    {block: "kalpetta"}
                    ]
                }
                
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }                }
            }
        ]).toArray()

        console.log(total[0].total);
        resolve(total[0].total)
    })
},
getProfitOfbthry:()=>{
    return new Promise(async (resolve, reject) => {
        let total = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match:
                {
                    $and: [
                    {status: "delivered"}, 
                    {block: "bathery"}
                    ]
                }
                
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$totalPrice" }                }
            }
        ]).toArray()

        console.log(total[0].total);
        resolve(total[0].total)
    })
},
getProducerclaims:(center)=>{
    return new Promise(async (resolve, reject) => {
        console.log(center);
        let claims = await db.get().collection(collection.CLAIM_COLLECTION).
            find({ block:center }).toArray()
        resolve(claims)
    })
},
getClaimProducts:(claimId)=>{
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
claimed:(claimId)=>{
    return new Promise((resolve, reject)=> {
        db.get().collection(collection.CLAIM_COLLECTION).updateOne({_id:objectId(claimId)},
        {
            $set:{
                status:'claimed'
            }
        }
    ).then((response)=>{
            resolve(response)
        })
    })
}

}
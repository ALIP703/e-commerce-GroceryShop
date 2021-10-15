var db=require('../config/connection')
var collection=require('../config/collections')
var objectId=require('mongodb').ObjectID//it use convert object id string into database stored type id and the compare two id for delete product
module.exports={
    addProduct:function(product,callback){
        console.log('product')
        db.get().collection('product').insertOne(product).then(function(data){
          
            console.log(data)//here check how show dta // here needed data show ops array
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
               // console.log(response)
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,ProductDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    Name:ProductDetails.Name,
                    Category:ProductDetails.Category,
                    Price:ProductDetails.Price,
                    Description:ProductDetails.Description,
                    
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}
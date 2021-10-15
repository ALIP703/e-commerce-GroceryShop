var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')

module.exports = {
    doSignup: (userData) => {//take data
        //install npm module for password dycript by using "npm install bcrypt"
        //use promise
        return new Promise(async (resolve, reject) => {

            userData.Password = await bcrypt.hash(userData.Password, 10)//10 is saltround is which fast//here use hash function 
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.ops[0])
            })
        })
    },
    doLogin: (userData) => {

        return new Promise(async (resolve, reject) => {
            let loginStatus=false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email:userData.Email})
      //  console.log(userData)
        
       // console.log(userData.Password)
       // console.log(user.Password)
            if (user) {
                bcrypt.compare(userData.Password,user.Password).then((status) => {//bycript compare old and new password are same
        //console.log(status)
                    if (status==true) {

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
    }
}
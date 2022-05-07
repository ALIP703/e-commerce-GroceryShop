// const { response } = require("express")

// const { response } = require("../../app")

function addToCart(proId){
    $.ajax({
        url:'/add-to-cart/'+proId,
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-Count').html()
                count=parseInt(count)+1
                $("#cart-Count").html(count)
                alert("product added to cart")
            }
            else{
                alert("product out of stock")
            }
        }
    })
}

function changeQuantity(cartId, prodId, count) {
    let quantity = parseInt(document.getElementById(prodId).innerHTML)   
    count = parseInt(count)
    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: prodId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert("product remove from cart");
                location.reload()
            } else {
                document.getElementById(prodId).innerHTML = quantity + count
                //  document.getElementById('total').innerHTML=response.total
                location.reload()
            }
        }
    })
 }
 
   
 $(function () {
    $('#orderTable').DataTable({
    });

} );
$(function () {
    $('#myTable1').DataTable();
  });

function removeProduct(cartId,prodId){
    $.ajax({
        url:'/remove-cart-product',
        data:{
            cartId:cartId,
            product: prodId
            
        },
        method:'post',
        success:(response)=>{
            if (response.removeProduct) {
                alert("product remove from cart");
                location.reload()
            }
        }
    })
}


function addToWishList(reqId) {
    $.ajax({
      url:'/producer/add-to-wishlist/'+reqId,
      method: 'get',
      success: (response) => {
        if (response.status)
          {
            let count=$('#wish-Count').html()
            count=parseInt(count)+1
            $("#wish-Count").html(count)
            alert("product added to wishList")
          }

      }
    })
   
}
function changeQuantity2(wishID, prodId, count) {
    let quantity = parseInt(document.getElementById(prodId).innerHTML)   
    count = parseInt(count)
    $.ajax({
        url: '/producer/change-product-quantity',
        data: {
            cart: wishID,
            product: prodId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            if (response.removeProduct) {
                alert("product remove from cart");
                location.reload()
            } else {
                document.getElementById(prodId).innerHTML = quantity + count
                //  document.getElementById('total').innerHTML=response.total
                location.reload()
            }
        }
    })
 }
 function removeProduct2(wishId,prodId){
    $.ajax({
        url:'/producer/remove-wish-product',
        data:{
            wishId:wishId,
            product: prodId
            
        },
        method:'post',
        success:(response)=>{
            if (response.removeProduct) {
                alert("product remove from cart");
                location.reload()
            }
        }
    })
}

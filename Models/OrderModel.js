const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({

    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required:[true,'Please provide userID']
    },
    products:[
        {
            productID:{
                type:mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required:[true,'Please provide productID']
            },
            quantity:{
                type : Number,
                required:[true,'Please provide quantity'],
                min:[1,'minimum quantity should be 1']
            }
        }
    ],
    payment_status:{
        type:String,
        enum:['pending','succeed','failed'],
        default:'succeed'
    },
    delivery_status:{
        type:String,
        enum: ['Pending', 'Delivered','cancelled'],
        default:'Pending'
    } 
},{timestamps:true});

OrderSchema.index({userID:1,payment_status:1});

const Order = mongoose.model('Order',OrderSchema);
module.exports = Order;
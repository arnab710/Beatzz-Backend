const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({

    userID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true,'Please provide userID'],
        unique:true
    },
    products:[
        {
            productID:{
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required:[true,'Please provide productID']
            },
            quantity:{
                type:Number,
                required:[true,'Please provide a quantity'],
                min:[1,'minimum 1 quantity should be there'],
            }
        }
    ]
});
    //indexing userID
    CartSchema.index({userID : 1});

const Cart = mongoose.model('Cart',CartSchema);

module.exports = Cart;
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({

    name:{
        type:String,
        unique:true,
        trim:true,
        required:[true,"Please enter the product's name"]
    },
    price:{
        type:Number,
        required:[true,'please enter the price'],
        min:[99,"Enter the price above 99"],
        max:[999999,'Enter the price below 999999']
    },
    description:{
        type:String,
        required:['true','Enter your product details'],
        minlength:[30,'Minimum length of description should be 30'],
        maxlength:[2000,'Maximum length of description should be 2000'],
        trim:true,
    },
    quantity:{
        type:Number,
        required:true,
        min:[1,'quantity must be at least 1'],
    },
    pictures:{
        type:[{
        url:{
            type:String,
            required:[true,'please provide at least one picture']
        }
    }],
    validate:{
        validator:function(array){
            return array.length>=1;
        },
        message:"Please Provide at least one picture"
    }},
    totalReviews:{
        type:Number,
        default:0,
    },
    avgRating:{
        type:Number,
        default:0
    },
    totalRating:{
        type:Number,
        default:0,
    }
    }, {timestamps: true });


    ProductSchema.index({price : 1 , avgRating : -1});

    const Product = mongoose.model('Product',ProductSchema);
    
    module.exports = Product;   
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({

    productId : {
        type : mongoose.Schema.Types.ObjectId,
        ref  : 'Product',
        required: [true,'please provide productId']
    },
    rating: {
        type : Number,
        min: [1,'minimum rating should be 1'],
        max: [5,'minimum rating should be 5'],
        required : true
    },
    review: {
        type : String,
        required: true,
        minlength: [4,'minimum review length should be 4'],
        maxlength: [100,'maximum length should be 100']
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required: [true,'Please provide userId']
    }
},{timestamps:true});

ReviewSchema.index({productId : 1});
ReviewSchema.index({productId : 1 , userId : 1});

const Review = mongoose.model('Review',ReviewSchema);

module.exports = Review;
const Product = require("../Models/ProductModel");
const Review = require("../Models/ReviewModel");
const APIFeatures = require("../Utils/APIFeatures");

exports.CreateReview = async (req,res,next) => {

    try{
        //fetching userId from req body
        const userId = req.user._id;
        //fetching productId from req params
        const productId = req.params.productId;

        //destructuring from req body
        const {rating,review} = req.body;
        

        const NewReview = new Review({rating,review,userId,productId});
        
        
        //fetch the product corresponding to the review
        const product = await Product.findById(productId).select('totalReviews avgRating totalRating');
        
        //changing product details
        product.totalReviews += 1;
        product.totalRating += rating;
        product.avgRating = (product.totalRating)/product.totalReviews;

        //saving two documents
        await NewReview.save();
        await product.save();

        res.status(201).json({result:'pass',message:"Review created"});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'Somethig Went Wrong While Creating a Review'});
    }
}

exports.GetProductReviews = async (req,res,next) => {

    try{
        //fetching the productId
        const productId = req.params.productId;
        //fetching reviews from DB with populating userId 
        const CurrQuery = Review.find({productId}).populate({ path :'userId', select : '-email -__v'}).select('-__v');
        //applying paging
        const QueryObj = new APIFeatures(CurrQuery,req.query).Sorting().Paging();

        const reviews = await QueryObj.Query;
        //counting the length of reviews array
        const count = reviews.length;
        res.status(200).json({result:'pass',count,reviews});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'something went wrong while fetching all reviews for this product'});
    }
}

exports.UpdateMyReview = async (req,res,next)=>{

    try{
        //fetching userId and productId 
        const userId = req.user._id;
        const productId = req.params.productId;

        //finding the review
        const OldReview = await Review.findOne({userId,productId}).populate({path : 'productId' , select : 'totalReviews avgRating totalRating'}).select('-__v');
        //if no review found
        if(!OldReview) return res.status(404).json({result:'fail',err:'no review found'});

        //destructuring req body
        const {rating,review} = req.body;

        //**fetching old rating for further use
        const OldRating = OldReview.rating;
        
        //updating 
        if(rating) OldReview.rating = rating;
        if(review) OldReview.review = review;
        
        //just renaming
        const NewReview = OldReview;

        //defining product
        const product = OldReview.productId;

        //updating product
        product.totalRating += (rating - OldRating);
        product.avgRating = product.totalRating / product.totalReviews;

        //saving product and OldReview
        await product.save();
        await NewReview.save();
        
        res.status(200).json({result:'pass',message:'review updated',NewReview});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'something went wrong while updating my review'});
    }
}

exports.DeleteMyReview = async (req,res,next) => {

    try{
        //fetching userId and productId
        const userId = req.user._id;
        const productId = req.params.productId;

        //deleting from user
        const deletedReview = await Review.findOneAndDelete({userId,productId}).populate({path:'productId',select:'totalReviews avgRating totalRating'}).select('-__v');
        if(!deletedReview) return res.status(404).json({result:'fail',err:'Review is not present'});

        //updating the product details
        const product = deletedReview.productId;
        product.totalReviews -= 1;
        product.totalRating -= deletedReview.rating;
        product.avgRating = product.totalRating/product.totalReviews;

        //saving product
        await product.save();
        res.status(200).json({result:'pass',message:'deleted'});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'somthing went wrong while deleting my review'});
    }
}

exports.GetMyReview = async (req,res,next) =>{

    try{
        //fetching userId and productId
        const userId = req.user._id;
        const productId = req.params.productId;

        //fetching my reviews from DB
        const MyReview = await Review.findOne({userId,productId});

        if(!MyReview) return res.status(404).json({result:'fail',err:"your review can't be found"});

        res.status(200).json({result:'pass',MyReview});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'Something went wrong while fetching my review'});
    }
}
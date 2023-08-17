const express = require('express');
const { AuthCheck } = require('../Controllers/AuthController.js');
const { GetProductReviews, CreateReview, UpdateMyReview, DeleteMyReview, GetMyReview} = require('../Controllers/ReviewController.js');

const ReviewRouter = express.Router();


ReviewRouter.route("/:productId").get(GetProductReviews)
                                 .post(AuthCheck,CreateReview)
                                 .patch(AuthCheck,UpdateMyReview)
                                 .delete(AuthCheck,DeleteMyReview);

ReviewRouter.route("/:productId/My-Review").get(AuthCheck,GetMyReview)                                 
module.exports = ReviewRouter;
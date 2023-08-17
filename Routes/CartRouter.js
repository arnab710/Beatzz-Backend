const express = require('express');
const { AuthCheck } = require('../Controllers/AuthController');
const { CreateOrUpdateCart, RemoveAllItems, GetMyCart } = require('../Controllers/CartController');

const cartRouter = express.Router();


    cartRouter.route("/").post(AuthCheck,CreateOrUpdateCart)
                         .get(AuthCheck,GetMyCart)
                         .delete(AuthCheck,RemoveAllItems);
 
module.exports = cartRouter;    
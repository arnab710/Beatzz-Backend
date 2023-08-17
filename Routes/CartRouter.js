const express = require('express');
const { AuthCheck } = require('../Controllers/AuthController.js');
const { CreateOrUpdateCart, RemoveAllItems, GetMyCart } = require('../Controllers/CartController.js');

const cartRouter = express.Router();


    cartRouter.route("/").post(AuthCheck,CreateOrUpdateCart)
                         .get(AuthCheck,GetMyCart)
                         .delete(AuthCheck,RemoveAllItems);
 
module.exports = cartRouter;    
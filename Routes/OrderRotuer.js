const express = require('express');
const { AuthCheck, RoleCheck } = require('../Controllers/AuthController');
const { GetAllUsersOrders, GetMyOrder } = require('../Controllers/OrderController');

const OrderRouter = express.Router();


//for admin  
OrderRouter.route('/').get(AuthCheck,RoleCheck('admin'),GetAllUsersOrders); //to fetch all users orders
                      
//for user
OrderRouter.route('/My-Orders').get(AuthCheck,GetMyOrder) // for fetch user orders
                               


module.exports = OrderRouter;
const express = require('express');
const { CheckOutSession } = require('../Controllers/PaymentController.js');
const { AuthCheck } = require('../Controllers/AuthController.js');


const PaymentRouter = express.Router();

PaymentRouter.route('/').post(AuthCheck,CheckOutSession);


module.exports = PaymentRouter;

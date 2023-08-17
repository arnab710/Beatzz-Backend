const express = require('express');
const { CheckOutSession } = require('../Controllers/PaymentController');
const { AuthCheck } = require('../Controllers/AuthController');


const PaymentRouter = express.Router();

PaymentRouter.route('/').post(AuthCheck,CheckOutSession);


module.exports = PaymentRouter;

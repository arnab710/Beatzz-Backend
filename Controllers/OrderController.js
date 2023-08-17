const Cart = require('../Models/CartModel');
const Order = require('../Models/OrderModel');
const APIFeatures = require('../Utils/APIFeatures');

//for admin to fetch all user's orders
exports.GetAllUsersOrders = async (req,res,next) =>{

    try{
        //fetching all users order details
        const OrdersQuery = Order.find({payment_status:'succeed'});
        //applying pagination
        const OrderObj = new APIFeatures(OrdersQuery,req.query).Paging();

        const Orders = await OrderObj.Query.populate({path:'products.productID',select:'name pictures'}).select('-__v');
        const count = Orders.length;

        res.status(200).json({result:'pass',count,Orders});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'Something went wrong while fetching all users order details'});
    }
}
//For users to get own order
exports.GetMyOrder = async(req,res,next) =>{

    try{
        //getting userID from req.user
        const userID = req.user._id;
        //fetching data based on payment_status
        const OrderQuery = Order.find({userID,payment_status:'succeed'});
        await Cart.findOneAndDelete({userID});
        const MyOrder = await OrderQuery.populate({path:'products.productID',select:'name pictures price'}).select('-__v -payment_status');
        res.status(200).json({result:'pass',MyOrder});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'Something went wrong while fetching your orders'});
    }
}

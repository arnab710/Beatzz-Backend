const Cart = require("../Models/CartModel");
const Product = require("../Models/ProductModel");

//it should invokes , when user clicks 'Buy Now' on the cart page
exports.CreateOrUpdateCart = async (req,res,next) => {

    try{
        //fetching userID and products
        const userID = req.user._id;
        const products = req.body.products;

        //**creating a object to check for duplicate productID's
        const ProductIds = {};

            //***map function to return an array of promises(in pending state) --> map does not wait for the promise to resolve  
            const ProductPromises = products.map(async(product)=>{
                
                    const productId = product.productID;
                    
                    //checking the productId , if the ProductIds object contains the productId earlier 
                    if(ProductIds[productId]) throw new Error('duplicate product found');
                    
                    //if no then creating it
                    ProductIds[productId] = true;

                    //checking if the product is in the DB 
                    const present = await Product.findById(productId).select('quantity'); //only selecting quantity to save bandwidth
                    //if no then throwing error to stop concurrent async function evaluation
                    if(!present) throw new Error('invalid product');

                    //if quantity criteria do not match then throwing error to stop concurrent async function evaluation
                    if(present.quantity< product.quantity) throw new Error('Quantity is higher than stock');

                    return product;
            });

            // Await for all promises(in pending state) returned by map to be evaluated concurrently
            await Promise.all(ProductPromises);

            //checking if the user's cart is already present or not
            let cart = await Cart.findOne({userID});
            
            //if not present
            if(!cart) cart = new Cart({userID,products});
            else cart.products = products; //if present
            
            //saving 
            await cart.save();

            //removing userID and __V from cart before sending it
            cart.userID = undefined;
            cart.__v = undefined;

            res.status(200).json({result:'pass',message:'cart updated',cart});
    }
    catch(err){
        if(process.env.NODE_ENV==='development') console.error(err);
        
        if(err.message==='invalid product') return res.status(400).json({result:'fail',err:err.message});
        else if(err.message === 'Quantity is higher than stock') return res.status(400).json({result:'fail',err:err.message});
        else if(err.message === 'duplicate product found') return res.status(403).json({result:'fail',err:err.message});

        return res.status(500).json({result:'fail',err:'SomeThing went wrong while updating your cart'});
    }
};

//it should invoke when a user is trying get the cart 
exports.GetMyCart = async (req,res,next) => {

    try{
        //fetching user details 
        const userID = req.user._id;
        //finding if user has a cart
        const cart = await Cart.findOne({userID})
                    .populate({path : 'products.productID',select :'name pictures price company'})
                    .select('products');
        
        //if no
        if(!cart) return res.status(404).json({result:'fail',err:'no cart found'});
        
        res.status(200).json({result:'pass',cart});
    }
    catch(err){
        res.status(500).json({result:'fail',err:'Something went wrong while your fetching cart details'})
    }
};

//it should invoke when a user click 'remove all items' on the cart page
exports.RemoveAllItems = async (req,res,next) =>{

    try{
        //fetching the userID
        const userID = req.user._id;
        //finding if user has a cart and delete
        const cart = await Cart.findOneAndDelete({userID}).select('_id'); //only selecting id to save bandwidth
        
        //if cart is not found
        if(!cart) return res.status(404).json({result:'fail',err:'Not found'});

        res.status(200).json({result:'pass',message:'product deleted'});
    }
    catch(err){
        res.status(500).json({result:'fail',message:'Something went wrong while removing the product'});
    }
}


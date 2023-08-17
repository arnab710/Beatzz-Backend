const Order = require('../Models/OrderModel');
const Product = require('../Models/ProductModel');
const stripe = require('stripe')(process.env.STRIPE_API_KEY);

exports.CheckOutSession = async(req,res) =>{

       try{
              const productDetails = req.body;

              let completeProductObject = [];
              const completeProductObjectPromise = productDetails.map(async(product)=>{

                     const eachProduct = await Product.findById(product.productID).select("name price pictures");
                     if(!eachProduct) throw new Error("No Product Found");
                     
                     return {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: eachProduct.name,
                                    images: [eachProduct.pictures[0].url]
                                },
                                unit_amount: eachProduct.price * 100,
                            },
                            quantity: product.quantity
                        };
              })

              completeProductObject =  await Promise.all(completeProductObjectPromise);
              
              if(completeProductObject.length===0) return res.status(400).json({result:'fail',message:'No Valid Product Found'});

              const order = new Order({userID:req.user._id,products:productDetails});
              await order.save();

              const session = await stripe.checkout.sessions.create({
                     line_items: completeProductObject,
                     mode: 'payment',
                     success_url: `${process.env.FRONTEND_ORIGIN}/my-orders`,
                     cancel_url: `${process.env.FRONTEND_ORIGIN}/cart`,
                   });

                 return res.status(200).json({result:"pass/fail",url:session.url});
       }
       catch(err){
              res.status(500).json({result:'fail',message:'Something went wrong'});
       }
};
const Product = require('../Models/ProductModel');
const APIFeatures = require('../Utils/APIFeatures');


exports.GetAllProducts = async (req,res,next) => {

    try{
        //Executing Query
        const QueryObj = new APIFeatures(Product.find(),req.query).Filtering()
                                                                  .Sorting()
                                                                  .Fields()
                                                                  .Paging();


        let CurrQuery = QueryObj.Query;
        
        
        //basic - product insensitive name search
        if(req.query.name) {
            const name = new RegExp(req.query.name, 'i');
            CurrQuery = CurrQuery.find({name:name});
        }                                                          

        const AllProducts = await CurrQuery;

        //counting total number of results
        const count = AllProducts.length;

        //response
        res.status(200).json({result:'pass',count ,AllProducts});

    }
    catch(err){
        //error response
        res.status(500).json({result:'fail',err});
    }
}

exports.CreateNewProduct = async (req,res,next) =>{

    try{
        //destructuring req.body
        const {name,price,description,pictures,quantity} = req.body;
        
        //creating new Product instance 
        const NewProduct = new Product({name,price,description,pictures,quantity});

        //for temp purpose
        NewProduct.totalReviews = req.body.totalReviews;
        NewProduct.avgRating = req.body.avgRating;
        NewProduct.totalRating = req.body.totalRating;


        await NewProduct.save();

        //removing some sensitive fields
        NewProduct.__v = undefined;
        NewProduct.createdAt = undefined;
        NewProduct.updatedAt = undefined;

        //response
        res.status(201).json({result:'pass',NewProduct});
    }
    catch(err){
        //error response
        res.status(400).json({result:'fail',err});
    }
}

exports.GetOneProduct = async (req,res,next) =>{

    try{
        // finding by id and deselecting some fields 
        const id = req.params.id;
        //fetching product
        const product = await Product.findById(id).select("-__v -createdAt -updatedAt");
        //if no product is found
        if(!product) return res.status(404).json({result:'fail',err:'product not found'});
        //response
        res.status(200).json({result:'pass',product});
    }
    catch(err){
        //error response
        res.status(400).json({result:'fail',err});
    }
}

exports.UpdateProduct = async (req,res,next) => {

    try{
        //finding by id
        const id = req.params.id;
        const {name,price,description,pictures,quantity} = req.body;
        const product = await Product.findById(id).select("-__v -createdAt -updatedAt");

        //if product is not present
        if(!product) return res.status(400).json({result:'fail',err:'product not found'});

        //updating specific fields for security
            if(name) product.name = name;
            if(price) product.price = price;
            if(description) product.description = description;
            if(quantity) product.quantity = quantity;
            if(pictures) product.pictures = [...pictures];

            await product.save();
        //response
        res.status(200).json({result:'pass',product});

    }
    catch(err){
        //error response
        res.status(400).json({result:'fail',err});
    }
}

exports.DeleteProduct = async (req,res,next) =>{

    try{

        const id = req.params.id;
        const DeletedProduct = await Product.findByIdAndDelete(id).select('_id');
        //if product is not found
        if(!DeletedProduct) return res.status(404).json({result:'fail',err:'Product is not found'});
        //response
        res.status(200).json({result:'pass',DeletedProduct});
          
    }
    catch(err){
        //error response
        res.status(400).json({result:'fail'});
    }
}
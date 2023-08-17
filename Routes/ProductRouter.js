const express = require('express');
const {GetAllProducts,CreateNewProduct,GetOneProduct,UpdateProduct,DeleteProduct} = require('../Controllers/ProductController.js');
const { AuthCheck, RoleCheck } = require('../Controllers/AuthController.js');

const ProductRouter = express.Router();

ProductRouter.route("/").get(GetAllProducts)
                        .post(AuthCheck,RoleCheck('admin'),CreateNewProduct);

ProductRouter.route("/:id").get(GetOneProduct)
                            .patch(AuthCheck,RoleCheck('admin'),UpdateProduct)
                            .delete(AuthCheck,RoleCheck('admin'),DeleteProduct);
                           
                            
module.exports = ProductRouter;                            
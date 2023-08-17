const express = require('express');
const {GetAllUsers,CreateNewUser,GetOneUser,UpdateUser,DeleteUser, UpdateMe, DeleteMyAccount, LogOut, checkcache,MyDetails } = require('../Controllers/UserController.js');
const { SignUp, Login, AuthCheck, RoleCheck, ForgotPassword, ResetPassword, ChangePassword } = require('../Controllers/AuthController.js');

const UserRouter = express.Router();

//special routes for user purpose
UserRouter.route('/My-Details').get(AuthCheck,MyDetails);
UserRouter.route('/Sign-up').post(SignUp);
UserRouter.route('/Log-in').post(Login);
UserRouter.route('/Forgot-Password').post(ForgotPassword);
UserRouter.route('/Reset-Password/:token').patch(ResetPassword);
UserRouter.route('/Change-Password').patch(AuthCheck,ChangePassword);
UserRouter.route('/Update-Me').patch(AuthCheck,UpdateMe);
UserRouter.route('/Delete-MyAccount').delete(AuthCheck,DeleteMyAccount);
UserRouter.route('/Log-out').post(AuthCheck,LogOut);


//CRUD routes for admin
UserRouter.route('/').get(AuthCheck,RoleCheck('admin'),GetAllUsers) 
                     .post(AuthCheck,RoleCheck('admin'),CreateNewUser);
                     
UserRouter.route('/:id').get(AuthCheck,RoleCheck('admin'),GetOneUser)
                        .patch(AuthCheck,RoleCheck('admin'),UpdateUser)
                        .delete(AuthCheck,RoleCheck('admin'),DeleteUser);

UserRouter.route('/:id/testing').get(checkcache);                        

module.exports = UserRouter;

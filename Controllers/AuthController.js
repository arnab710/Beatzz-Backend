const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../Models/UserModel');
const { CheckPasswordChangedTime, VerifyToken, CreatePasswordResetToken, EmailSender, jwtCookieSetter } = require('../Utils/AuthHelperFunctions');
const { client } = require('../RedisConnection');

//Sign up controller
exports.SignUp = async (req,res,next) =>{

    try{

    //checking if the user is already logged-in
    if(req.cookies.jwt) return res.status(403).json({result:'fail',message:'You are already logged in'});
    
    //destructuring the req.body
    const {name,email,password,confirmpassword} = req.body;

    //checking password and confirmpassword
    if(password!==confirmpassword) return res.status(401).json({result:'fail',err:'Your Password and confirmpassword do not match'});

    //creating a new user in mongoose instances and saving it.
    let NewUser = new User({name,email,password});
    await NewUser.save();

    //JWT token generation
    const token = jwt.sign({id:NewUser._id},process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRE
    })

    //after the save I can manipulate NewUser to delete sensitive data
    const DeletedData =  ['__v', 'password', 'role','passwordChangedAt','passwordResetToken','passwordResetExpires','active'];
    DeletedData.forEach((val) => NewUser[val] = undefined);

    //response
    //setting up cookie for JWT tokens
    const setJWTCookie = jwtCookieSetter(token); // returns a function
    //execute the return function to set a cookie
    setJWTCookie(res);

    res.status(201).json({result:'pass', NewUser}); 
    }
    catch(err){
        
        if (err.name === 'ValidationError') {
            // Check for errors in the 'errors' property of the err object
            for (let field in err.errors) {
                // Send the first validation error's message and break
                return res.status(400).json({result: 'fail', message: err.errors[field].message});
            }
        }
        if(err.code===11000)   return res.status(400).json({result:'fail',message:`This ${err.keyValue.email && "email"} already exists`});
        return res.status(500).json({result:'fail',message:'Something went wrong'});
    }
};

//Login controller
exports.Login = async (req,res,next) => {

    try{
        if(req.cookies.jwt) return res.status(403).json({result:'fail',err:'You are already logged in'});
        //destructuring the req.body
        const {email,password} = req.body;

        //checking if email and password exist
        if(!email || !password) return res.status(400).json({result:'fail',err:'please provide required details'});
        
        //finding the user and validating
        let user = await User.findOne({email}).select('+password +active'); 
        if(!user) return res.status(401).json({result:'fail',err:'Incorrect email or password'});

        //validating password
        const EncryptedPassword = user.password;
        const matched = await bcrypt.compare(password,EncryptedPassword);
        if(!matched) return res.status(401).json({result:'fail',err:'incorrect email or password'});

        //Setting active = true -- if user previous deactivated it's account
        if(user.active===false){

                user.active = true;
                //saving the user in DB
                await user.save({validateBeforeSave:false}); //**no validation is required for password not to go through pre-save() middleware for further encryption..
        } 

        //at end, JWT token generation
        const token = jwt.sign({id:user._id},process.env.JWT_SECRET,{
            expiresIn: process.env.JWT_EXPIRE
        })

        //after the save I can manipulate NewUser to delete sensitive data
        const DeletedData =  ['__v', 'password', 'role','passwordChangedAt','passwordResetToken','passwordResetExpires','active'];
        DeletedData.forEach((val) => user[val] = undefined);
        
        //respone
        //setting up cookie for JWT tokens
        const setJWTCookie = jwtCookieSetter(token); // returns a function
        //execute the return function to set a cookie
        setJWTCookie(res);
        res.status(200).json({result:'pass',message:'User logged-in successfully',user});
    }
    catch(err){
        //error response
        res.status(500).json({result:'fail',err});
    }
};

//Authentication Controller 
exports.AuthCheck = async (req,res,next) =>{

    try{

        //checking if the JWT token exist
        let token;
        //checking in Cookies
        if(req.cookies.jwt) token = req.cookies.jwt;

        //checking in headers also
        else if(req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
            token = req.headers.authorization.split(' ')[1];
        }

        //if no token
        if(!token) return res.status(200).json({result:'fail',err:'Please log in again'});
        
        //verifying token
        const user = await VerifyToken(token);  
        
        let verifiedUser;
        try{
            //checking if from redis client , the user info is found  --cache hit
            verifiedUser = await client.get(`user:${user.id}`);
            verifiedUser = JSON.parse(verifiedUser);
            
            //transforming passwordChangedAt into date object
            if(verifiedUser){
                if(verifiedUser.passwordChangedAt) 
                verifiedUser.passwordChangedAt = new Date(verifiedUser.passwordChangedAt); //by only parsing ,date can't be reconverted
                verifiedUser.passwordChangedAt = null;
            }}
        catch(err){
            if(process.env.NODE_ENV==='development') console.error(err);
        }

       //if not found , then fallback method and setting the client -- cache miss
       if(!verifiedUser){

            //checking if the user exist in DB
            verifiedUser = await User.findById(user.id).select('+role +passwordChangedAt');
            if(!verifiedUser) return res.status(401).json({result:'fail',err:'Some error occurred .Please login again'});
            
            try{
                //setting the client for caching 
                await client.setEx(`user:${user.id}`,60*60*2,JSON.stringify(verifiedUser));
            }
            catch(err){
                if(process.env.NODE_ENV==='development') console.error(err);
            }
    }
        
        //checking if the password changed after jwt token issued
        const CheckPasswordChangedAfterTokenIssued = CheckPasswordChangedTime(verifiedUser.passwordChangedAt,user.iat); 
        
        if(CheckPasswordChangedAfterTokenIssued) return res.status(403).json({result:'fail',err:'Password was changed'});

        //if everything ok, adding a new user field to req for further use
        req.user = verifiedUser;

        //calling next middleware
        next();
    }
    catch(err){
        //error response
        res.status(403).json({result:'fail',error:'some error occurred please log in again'});
    }
}

//checking Role controller
exports.RoleCheck = (...Roles) =>{
    //it returns a middleware function
    return (req,res,next) =>{
        
        if(Roles.includes(req.user.role)) return next();
        return res.status(403).json({result:'fail',err:'You do not have the permission to perform this action'});
    }
};

//forgot Password controller
exports.ForgotPassword = async (req,res,next) =>{
    try{
        const {email} = req.body;
        //checking for valid email provided 
        const user = await User.findOne({email});
        if(!user) return res.status(404).json({result:'fail',err:'This email is not registered'});

        //creating a random token for password reset
        const ResetToken =  CreatePasswordResetToken(user);
        //saving the passwordResetToken and passwordResetExpires to DB
        await user.save();

        //sending email
        const url = `${req.protocol}://${req.get('host')}/${process.env.API}/users/Reset-Password/${ResetToken}`;
        
        await EmailSender(email,url);
        return res.status(200).json({result:'pass',message:'Reset email sent Successfully'})
    }
    catch(err){
        res.status(500).json({result:'fail',message:'Reset email could not be sent'});
    }
}

exports.ResetPassword = async (req,res,next) =>{

    try{
        const token = req.params.token;
        //hashing the token again to create the same hashed resetToken which was saved in DB
        const Hashtoken = crypto.createHash('sha256').update(token).digest('hex');
        
        //finding the user based on the hashtoken and resetpasswordtime
        const user = await User.findOne({passwordResetToken:Hashtoken,passwordResetExpires:{$gte:Date.now()}});
        if(!user) return res.status(400).json({result:'fail',err:'Invalid token or token expired'});

        const {password,confirmpassword} = req.body;
        
        //checking password and confirmpassword
        if(password!==confirmpassword) return res.status(401).json({result:'fail',err:'Your Password and confirmpassword do not match'});
        
        //setting a new password   
        user.password = req.body.password;  

        //setting null to these two fields
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        //change passwordChangedAt to (now - 1)s --handled in presave middleware

        //saving user to DB
        await user.save();

        //creating a JWT token
        const JWTtoken = jwt.sign({id:user._id},process.env.JWT_SECRET,{
            expiresIn:process.env.JWT_EXPIRE
        });
        //setting JWT token in Cookies
        const setJWTCookie = jwtCookieSetter(JWTtoken); // returns a function
        //execute the return function to set a cookie
        setJWTCookie(res);
        res.status(200).json({result:'pass',message:'Password Reset Successful'});
    }
    catch(err){
        res.status(500).json({result:'fail',err});
    }

}

exports.ChangePassword = async (req,res,next) =>{
    
    try{
        //checking newpassword with confirm 
        const {previousPassword,newPassword,confirmNewPassword} = req.body;
        if(!previousPassword || !newPassword || !confirmNewPassword) return res.status(400).json({result:'fail',err:'Please provide all the details'});
        if(newPassword!==confirmNewPassword) return res.status(400).json({result:'fail',err:'your password and confirmpassword do not match'});

        //fetching the user's encrypted password form the DB
        const user = await User.findById(req.user._id).select('+password');
        
        //checking DB password with previous Password
        const matched = await bcrypt.compare(previousPassword,user.password);
        if(!matched) return res.status(400).json({result:'fail',err:'previous password is incorrect'})
        //setting new password
        user.password = newPassword;
        //changing passwordChangedAt handled in PreSave middleware
        //Saving the user
        await user.save();

        //after the save I can manipulate NewUser to delete sensitive data
        const DeletedData =  ['__v', 'password', 'role','passwordChangedAt','passwordResetToken','passwordResetExpires'];
        DeletedData.forEach((val) => user[val] = undefined);

        //creating a new Token
        const JWTtoken = jwt.sign({id:user._id},process.env.JWT_SECRET,{
            expiresIn:process.env.JWT_EXPIRE
        });
        //response
        const setJWTCookie = jwtCookieSetter(JWTtoken); // returns a function
        //execute the return function to set a cookie
        setJWTCookie(res);

        res.status(200).json({result:'pass',user});
    }
    catch(err){
        res.status(500).json({result:'fail',err});
    }
}

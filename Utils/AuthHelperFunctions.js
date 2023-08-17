const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const SGmail = require('@sendgrid/mail');

//used inside AuthCheck
exports.VerifyToken = (token) =>{

    //verifying the token and returning the result (initially a promise)
    return new Promise((resolve,reject)=>{
        jwt.verify(token,process.env.JWT_SECRET,(error,data)=>{

            if(error) return reject(error);
            return resolve(data);
        })
    })
}
//used inside AuthCheck
exports.CheckPasswordChangedTime = (changedTime,tokenTime) =>{

    //checking if the passwordChangedAt exist
    if(changedTime){
        //getting and transforming passwordChangedAt time to second for comparing it with iat 
        const passwordTime = changedTime.getTime()/1000;

        //checking if token issued later
        if(passwordTime<tokenTime) return false;
        else return true; 
    }
    
    return false; // this means password didn't changed after token was issued
}

//generating random token for reset password
exports.CreatePasswordResetToken = function(user){

    const ResetToken = crypto.randomBytes(32).toString('hex');
    
    user.passwordResetToken = crypto.createHash('sha256').update(ResetToken).digest('hex');
    //setting a time for after 5 mins
    user.passwordResetExpires = Date.now() + 5 * 60 * 1000;

    return ResetToken;
}

exports.EmailSender = async (UserEmail,url) =>{

    SGmail.setApiKey(process.env.SENDGRID_API);

    const message = {
        to: UserEmail,
        from:{
            name: 'PhoneOps',
            email: 'phoneops723@gmail.com'
        },
        subject : 'Reset Password Link (valid for 5 min)',
        text: `Click the link to reset your password. This is only valid for 5 minutes.\n Link:${url}`
    }
     
   return await SGmail.send(message);
}

exports.jwtCookieSetter = (token) =>{
    
    return (res) =>{
        console.log(token);
        res.cookie('jwt',token,{

            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
            httpOnly:true,
        })
    }
}
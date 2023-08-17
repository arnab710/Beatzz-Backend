const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    
    name:{
        type:String,
        required:[true,'Enter your Name']
    },
    email:{
        type:String,
        required:[true,'Please enter your email'],
        unique:true,
        trim:true,
        lowercase:true,
        validate:{
            validator:function(val){
                return validator.isEmail(val);
            },
            message:'Please provide a valid email'
        }
    },
    password:{
        type:String,
        required:[true,'please enter your password'],
        minlength: [8, 'Password must be at least 8 characters long'],
       maxlength: [16 , 'Password must be at most 16 characters long'],
        validate: {
          validator: function(val) {
            // At least one uppercase letter, one lowercase letter, one digit and one special character
            return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(val);
          },
          message: 'Password should have at least one uppercase letter, one lowercase letter, one digit, and one special character'
        },
        select:false
    },
    role:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
        select: false
    },
    passwordChangedAt:{
        type:Date,
        select:false
    },
    passwordResetToken:{
        type:String,
        select:false
    },
    passwordResetExpires:{
        type:Date,
        select:false
    },
    active:{
        type:Boolean,
        default:true,
        select:false
    }
});


//presave middleware for hashing password 
UserSchema.pre('save',async function(next){

    //cehcking if password is created or recently modified
    if(!this.isModified('password'))  return next();

    //encrypting
    this.password = await bcrypt.hash(this.password,12);
    next();
});

//for creating a field for passwordChangedAt
UserSchema.pre('save',function(next){

    //checking if password is modified or new data entried for the first time
    if(!this.isModified('password') || this.isNew) return next();

    //for real life purpose , saving it 1s earlier 
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

const User = mongoose.model('User',UserSchema);

module.exports = User;
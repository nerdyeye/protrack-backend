import userModel from "../../../infrastructure/database/models/User.mjs";
import jsonwebtoken from "jsonwebtoken";
const { sign, verify } = jsonwebtoken

import { compare, hash } from "bcrypt";
import config from "../../../config/defaults.mjs";
import { passwordReset } from "../../../infrastructure/libs/mailer.mjs";
import { signInValidation, forgotPasswordValidation } from "../validations/userValidation.mjs";
// import { generatePassword } from "../utils/passwordGenerator";

export const login = async (req, res)=>{
    try{
        const {email, password} = req.body;
        const {error} = signInValidation(req.body);
        if(error){
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            });
        }

        //check if user is registered
        const user = await userModel.findOne({
            email: email
        });

        if(!user) throw new Error ('Your email or password is incorrect');

        if(user.isDeleted == true) 
        throw new Error ('Your account has been suspended.')

        // Verify user's password
        const validPass = await compare(password, user.password);
        if(!validPass) throw new Error('Your email or password in incorrect');

        // generate jwt token
        const token = sign({
            _id: user._id,
            fullName: user.full_name,
            email: user.email,
            subscription: user.subscription,
            isDeleted: user.isDeleted
        }, config.userSecret);

        res.status(200)
        // .header('auth-token', token)
        .json({
            success : true,
            msg: 'successfully logged in',
            data : {token, user},
        })


    }catch(error){
        if (error instanceof Error) {
            res
              .status(500)
              .json({ success: false, msg: `${error.message}` });
          }
    }
    
}

export const verifyToken = async (req, res)=>{
    try{
        const userId = req.params.id;
        const token = req.params.token;

        const user = await userModel.findOne({
            _id : userId,
            isDeleted : false
        },
        {password : 0}
        );

        if(!user) throw new Error(`User with this Id not found`);

        const secret = config.userEmailSecret;
        const payload = verify(token, `${secret}`);
        if (!payload) throw new Error('Invalid Token');

        user.isVerified = true;

        await user.save();

        res.status(200).json({
            success: true,
            msg: `Email Verification Successful`,
            data: user,
        });
    }catch(error){
        if (error instanceof Error) {
            res
              .status(500)
              .json({ success: false, msg: `${error.message}` });
          }
    }
    

}

export const  sendPasswordLink = async (req, res)=>{
    try{
        const email = req.body;

        const user = await userModel.findOne(email,{password : 0});
        if(!user) throw new Error(`User not found!`);

        // creating a reset token
        const secret = config.userReset + user.password;
        const payload = {
            email : user.email,
            id: user._id,
        };
        const token = sign(payload, secret, {expiresIn: "10m"});

        // creating a reset link
        const link = `http://localhost:3000/api/v1/auth/user/reset/${user._id}/${token}`;

        // send mail
            await passwordReset(user.email, user.full_name, link );
            delete user._doc.password;

            res.status(200).json({
                success : true,
                msg: "Password reset link sent",
                token: token,
                user : user
            })
          
    }catch(error){
        throw error;
    }


}

export const resetUserPassword = async (req, res)=>{
    try{
        const {newPassword, confirmPassword} = req.body;
        const userId = req.params.id;
        const token = req.params.token;

        // Schema Validation
        const {error} = await forgotPasswordValidation({
            newPassword,
            confirmPassword
        });
        if(error) throw new Error(`${error.details[0].message}`);

        // check for existing user
        const user = await userModel.findOne({_id: userId}, {password : 0});
        if(!user) throw new Error(`User not fouund.`);

        // verifying reset token
        const secret = config.userReset + user.password;
        const payload = verify(token, secret);
        if(!payload) throw new Error(`Invalid Token`);

        // check if newPassword and confirmPassword match
        if(newPassword !== confirmPassword) throw new Error(`Password mismatch!`);
        
        // hashing newPassword and changing the password to the new Password
        const hashPassword = await hash(newPassword, 12);
        user.password = hashPassword;
        await user.save();
        delete user._doc.password;
          res.status(200).json({
                success : true,
                msg: `Reset Password Successful`,
                data: user
                
          })
    }catch(error){
        if (error instanceof Error) {
            res
              .status(500)
              .json({ success: false, msg: `${error.message}` });
          } 
    }
    
}


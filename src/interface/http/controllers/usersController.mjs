import userModel from "../../../infrastructure/database/models/User.mjs";
import { hash, compare } from "bcrypt";
import config from "../../../config/defaults.mjs";
import { createUserSchema, changePasswordSchema } from "../validations/userValidation.mjs";
import { sendWelcomeMail } from "../../../infrastructure/libs/mailer.mjs";
import {uploads} from "../../../infrastructure/libs/cloudinary.mjs";
import jsonwebtoken from "jsonwebtoken";
import {unlinkSync} from 'fs'
import { StatusCodes } from "http-status-codes";
import path from "path";
const { sign, verify } = jsonwebtoken

export const signupUser = async (req, res)=>{
        try{
            // validating inputs
            const {error} = createUserSchema(req.body);
            if(error){
                return res.status(400).json({
                    success : false,
                    message : error.details[0].message
                });
            }
            // Receiving user inputs
            let {
                full_name,
                phoneNumber: {phoneNo, countryCode},
                email,
                password,
                confirmpassword
                } = req.body;

                // check if user exist
                let isUser = await userModel.findOne({email :email});
                if(isUser) return res.status(401).json({
                    success : false,
                    msg : `Email already exist`
                });

                // hash Password
                password = await hash(password, 12);

                let user = await userModel.create({
                    full_name,
                    phoneNumber: {phoneNo, countryCode},
                    email,
                    password,
                });
                
                // creating an email verification token
                const secret = config.userEmailSecret;
                const token = sign({email: user.email}, `${secret}`, {
                    expiresIn: "1d"
                });

                // creating an eamil verificationlink
                const link = `http://localhost:3000/protrack.com/api/v1/auth/verify/${user._id}/${token}`;
                console.log(link)
                try{
                   await sendWelcomeMail(email, full_name, link);
                }catch(error){
                    throw new Error(`Email not sent`)
                }
                  

            await user.save();
            delete user._doc.password;
            return res.status(201).json({
                success : true,
                msg: 'User created successfully. Message',
                data: user,
            });
        }catch(error){
            if (error instanceof Error) {
                res
                  .status(500)
                  .json({ success: false, msg: `${error}` });
              }
    }   
}

// changePassword
export const changePassword = async (req, res)=> {
    try{
        // validating inputs
        const {error} = changePasswordSchema(req.body);
        if(error){
            return res.status(400).json({
                success : false,
                message : error.details[0].message
            });
        }
        const userId = req.user._id;
        let {oldPassword, newPassword} = req.body;

        const user = await userModel.findOne({
                _id : userId,
                isDeleted : false,
            },
            {password : 0}
            );

            if(!user) return res.status(400).json({
                success : false,
                msg : `User not found!`
            });
    
            // compare oldpassword
            let verifyPassword = await compare(oldPassword, user.password);
            if(!verifyPassword) return res.status(400).json({
                success : false,
                msg : `Password is incorrect`
            });

            // setting the new Password
            user.password = await hash(newPassword, 12);

            await user.save();
            res.status(200).json({
                success: true,
                msg: `Password updated successfully!`,
              });
    }catch(error){
        if (error instanceof Error) {
            res.status(500)
              .json({ success: false, msg: `${error}` });
          }
        }
}

// Upload profile image
export const avatar = async (req, res)=>{
    try{
        const userId = req.params.id;
        const payload = req.file;
        const uploader = async (path)=>await uploads(path, 'protrack-user-avatar');

        const url = [];
        const file = payload;

        const { path } = file;
        const newPath = await uploader(path);

        url.push(newPath.url);
        unlinkSync(path);

        const user = await userModel.findOne({_id: userId});
        user.avatar = url.toString();
        await user.save();

        console.log('saved')


    }catch(error){
        if( error instanceof Error){
            console.log(error.stack)
            res.status(500).json({
                success : false,
                msg: error.stack
            })
        }
    }
}

// UPDATE USER PROFILE
// exports.update = async (req, res) =>{
//     try{
//         const userId = req.params.userId;
//         const payload = req.body;
//         const query= {_id : userId}
//         try{
//             const {error} = createUserSchema(payload);
//                 if(error){
//                     return res.status(400).json({
//                         success : false,
//                         message : error.details[0].message
//                     });
//                 }
//             const verifyUser = await userModel.findByIdAndUpdate(query,payload,{new : true});
//             if(!verifyUser) throw Error ('You cant perform this operation');

//             res.status(HTTP_STATUS.StatusCodes.ACCEPTED).json({
//                 success : true,
//                 msg : 'User data updated successfully',
//                 data : verifyUser
//             });
            


//         }catch(error){
//             throw error;
//         }
//     }catch(error){
//         if(error instanceof Error){
            
//         }
//     }
// }

// soft delete User
// export async function softDelete(req, res){

// }

// // permanet delete
// export async function permanentDelete(req, res){

// }

// View trash
// export async function Trash(req, res){
    
// }
import teamModel from "../../../infrastructure/database/models/teamTask.mjs";
import individualModel from "../../../infrastructure/database/models/individualTask.mjs";
import departmentModel from "../../../infrastructure/database/models/departmentTask.mjs";
import userModel from "../../../infrastructure/database/models/User.mjs";
import { createTaskSchema, edit } from "../validations/taskValidation.mjs";
import { StatusCodes } from 'http-status-codes';
import moment from 'moment';



// Create Task
export const createIndividualTask = async (req, res)=>{
    try {
        const {title,description,department,status,time_frame,start_date} = req.body;
        const created_By = req.user._id;
        // Joi Task Schema Validation 
        const {error} = createTaskSchema(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.details[0].message
            });
        }
        try{
            // create individual task in the database
            const individualTask = await individualModel.create({
                title,
                description,
                department,
                status,
                time_frame,
                start_date,
                created_By
            });
             res.status(201).json({
                success : true,
                msg: `Task created successfully.`,
                data: individualTask,
            });
        }catch(error){
            throw error;
        }
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({
                    success: false,
                    msg: `${error}`
                });
        }
    }
}

// Create team task
export const createTeamTask = async(req, res)=>{
    const {title,description,department,status,time_frame,start_date} = req.body;

    try{
        // Joi Task Schema Validation 
        const {error} = createTaskSchema(req.body);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.details[0].message
            });
        }
        // creat
        const task = await teamModel.create({
            title,
            description,
            department,
            status,
            time_frame,
            start_date,
            created_By : req.user._id
        });
        await task.members.push({memberId : req.user._id, role: 'admin'});
        await task.save()
            res.status(201).json({
            success : true,
            msg: ` Team task created successfully`,
            data: task,
        });
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error}`
            });
        }
    } 
}

// Create department Task
export const departmentTask = async (req, res)=>{
    const {title,description,department,status,time_frame,start_date} = req.body;

    try{
        const task = await departmentModel.create({
            title,
            description,
            department,
            status,
            time_frame,
            start_date,
            created_By : req.user._id
        });

        await task.members.push({memberId : req.user._id, role : "admin"});
        await task.save()
            res.status(201).json({
            success : true,
            msg: ` Department task created successfully`,
            data: task,
        });
        
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error}`
            });
        }
    }
}

// Update individual Task status
export const updateIndividualTask = async (req, res)=>{
    try{
        const creatorId = req.user._id;
        const individualTaskId = req.params.id;
        let payload = req.body;
        const { error} = edit(payload);
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            });
        }
        const editTask = await individualModel.findById({_id : individualTaskId});
        if(!editTask) throw new Error (`Task not found!`);

        const taskAdmin =  await individualModel.findOneAndUpdate({created_By : creatorId},payload, {new : true});
        if (!taskAdmin) throw new Error('Admin with this ID does not exist');

        await taskAdmin.save();
        res.status(201).json({
            success : true,
            msg: ` Individual tasks edited successfully`,
            data: taskAdmin,
        });


    }catch(error){
        if(error instanceof Error){
            res
                .status(500)
                .json({
                    success: false,
                    msg: `${error}`
                });
            }
    }
}

// Update team Task status
export const updateTeamTask = async (req, res)=>{
    try{
        const teamTaskId = req.params.id;
        const payload = req.body;
        // Joi Task Schema Validation 
        const {error} = createTaskSchema(payload);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.details[0].message
            });
        }
        try{
            // verify task
            const verifyTask = await teamModel.findById(teamTaskId);
            if(!verifyTask) throw Error ('Task not found!');

            // checking for the role of the current user
            const currentUser = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!currentUser) throw Error ('You are not a member or an admin');

            // authorize admins this operation
            if(currentUser.role !== 'admin') throw Error ('you are not authorized');

            const updatedTask = await teamModel.findOneAndUpdate({_id : teamTaskId},payload,{new: true});

            res.status(StatusCodes.ACCEPTED).json({
                success : true,
                msg : 'Task updated successfully',
                data : updatedTask
            });
            
        }catch(error){
            throw error;
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500)
                .json({
                    success: false,
                    msg: `${error}`
                });
            }
    }
}
// Update department Task status
export const updatedepartmentTask = async (req, res)=>{
    try{
        const teamTaskId = req.params.id;
        const payload = req.body;

        // Joi Task Schema Validation 
        const {error} = createTaskSchema(payload);
        if (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.details[0].message
            });
        }
        try{
            // verify task
            const verifyTask = await departmentModel.findById(teamTaskId);
            if(!verifyTask) throw Error ('Task not found!');

            // checking for the role of the current user
            const currentUser = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!currentUser) throw Error ('You are not a member or an admin');


            // authorize admins this operation
            if(currentUser.role !== 'admin') throw Error ('you are not authorized');

            const updatedTask = await departmentModel.findOneAndUpdate({_id : teamTaskId},payload,{new: true});

            res.status(StatusCodes.ACCEPTED).json({
                success : true,
                msg : 'Task updated successfully',
                data : updatedTask
            })
            
        }catch(error){
            throw error;
        }
        
        

       

    }catch(error){
        if(error instanceof Error){
            res
                .status(500)
                .json({
                    success: false,
                    msg: `${error}`
                });
            }
    }
}

// Add TeamMembers
export const addTeamMember = async(req, res, next)=>{
    try{
        const userId = req.params.id;
        const taskId = req.params.taskId;
        try{
            // verifying params values
            const verifyUser = await userModel.findById(userId);
            if(!verifyUser) throw Error ('User not found!');
            const verifyTask = await teamModel.findById(taskId);
            if(!verifyTask) throw Error ('Task not found');

            const ObjectToFind = userId;
            const isObjectPresent= verifyTask.members.find((member) => member.memberId === ObjectToFind);
            const currentUser = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!currentUser) throw Error ('You are not a member or an admin');

            // Authorizing admins to perform this operation
            if(currentUser.role !=='admin') 
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success : false,
                    msg : 'You are not authorized!'
                });
            if(!isObjectPresent && verifyTask.members.length < 7){
                await verifyTask.updateOne({$push : {members : {memberId: userId, role : 'member'}}});
                    res.status(StatusCodes.OK).json({
                        success : true,
                        msg: 'New user added',
                        data : verifyTask
                    });
            }else if(verifyTask.members.length >= 7){
                    throw Error ('Team limit reached');
                }else{
                    res.status(StatusCodes.OK).json({
                        success : true,
                        msg : `${verifyUser.email} is already a member`
                    });
                }
        }catch(error){
            throw error;
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                    success: false,
                    msg: `${error}`
                });
            }
    }
}
// Add department Members
export const addDepartmentMember = async (req, res)=>{
    try{
        const userId = req.params.id;
        const taskId = req.params.taskId;
        try{
            // verifying params values
            const verifyUser = await userModel.findById(userId);
            if(!verifyUser) throw Error ('User not found!');
            const verifyTask = await departmentModel.findById(taskId);
            if(!verifyTask) throw Error ('Task not found');

            const ObjectToFind = userId;
            const isObjectPresent= verifyTask.members.find((member) => member.memberId === ObjectToFind);
            const currentUser = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!currentUser) throw Error ('You are nnot a member of this group or an admin')
            // Authorizing admins to perform this operation
            if(currentUser.role !=='admin') 
                return res.status(StatusCodes.UNAUTHORIZED).json({
                    success : false,
                    msg : 'You are not authorized!'
                });
            if(!isObjectPresent && verifyTask.members.length < 15){
                await verifyTask.updateOne({$push : {members : {memberId: userId, role : 'member'}}});
                    res.status(StatusCodes.OK).json({
                        success : true,
                        msg: 'New user added',
                        data : verifyTask
                    });
            }else if(verifyTask.members.length >= 15){
                    throw Error ('Team limit reached');
                }else{
                    res.status(StatusCodes.OK).json({
                        success : true,
                        msg : `${verifyUser.email} is already a member`
                    });
                }
        }catch(error){
            throw error;
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                    success: false,
                    msg: `${error}`
                });
            }
    }
}

// Remove a Team Member
export const removeTeamMember = async(req, res)=>{
    try{
        const memberId = req.params.id;
        const taskId = req.params.taskId;

        try{
            // verify member & task IDs
            const verifyMember = await userModel.findById(memberId);
            if(!verifyMember) throw Error('User not found!');
            const verifyTask = await teamModel.findById(taskId);
            if(!verifyTask) throw Error ('Task not found!');

            // Checking current user role.
            const isObjectPresent = verifyTask.members.find((member) => member.memberId === memberId);
            if(!isObjectPresent) throw Error (`${verifyMember.email}, is not a member`);
            const currentUser = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!currentUser) throw Error ('You are not a member or an admin');

            if(currentUser.role !== 'admin') throw Error('You are not authorize!')

            await verifyTask.updateOne({$pull : {members : {memberId : memberId }}});

            res.status(StatusCodes.OK).json({
                success : true,
                totalNo : verifyTask.members.length,
                msg : 'User removed successfully',
                data : verifyTask
            })

        }catch(error){
            throw error;
        }

    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error}`
            });
        }
    }
}

// Remove a Department Member
export const removeDepartmentMember = async (req, res)=>{
    try{
        const memberId = req.params.id;
        const taskId = req.params.taskId;

        try{
            // verify member & task IDs
            const verifyMember = await userModel.findById(memberId);
            if(!verifyMember) throw Error('User not found!');
            const verifyTask = await departmentModel.findById(taskId);
            if(!verifyTask) throw Error ('Task not found!');

            // Checking current user role.
            const isObjectPresent = verifyTask.members.find((member) => member.memberId === memberId);
            if(!isObjectPresent) throw Error (`User is not a member`);
            const currentUser = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!currentUser) throw Error ('You are not a member or an admin');

            if(currentUser.role !== 'admin') throw Error('You are not authorize!');

            await verifyTask.updateOne({$pull : {members : {memberId : memberId }}});

            res.status(StatusCodes.OK).json({
                success : true,
                totalNo : verifyTask.members.length,
                msg : 'User removed successfully',
                data : verifyTask
            });

        }catch(error){
            throw error;
        }

    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}

// Deleting a task
export const deleteIndividualTask = async (req, res)=>{
    try{
        const taskId = req.params.taskId;
        // console.log(taskId)
        try{
            const verifyTask = await individualModel.findByIdAndRemove({
                _id : taskId,
                created_By : req.user._id
            });
            if(!verifyTask){ 
                throw Error ('Task not found!')
            }else if(verifyTask.created_By !== req.user._id){
                throw Error( 'Access denied!')
            }
            res.status(200).json({
                success : true,
                msg : 'Task deleted successfully'
            })
        }catch(error){
            throw error
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
} 
// Deleting a team task
export const deleteTeamTask = async (req, res)=>{
    try{
        const taskId = req.params.taskId;
        // console.log(taskId)
        try{
            const verifyTask = await teamModel.findByIdAndRemove({
                _id : taskId,
                created_By : req.user._id
            });
            if(!verifyTask){ 
                throw Error ('Task not found!')
            }else if(verifyTask.created_By !== req.user._id){
                throw Error( 'Access denied!')
            }
            res.status(200).json({
                success : true,
                msg : 'Task deleted successfully'
            })
        }catch(error){
            throw error
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
} 
// Deleting a task
export const deleteDepartmentTask = async (req, res)=>{
    try{
        const taskId = req.params.taskId;
        // console.log(taskId)
        try{
            const verifyTask = await departmentModel.findByIdAndRemove({
                _id : taskId,
                created_By : req.user._id
            });
            if(!verifyTask){ 
                throw Error ('Task not found!')
            }else if(verifyTask.created_By !== req.user._id){
                throw Error( 'Access denied!')
            }
            res.status(200).json({
                success : true,
                msg : 'Task deleted successfully'
            })
        }catch(error){
            throw error
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
} 

// Fetch User Tasks
export const allUserTasks = async (req, res)=>{
    try{
        const query = {created_By: req.user._id}
        const tasks = await individualModel.find(query).sort({createdAt:1});
        if(!tasks || tasks.length === 0) res
            .status(StatusCodes.OK)
            .json({success: true, msg : 'No task found!'})

            res.status(StatusCodes.OK).json({
                success : 'true',
                taskTotal : tasks.length,
                msg : 'Data retrieved successfully',
                data : tasks
            })
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}
// Fetch specific User Tasks
export const singleUserTasks = async (req, res)=>{
    const taskId = req.params.taskId;
    const query = {_id : taskId}
    try{
        const verifyTask = await individualModel.findById(query)
        if(verifyTask.created_By !== req.user._id) throw Error('No task found');

        if(verifyTask.length === 0) res
            .status(StatusCodes.OK)
            .json({success: true, msg : 'No task found!'})

            res.status(StatusCodes.OK).json({
                success : 'true',
                msg : 'Data retrieved successfully',
                data : verifyTask
            })

    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}

// Fetch Team Task
export const allTeamTask = async (req, res)=>{
    try{
        const query = {created_By: req.user._id}
        const tasks = await teamModel.find(query).sort({createdAt:-1});
        if(!tasks || tasks.length === 0) throw Error ('No task available');
        res.status(StatusCodes.OK).json({
            success : true,
            totalNo : tasks.length,
            msg : 'Data retrived successfully!',
            data : tasks
        })
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}

// Get Specific Team Task
export const specificTeamTask = async (req, res)=>{
    try{
        const taskId = req.params.taskId;
        try{
            const verifyTask = await teamModel.findById(taskId);
            if(!verifyTask) throw Error ('No task found!');

            const ObjectToFind = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!ObjectToFind) throw Error ('You cant view this task');
            res.status(StatusCodes.OK).json({
                success : true,
                msg : ' Data retrieved successfully!',
                data :verifyTask
            })
        }catch(error){
            throw error
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}
// Fetch Department Task
export const allDepartmentTask = async (req, res)=>{
    try{
        const query = {created_By: req.user._id}
        const tasks = await departmentModel.find(query).sort({createdAt:-1});
        if(!tasks || tasks.length === 0) throw Error ('No task available');
        res.status(StatusCodes.OK).json({
            success : true,
            totalNo : tasks.length,
            msg : 'Data retrived successfully!',
            data : tasks
        })
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}

// Get Specific Department Task
export const specificDepartmentTask = async (req, res)=>{
    try{
        const taskId = req.params.taskId;
        try{
            const verifyTask = await departmentModel.findById(taskId);
            if(!verifyTask) throw Error ('No task found!');

            const ObjectToFind = verifyTask.members.find((member) => member.memberId === req.user._id);
            if(!ObjectToFind) throw Error ('You cant view this task');
            res.status(StatusCodes.OK).json({
                success : true,
                msg : ' Data retrieved successfully!',
                data :verifyTask
            })
        }catch(error){
            throw error
        }
    }catch(error){
        if(error instanceof Error){
            res.status(500).json({
                success: false,
                msg: `${error.message}`
            });
        }
    }
}
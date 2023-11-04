import Joi from "joi";

export const user = Joi.object({
    name: Joi.string().alphanum().min(3).max(32).required(),
    socketId: Joi.string().required()
})

export const userValidator = (req, res, next) => {
    const body = req.body
    const validation = user.validate(body)
    if(validation.error){
        res.status(400).json(validation.error)
    }else{
        next()
    }
}
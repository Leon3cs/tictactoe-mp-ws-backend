export const paramValidator = (req, res, next) => {
    const params = req.params

    if(Object.keys(params).length){
        next()
    }else{
        const err = new Error('Missing url parameters')
        next(err)
    }
}
class apiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
        stack = ""
    ){
        // whenever we have to change the method or variable of parent class
        // we call super with the argument as the value that need to be changed.
        super(message)
        this.statusCode = statusCode
        this.data = null
        // this.message = message
        this.success = false;
        this.errors = errors

        if(stack){
            this.stack = stack
        } else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {apiError}
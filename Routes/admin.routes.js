const express = require('express')
const { create, Signup, OTPforSignUp, Login, ResetPassword, updateVerify, getNews,deleteDocumentById } = require('../Controllers/admin.controller')
const multer = require('multer')
const { User } = require('../Models/admin.schema')
const UserRouter = express.Router()











const storage = multer.memoryStorage({
    destination: function (req, file, cb) {
        cb(null, '')
    }
})


// below variable is define to check the type of file which is uploaded

const filefilter = (req, file, cb) => {


    req.body.FileFormat = file.mimetype
    cb(null, true)

}

const upload = multer({ storage: storage, fileFilter: filefilter });


UserRouter.post('/Upload', upload.single('productimage'), create)

/** Send OTP for Verification */
UserRouter.post('/SendOTPforEmail', OTPforSignUp)

/** Signup Router */
UserRouter.post('/SignUp', Signup)

/*** Login Router */
UserRouter.post('/login', Login)


/** Sending OTP to Reset Password */
UserRouter.post('/OTPforResetPass', updateVerify)

/** To Reset Password */
UserRouter.post('/ResePassword', ResetPassword)


/** To Get All News */
UserRouter.get('/News',getNews)

/** To Delete Document  */
UserRouter.delete('/delete', deleteDocumentById)

module.exports = { UserRouter }

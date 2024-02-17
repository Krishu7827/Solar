
const Aws = require('aws-sdk')                // aws-sdk library will used to upload image to s3 bucket.
require('aws-sdk/lib/maintenance_mode_message').suppress = true;
const { News } = require('../Models/News.Schema')
const { User } = require('../Models/admin.schema')
const JWT = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
require('dotenv').config()


/*** Nodemailer-configuration */

let otp = {}
let verifyEmail;
let verifypassword;

let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.Email,
        pass: process.env.passKey
    },
    tls: {
        rejectUnauthorized: false,
    }
})

function generateOtp() {

    let OTP = Math.floor(Math.random() * (1000 - 1 + 1) + 7000)

    let onetime = OTP

    otp.OneTimePassword = onetime

    return OTP
}




const create = async (req, res) => {
    console.log(req.body)
    const { header, title, Description } = req.body
    const date = new Date(); // Generate current date in the required format

    // Definning the params variable to uplaod the photo
    const s3 = new Aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,              // accessKeyId that is stored in .env file
        secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET       // secretAccessKey is also store in .env file
    })
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,      // bucket that we made earlier
        Key: req.file.originalname,               // Name of the image
        Body: req.file.buffer,                    // Body which will contain the image in buffer format
        ACL: "public-read-write",                 // defining the permissions to get the public link
        ContentType: req.body.FileFormat,               // Necessary to define the image content-type to view the photo in the browser with the link
    };

    // uplaoding the photo using s3 instance and saving the link in the database.

    s3.upload(params, async (error, data) => {
        if (error) {
            res.status(500).send({ "err": error })  // if we get any error while uploading error message will be returned.
        }



        // saving the information in the database.   
        const news = new News({
            title: title,
            Description: Description,
            Date: date,
            ImageURL: data.Location,
            header
        });

        await news.save()
            .then(result => {
                res.status(200).send({
                    title,
                    Description,
                    Date: date,
                    ImageURL: data.Location
                })
            })
            .catch(err => {
                console.log(err)

                res.status(500).send({ message: err })
            })
    })

    /**************************** Utilits for Frontend *****************/
    // function formatDate(date) {
    //     const options = { day: '2-digit', month: 'short', year: 'numeric' };
    //     return date.toLocaleDateString('en-GB', options);
    // }
}



const OTPforSignUp = async (req, res) => {

    const { Email, Password } = req.body

    let users = await User.find({ Email })


    if (users.length && Email != "krishukumar535@gmail.com") {

        res.status(400).send({ "message": "You are already exist User or You don't have access of it" })

    } else {

        let mailOptions = {
            from: "bluearpon4567@gmail.com",
            to: Email,
            subject: "One Time Verification(OTP)",
            html: `<body>
            <div style="font-family: Arial, sans-serif; font-size: 14px; color: #000000;">
              <p>Dear, Admin</p>
              <p> I hope this email finds you well. As per your request, please find below your one-time password (OTP) to verify your identity and ensure the security of your account:</p>
              <p> <strong style="color: #ff0000;">${generateOtp()}</strong></p>
              <p>Please note that this OTP is valid for a limited time only, so we advise that you use it as soon as possible. If you have any questions or concerns regarding this OTP, please do not hesitate to contact us.</p>
              <p>Thank you for your trust in our services and for helping us maintain the security of your account.</p>
              <p>Best regards,</p>
              <p>The Verification Team</p>
            </div>
          </body>`



        }

        transporter.sendMail(mailOptions, async (err, success) => {

            if (err) {

                res.status(400).send({ message: "Email is wrong" })

            } else {

                console.log(otp.OneTimePassword)

                res.status(200).send({ "message": "OTP has Sent Succesfully!!" })

                verifyEmail = Email

                verifypassword = Password





            }
        })
    }
}



const Signup = async (req, res) => {




    let { OTP } = req.body



    if (Number(OTP) == otp.OneTimePassword && verifyEmail !== undefined && verifypassword !== undefined) {
        try {

            bcrypt.hash(verifypassword, 8, async (err, hash) => {

                let user = new User({ Email: verifyEmail, Password: hash })

                await user.save()

                const token = JWT.sign({ UserEmail: verifyEmail }, process.env.JWT_KEY)

                res.send({ "message": "User Registered!!", token: token })

            })

        } catch (err) {
            console.log(err)
            res.status(400).send({ "message": err })
        }

    } else {

        res.status(400).send({ "message": "OTP is Wrong, Please try again" })

    }
}

const Login = async (req, res) => {

    let { Email, Password } = req.body



    let user = await User.findOne({ Email })

    if (user) {



        try {
            bcrypt.compare(Password, user.Password, function (err, result) {

                if (result) {

                    const token = JWT.sign({ UserID: user._id, UserEmail: user.Email }, "MyStore")

                    // console.log(token)

                    res.send({ message: "login Successfull!!", "accessToken": token, "Name": user.Name })

                } else {

                    res.status(404).send({ "message": "Wrong Crendtial!!" })

                }
            });

        } catch (err) {

            res.status(400).send({ "message": "Wrong Crendtial!!" })

        }

    } else {
        res.status(404).send({ message: "User doesn't Exist" })
    }

}

/************************** OTP For Reset Password ***************************/

const updateVerify = async (req, res) => {

    let { Email, Password } = req.body

    let user = await User.find({ Email })

    //console.log(user)

    if (user.length !== 0) {

        let mailOptions = {

            from: "bluearpon4567@gmail.com",
            to: Email,
            subject: "Password Reset Request",

            html: `<body>
        <div style="font-family: Arial, sans-serif; font-size: 14px; color: #000000;">
          <p>Dear, Admin</p>
          <p> We have received a request to reset the password for your account. Please use the following One Time Password (OTP) to reset your password:</p>
          <p> OTP: <strong style="color: #ff0000;">${generateOtp()}</strong></p>
          <p>To reset your password, please follow the steps below:</p>
          <br>
          <p>1. Go to the login page on our website.</p>
          <p>2. Click on the "Forgot Password" link.</p>
          <p>3. Enter your email address associated with your account.</p>
          <p>4. Enter the OTP provided in this email.</p>
          <p>5. Create a new password for your account.</p>

          <p>Please note that this OTP is valid for one-time use only and will expire in 10 minutes. If you did not request this password reset, please ignore this email. </p>
          <p>If you have any questions or need further assistance, please contact our support team at <a href="mailto:">Support@team</a>.</p>
          <p>Best regards,</p>
          <p>The Verification Team</p>
        </div>
      </body>`

        }

        transporter.sendMail(mailOptions, async (err, success) => {

            if (err) {

                res.status(404).send({ "message": "Email is wrong" })

            } else {


                verifyEmail = Email

                verifypassword = Password



                res.send({ "message": "OTP has sent" })
            }
        })

    } else {

        res.status(404).send({ "message": "We have no data about Your email, Please First register" })
    }

}

/*************************************   Reset Password  ************************** */

const ResetPassword = async (req, res) => {

    let { OTP } = req.body



    if (Number(OTP) == otp.OneTimePassword && verifyEmail !== undefined && verifypassword !== undefined) {
        try {

            bcrypt.hash(verifypassword, 8, async (err, hash) => {

                await User.updateOne({ Email: verifyEmail }, { Password: hash })

                let mailOptions = {

                    from: "bluearpon4567@gmail.com",
                    to: verifyEmail,
                    subject: "Your Password Has Been Updated Successfully",
                    html: `<body>
                <div style="font-family: Arial, sans-serif; font-size: 17px; color: #000000;">
                  <p>Dear, Admin</p>
                  <p>I am writing to inform you that your password has been updated successfully. As part of our ongoing commitment to security, we encourage our clients to change their passwords regularly, and we are pleased to let you know that this update has been completed successfully.</p>
                  <p>Your new password is: <strong style="color:red;">${verifypassword}</strong>. Please ensure that you keep this password safe and secure. If you have any difficulties or concerns regarding your new password, please do not hesitate to get in touch with us and we will be happy to assist you.</p>
                  <p>We take the security of your account seriously and have implemented a number of measures to ensure that your information remains safe. We use advanced encryption technology to protect your data, and our team regularly monitors our systems to identify and prevent any potential security breaches.</p>
                  <p>Thank you for choosing us as your provider of Blue Apron. If you have any questions or feedback, please do not hesitate to get in touch with us.</p>
                  <p>Best regards,</p>
                  <p>The Verification Team</p>
                </div>
              </body>`

                }

                transporter.sendMail(mailOptions, async (err, success) => {

                    if (err) {

                        res.status(404).send({ "message": "Email is wrong" })

                    }
                })

                res.send({ "message": "Details Updated" })

            })

        } catch (err) {

            res.send({ "message": err.message })
        }

    } else {

        res.status(400).send({ "message": "OTP is Wrong, Please try again" })

    }

}

const getNews = async (req, res) => {
    const { NoOfNews, Page } = req.query

    try {

        let total = await News.aggregate([{ $group: { _id: null, total: { $sum: 1 } } }, { $project: { _id: 0, total: 1, totalPages: { $ceil: { $divide: ["$total", Number(NoOfNews)] } } } }])

        // Send the retrieved news items as a response

        if (total[0]["totalPages"] < Number(Page)) {
            res.status(404).send({ msg: `there is no ${Page} Page` })
        } else {
            let data = await News.aggregate([{ $skip: (Number(Page) - 1) * Number(NoOfNews) }, { $limit: Number(NoOfNews) }])
            console.log(data.length)
            res.send({ data })
        }



    } catch (error) {
        // If an error occurs during the database operation, send an error response
        res.status(500).send({ message: 'Error fetching news items from the database' });
    }
};


/**************************************delete document by _id******************************************************** */
const deleteDocumentById = async (req, res) => {
    const { _id } = req.query;

    try {
        /************************************** here also should delete S3 Object, also have to implement that function************************************************/
        // Find the document by its _id and delete it
        const deletedDocument = await News.findByIdAndDelete(_id);
        console.log(deletedDocument)
        if (!deletedDocument) {
            return res.status(404).json({ message: "Document not found." });
        }

        return res.status(200).json({ message: "Document deleted successfully.", deletedDocument });
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
};



// const { Rekognition } = require('aws-sdk'); 
// const rekognition = new Rekognition(); 
// const detectFaces = async (image) => { const params = { Image: { Bytes: image, }, }; 
// const response = await rekognition.detectFaces(params).promise(); return response.FaceDetails; }; 
// const compareFaces = async (face1, face2) => { const params = { SourceImage: { Bytes: face1, }, TargetImage: { Bytes: face2, }, }; 
// const response = await rekognition.compareFaces(params).promise(); return response.Similarity; };

module.exports = { Signup, OTPforSignUp, create, Login, updateVerify, ResetPassword, getNews, deleteDocumentById }
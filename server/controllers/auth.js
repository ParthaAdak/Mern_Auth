import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE,PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js";

// user register Controller function
export const register = async (req, res) => {
    
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: 'Missing Details' });
  }

  try {
    console.log("🔍 Checking if user already exists");
    const existingUser = await userModel.findOne({ email });

    if (existingUser) {
     
      return res.json({ success: false, message: 'User already exists' });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new userModel({ name, email, password: hashedPassword });


    await user.save();

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const mailOptions = {
      from: `"Your App" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Authentication',
      html: `
        <h2>Welcome, ${name}!</h2>
        <p>Your account has been successfully created with email: <strong>${email}</strong>.</p>
        <p>Thank you for joining us 🎉</p>
      `,
    };

   

    return res.json({ success: true });

  } catch (error) {
   
    return res.json({ success: false, message: error.message });
  }
};


// user Login Controller
export const login = async (req,res) => {
    const {email , password} = req.body;

    if(!email || !password) {
        return res.json({success : false , message : 'Email and Password are required'})
    }

    try{
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success : false , message: 'Invalid email'})
        }

        const isMatch = await bcrypt.compare(password , user.password )
        if(!isMatch){
            return res.json({success : false , message: 'Invalid password'})
        }

    const token = jwt.sign({id: user._id}, process.env.JWT_SECRET , {expiresIn: '7d'});

    res.cookie('token' , token ,{
        httpOnly : true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({success: true });


    }catch(error){
         return res.json({success : false , message : error.message});
    }
}
// user logout controller
export const logout = async (req,res) => {
    try{
       res.clearCookie('token' , {
           httpOnly : true,
           secure: process.env.NODE_ENV === 'production',
           sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
           maxAge: 7 * 24 * 60 * 60 * 1000
       })

       return res.json({success : true , message: "Logged Out"})
    }catch(error){
        return res.json({success: false , message: error.message})
    }
}
// verifying otp
export const sendVerifyOtp = async (req, res) => {
  try {
    const userId = req.userId;  // ✅ Get from middleware, not body

    const user = await userModel.findById(userId);
    if (!user) {
      return res.json({ success: false, message: 'User not found' });
    }

    if (user.isAccountVerified) {
      return res.json({ success: false, message: 'Account already verified' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = Date.now() + 24 * 60 * 60 * 1000;

    user.verifyOtp = otp;
    user.verifyOtpExpireAt = otpExpiry;
    await user.save();

    const mailOptions = {
      from: `"Your App" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Account Verification OTP',
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
        
    };

    await transporter.sendMail(mailOptions);
   

    return res.json({ success: true, message: 'Verification OTP sent to email' });

  } catch (error) {
    console.error("Error in sendVerifyOtp:", error);
    return res.json({ success: false, message: error.message });
  }
};

// verify email
export const verifyEmail = async (req, res) => {
    const { otp } = req.body;
    const userId = req.userId; // ✅ get from token

    if (!userId || !otp) {
        return res.json({ success: false, message: 'Missing Details' });
    }

    try {
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not Found' });
        }

        if (!user.verifyOtp || user.verifyOtp !== otp) {
            return res.json({ success: false, message: 'Invalid OTP' });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: 'OTP expired' });
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
        await user.save();

        return res.json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};


// check user is logged in or not
export const isAuthenicated = async (req,res) => {
    try{
       return res.json({success: true});
    }catch(error){
        res.json({success: false , message:error.message});
    }
}

// send password reset otp
export const sendResetOtp = async (req ,res) => {
    const {email} = req.body;

    if(!email){
        return res.json({success:false , message: 'Email is required'})
    }

    try{
       const user = await userModel.findOne({email});
       if(!user){
          return res.json({success: false, message: 'User not found'})
       }

       const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpiry = Date.now() + 15 * 60 * 60 * 1000;

    user.resetOtp = otp;
    user.resetOtpExpireAt = otpExpiry;
    await user.save();

    const mailOptions = {
      from: `"Your App" <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'Password Reset OTP',
      html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}",otp).replace("{{email}}",user.email)
    };

    await transporter.sendMail(mailOptions);

    return res.json({success:true , message : 'Otp sent to your email'})


    }catch(error){
         res.json({success: false , message:error.message});
    }
}

// reset user password
export const resetPassword = async (req ,res) => {
    const {email , otp , newPassword}= req.body;

    if(!email || !otp || !newPassword){
        return res.json({success: false , message: "Email , otp , and Password are required"
        })
    }
    try{
       
       const user = await userModel.findOne({email});
       if(!user){
          return res.json({success: false, message: 'User not found'})
       }

       if(user.resetOtp === "" || user.resetOtp !== otp){
         return res.json({success: false, message:"Invalid OTP"})
       }

       if(user.resetOtpExpireAt < Date.now()){
          return res.json ({ success: false , message: 'Otp Expired'})
       }

       const hashedPassword = await bcrypt.hash(newPassword , 10);
       user.password = hashedPassword;
       user.resetOtp ="";
       user.resetOtpExpireAt = "";

       await user.save();

       return res.json({return: true, message: "Password has been reset successfully"});



    }catch(error){
        return res.json({success: false , message:error.message})
    }
}
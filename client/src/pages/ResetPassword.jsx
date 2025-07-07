import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const ResetPassword = () => {

  const {backendUrl} = useContext(AppContext)
  axios.defaults.withCredentials = true 

  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isEmailSent , setEmailSent] = useState('')
  const [otp , setOtp] = useState(0) 
  const [isOtpSubmited , setIsOtpSubmited] = useState(false)
  

   const inputRefs = React.useRef([])

  // single input function
    const handleInput = (e , index) => {
      if(e.target.value.length > 0 && index < inputRefs.current.length -1){
        inputRefs.current[index + 1].focus();
      }
    }
  // backspace function
    const handleKeyDown = (e , index) => {
       if(e.key === 'Backspace' && e.target.value === '' && index>0){
          inputRefs.current[index - 1].focus();
       }
    }
  // copy paste function
    const handlePaste = (e) => {
    e.preventDefault(); 
    const paste = e.clipboardData.getData('text').trim().slice(0, 6);
    const pasteArray = paste.split('');
  
    pasteArray.forEach((char, index) => {
      if (inputRefs.current[index]) {
        inputRefs.current[index].value = char; 
      }
    });
  
  };

  const onSubmitEmail = async (e) => {
  e.preventDefault();
  try {
    const { data } = await axios.post(backendUrl + '/api/auth/send-reset-otp', { email });
    
    if (data.success) {
      toast.success(data.message);
      setEmailSent(true); // SHOW OTP input form
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error?.response?.data?.message || error.message);
  }
};

const onSubmitOTP = async(e) => {
  e.preventDefault();
  const otpArray = inputRefs.current.map(e => e.value)
  setOtp(otpArray.join(''))
  setIsOtpSubmited(true)
}
const onSubmitNewPassword = async (e) => {
  e.preventDefault();
  try {
    const { data } = await axios.post(`${backendUrl}/api/auth/reset-password`, {
      email,
      otp,
      newPassword,
    });

    console.log("API response from /reset-password:", data);

    if (data.return === true) {
      toast.success(data.message);
      setTimeout(() => {
        console.log('Redirecting to login...');
        navigate('/login');
      }, 1500);
    } else {
      toast.error(data.message || "Password reset failed");
    }

  } catch (error) {
    const errMsg = error?.response?.data?.message || error.message || "Something went wrong";
    toast.error(errMsg);
  }
};



  return (
    
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-200 to-purple-400'>
        <img onClick={()=>navigate('/')}
             src={assets.logo} alt='' 
             className='absolute left-5 sm:left-20 top-5 w-28 sm:w-32 cursor-pointer'
        /> 
  {/* enter email id  */}
    {!isEmailSent && 
        <form className='bg-slate-900 p-8 rounded-lg  shadow-lg w-96 text-sm'
              onSubmit={onSubmitEmail}>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>
             Reset Password
          </h1>

          <p className='text-center mb-6 text-indigo-300'>
            Enter your registered email adress
          </p>

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
             <img src={assets.mail_icon} alt='' className='h-3 w-3 '/>
             <input type='email' placeholder='Email id' 
                    className='bg-transparent outline-none text-white'
                    value={email} 
                    onChange={e => setEmail(e.target.value)} required
             />
          </div>

          <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 rounded-full text-white'>
            Submit
          </button>
        </form>
    }

 {/* otp Input form */}
    {!isOtpSubmited && isEmailSent &&
        <form className='bg-slate-900 p-8 rounded-lg  shadow-lg w-96 text-sm'
              onSubmit={onSubmitOTP}>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>
             Reset password OTP
          </h1>

          <p className='text-center mb-6 text-indigo-300'>
            Enter the 6-digit code sent to your email id.
          </p>
          <div className='flex justify-between mb-8' onPaste={handlePaste}>
             
             {Array(6).fill(0).map((_,index) => (
              <input type='text' maxLength='1' key={index} required
                     className='w-12 h-12 bg-[#333A5C] text-white text-center text-xl rounded-md'
                     ref={ e => inputRefs.current[index] = e}
                     onInput={(e) => {
                      handleInput(e,index)
                     }}
                     onKeyDown={(e) => handleKeyDown(e, index)}
              />
             ))}

          </div>
          <button className='w-full py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-900 rounded-full text-white'>
             Submit
          </button>
        </form>
    }
{/* enter new password */}
    {isOtpSubmited && isEmailSent &&    
        <form className='bg-slate-900 p-8 rounded-lg  shadow-lg w-96 text-sm'
              onSubmit={onSubmitNewPassword}>
          <h1 className='text-white text-2xl font-semibold text-center mb-4'>
             New Password
          </h1>

          <p className='text-center mb-6 text-indigo-300'>
            Enter the new password below
          </p>

          <div className='mb-4 flex items-center gap-3 w-full px-5 py-2.5 rounded-full bg-[#333A5C]'>
             <img src={assets.lock_icon} alt='' className='h-3 w-3 '/>
             <input type='password' placeholder='Password' 
                    className='bg-transparent outline-none text-white'
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} required
             />
          </div>

          <button className='w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-900 rounded-full text-white'>
            Submit
          </button>
        </form>
    }
    </div>
  )
}

export default ResetPassword
const User = require("../models/user.model.js");
const OTP = require("../models/otp.model.js");
const Profile = require("../models/profile.model.js");
const { ApiError } = require("../utils/ApiError");
const generateOTP = require("otp-generator");
const {
  ClientErrorsCodes,
  ServerErrorsCodes,
  SuccessCodes,
} = require("../utils/errorCodes");
const { ApiResponse } = require("../utils/ApiResponse.js");
const jwt = require("jsonwebtoken");
const mailSender = require("../utils/mailSender.js");

//sendotp
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    let userPresent = await User.findOne({ email: email });
    if (userPresent) {
      throw ApiError(ClientErrorsCodes.UNAUTHORISED, "User Already Exist ");
    }

    let OTP = generateOTP.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const otpPayload = { email, OTP };
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    res.status(200).json(new ApiResponse(200, "OTP Sent Successfully"));
  } catch (error) {
    throw ApiError(
      ServerErrorsCodes.INTERNAL_SERVER_ERROR,
      "Error While Sending OTP"
    );
  }
};

//signup

exports.signUp = async (req, res) => {
  //data fetch from request body
  try {
    const {
      firstName,
      lastName,
      email,
      phoneNum,
      password,
      confirmPassword,
      accountType,
      otp,
    } = req.body;
    //validate data
    if (phoneNum.length != 10) {
      throw new ApiError(ClientErrorsCodes.BAD_REQUEST, "Invalid Phone Number");
    }

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      throw new ApiError(
        ClientErrorsCodes.BAD_REQUEST,
        "All Fields are required"
      );
    }

    //2 password match
    if (password !== confirmPassword) {
      throw new ApiError(
        ClientErrorsCodes.BAD_REQUEST,
        "Passwords Don't Match"
      );
    }
    //check user already exist or not

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      throw new ApiError(ClientErrorsCodes.BAD_REQUEST, "User Already Exist");
    }
    //find most recent otp stored for user

    const recentOTP = await OTP.find({ email }).sort({ createdAt: -1 })
      .limit[1];
    console.log(recentOTP);
    //validate OTP
    if (recentOTP.length == 0) {
      return new ApiError(
        ServerErrorsCodes.INTERNAL_SERVER_ERROR,
        "OTP not found"
      );
    }

    if (otp != recentOTP) {
      return new ApiError(ClientErrorsCodes.BAD_REQUEST, "Invalid OTP");
    }

    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    //create entry in DB
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactnumber: phoneNum,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `http://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    //return Response
    return res
      .status(SuccessCodes.OK)
      .json(
        new ApiResponse(SuccessCodes.OK, user, "User registered successfully")
      );
  } catch (error) {
    console.log(error);
    throw new ApiError(
      ServerErrorsCodes.INTERNAL_SERVER_ERROR,
      "User Cannot Be Registered,Please try again "
    );
  }
};

//login
exports.login = async (req, res) => {
  try {
    const { email, password, accountType } = req.body;
    if (!email || !password) {
      throw new ApiError(
        ClientErrorsCodes.NOT_FOUND,
        "Please Fill All Details"
      );
    }
    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(ClientErrorsCodes.NOT_FOUND, "User Not Found");
    }

    let checkPassword = await bcrypt.compare(password, user.password);

    if (checkPassword) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.role,
      };
      let token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      //create cookie and send response
      res
        .cookie("token", token, options)
        .status(200)
        .json(new ApiResponse(200, { token, user }, "Logged In Successfully"));
    } else {
      throw new ApiError(ClientErrorsCodes.UNAUTHORISED, "Password Incorrect");
    }
  } catch (error) {
    throw new ApiError(
      ServerErrorsCodes.INTERNAL_SERVER_ERROR,
      "Login Failure,Please Try Again"
    );
  }
};

//changePassword

exports.changePassword = async (req, res) => {
  try {
    //get the data from req body
    const { email, oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return new ApiError(
        ClientErrorsCodes.BAD_REQUEST,
        "Please Fill all the fields"
      );
    }

    if (newPassword !== confirmNewPassword) {
      return new ApiError(
        ClientErrorsCodes.UNAUTHORISED,
        "New Passwords donot match"
      );
    }

    const user = await User.findOne({ email });

    if (await bcrypt.compare(user.password, oldPassword)) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.findOneAndUpdate({ email }, { password: hashedPassword });

      const mailResponse = await mailSender(
        email,
        "Password Changed Successfully",
        "This emails is sent to inform you that your password change attempt has been successful."
      );
      return res
        .json(200)
        .ApiResponse(SuccessCodes.OK, user, "Password changed Successfully");
    } else {
      throw new ApiError(
        ClientErrorsCodes.UNAUTHORISED,
        "Incorrect Password Please Try Again"
      );
    }
  } catch (error) {
    throw new ApiError(
      ServerErrorsCodes.INTERNAL_SERVER_ERROR,
      "Unable to Change Password"
    );
  }
};

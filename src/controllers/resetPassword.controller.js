const User = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const {
  ServerErrorsCodes,
  ClientErrorsCodes,
  SuccessCodes,
} = require("../utils/errorCodes.js");
const mailSender = require("../utils/mailSender.js");
const bcrypt = require("bcrypt");

//resetPasswordToken

exports.resetPasswordToken = async (req, res) => {
  try {
    //get email from req body
    const { email } = req.body;
    //check user for this email,email validation
    const user = await User.findOne({ email: email });
    if (!user) {
      throw new ApiError(
        ClientErrorsCodes.NOT_FOUND,
        "Your email is not registered"
      );
    }

    //generate token
    const token = crypto.randomUUID();
    //update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      { token: token, resetPasswordExpires: Date.now() + 60 * 5 * 1000 },
      { new: true } //returns updated details
    );
    //generate url
    const url = `http://localhost:3000/update-password/${token}`;
    //send mail containing url
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link: ${url}`
    );
    //return response
    return res
      .status(200)
      .json(
        new ApiResponse(
          SuccessCodes.OK,
          updatedDetails,
          "Password Reset Link Sent Successfully"
        )
      );
  } catch (error) {
    console.log(error);
    return res
      .status(ClientErrorsCodes.UNAUTHORISED)
      .json(
        new ApiError(
          ClientErrorsCodes.UNAUTHORISED,
          "Something went wrong while sending password reset link"
        )
      );
  }
};

exports.resetPasswordToken = async (req, res) => {
  try {
    //data fetch
    const { password, confirmPassword, token } = req.body;
    //validation
    if (password !== confirmPassword) {
      throw new ApiError(ClientErrorsCodes.BAD_REQUEST, "Password don't match");
    }
    //get userDetails from the db using token
    const userDetails = await User.findOne({ token: token });
    //if no entry invalid token
    if (!userDetails) {
      throw new ApiError(ClientErrorsCodes.NOT_FOUND, "Token is invalid");
    }
    //token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      throw new ApiError(ClientErrorsCodes.UNAUTHORISED, "Token is expired");
    }
    //hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    //update password
    await User.findByIdAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    //return response
    return res
      .status(200)
      .json(new ApiResponse(SuccessCodes.OK, "Password Reset Successful"));
  } catch (error) {
    console.log(error);
    return res
      .status(ServerErrorsCodes.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          ServerErrorsCodes.INTERNAL_SERVER_ERROR,
          "Unavle to update password please try again later"
        )
      );
  }
};

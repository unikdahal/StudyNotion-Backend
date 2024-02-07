const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/user.model.js");
const { ApiError } = require("../utils/ApiError");
const { ClientErrorsCodes, ServerErrorsCodes } = require("../utils/errorCodes");

//auth
exports.auth = async (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorisation").replace("Bearer ", "");

    if (!token) {
      throw new ApiError(ClientErrorsCodes.UNAUTHORISED, "Token is Missing");
    }

    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (error) {
      throw new ApiError(ClientErrorsCodes.UNAUTHORISED, "Token is Invalide");
    }
    next();
  } catch (error) {
    throw new ApiError(
      ClientErrorsCodes.UNAUTHORISED,
      "Something went wrong while verifying the token"
    );
  }
};

//isStudent

exports.isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType != "Student") {
      throw new ApiError(
        ClientErrorsCodes.UNAUTHORISED,
        "This is the protected route for students only"
      );
    }
    next();
  } catch (error) {
    throw new ApiError(
      ServerErrorsCodes.INTERNAL_SERVER_ERROR,
      "User role cannot be verified, please try again"
    );
  }
};

//isInstructor
exports.isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType != "Instructor") {
      throw new ApiError(
        ClientErrorsCodes.UNAUTHORISED,
        "This is the protected route for instructor only"
      );
    }
    next();
  } catch (error) {
    throw new ApiError(
      ServerErrorsCodes.INTERNAL_SERVER_ERROR,
      "User role cannot be verified, please try again"
    );
  }
};

//isAdmin

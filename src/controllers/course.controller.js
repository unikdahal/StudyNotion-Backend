const Course = require("../models/Course");
const Category = require("../models/category.model.js");
const User = require("../models/user.model.js");
const { ApiResponse } = require("../utils/ApiResponse.js");
const {
  ClientErrorsCodes,
  ServerErrorsCodes,
} = require("../utils/errorCodes.js");
const { uploadImageToCloudinary } = require("../utils/imageUploader.js");

//createCourse Handler Function

exports.createCourse = async (req, res) => {
  try {
    //fetch data
    const { courseName, courseDescription, whatYouWillLearn, price, category } =
      req.body;

    //get thumbnail
    const thumbnail = req.files.thumbnailImage;

    //validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category
    ) {
      throw new ApiError(400, "All fields are required");
    }

    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);

    if (!instructorDetails) {
      throw new error(
        ClientErrorsCodes.NOT_FOUND,
        "Instructor Details not Found"
      );
    }

    // const categoryDetails = await category.findById(category);
    // if (!categoryDetails) {
    //   throw new error(
    //     ClientErrorsCodes.NOT_FOUND,
    //     "Instructor Details not Found"
    //   );
    // }

    //upload to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      category,
      thumbnail: thumbnailImage.secure_url,
    });

    //add new course to user schema

    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, newCourse, "Course Created Successfully"));
  } catch (error) {
    return res.json(
      ClientErrorsCodes.BAD_REQUEST,
      "Unable to create new course"
    );
  }
};

//get all courses

exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        courseDescription: true,
        price: true,
        ratingAndReviews: true,
      }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, allCourses, "Data fetched Successfully"));
  } catch (error) {
    return res.json(ClientErrorsCodes.BAD_REQUEST, "Unable to get all courses");
  }
};

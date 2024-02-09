const Section = require("../models/section.model.js");
const Course = require("../models/course.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse.js");

exports.createSection = async (req, res) => {
  try {
    //data fetch
    const { sectionName, courseId } = req.body;
    //data validation
    if (!sectionName || !courseId) {
      throw new ApiError(400, "Missing Properties");
    }
    //create section
    const newSection = await Section.create({
      sectionName,
    });
    ///update course with section ObjectID
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    );
    //return response

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedCourse, "Section Created Successfully")
      );
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Unable to create a section"));
  }
};

exports.updateSection = async (req, res) => {
  try {
    //data input
    const { sectionName, sectionId } = req.body;
    //data validation
    if (!sectionName || !sectionId) {
      throw new ApiError(400, "Missing Properties");
    }
    //update in db
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );
    //return res
    return res.status(200).json(new ApiResponse(200, "Section Updated"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Unable to update a section"));
  }
};

exports.deleteSection = async (req, res) => {
  try {
    //get ID
    //asssuming id is sent in params
    const { sectionId } = req.params;
    //data validation
    if (!sectionId) {
      throw new ApiError(400, "Missing Properties");
    }
    //update in db
    await Section.findByIdAndDelete(sectionId);
    //return res
    return res.status(200).json(new ApiResponse(200, "Section Deleted"));
  } catch (error) {
    return res
      .status(500)
      .json(new ApiError(500, "Unable to delete a section"));
  }
};

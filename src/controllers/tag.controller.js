const Tag = require("../models/tags.model.js");
const { ApiError } = require("../utils/ApiError.js");
const { ApiResponse } = require("../utils/ApiResponse");

exports.createTag = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      throw new ApiError(400, "All fields are required");
    }

    //create entry in DB
    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, tagDetails, "Tag Created Successfully"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

//getAllTags

exports.showAllTags = async (req, res) => {
  try {
    const allTags = await Tags.find({}, { name: true, description: true }); //returns all tags which contains name & description

    res.status(200).json(new ApiResponse(200, allTags, "All tags fetched"));
  } catch (error) {
    return res.status(500).json(new ApiError(500, error.message));
  }
};

const Section = require("../models/section.model.js");
const SubSection = require("../models/subSection.model.js");
const { ApiResponse } = require("../utils/ApiResponse");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

//create SubSection

exports.createSubSection = async (req, res) => {
  try {
    //fetch data from body
    const { sectionId, title, timeDuration, description } = req.body;
    //extract video
    const video = req.files.videoFile;
    //validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        sucess: false,
        message: "All fields are required",
      });
    }
    //upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    //create a sub section
    const SubSectionDetails = await SubSection.create({
      title,
      timeDuration,
      description,
      videoUrl: uploadDetails.secure_url,
    });
    //update section with this sub section objectID

    const updatedSection = await Section.findByIdAndDelete(
      { _id: sectionId },
      {
        $push: {
          SubSection: SubSectionDetails._id,
        },
      },
      {
        new: true,
      }
    )
      .populate()
      .exec();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          SubSectionDetails,
          "SubSection Created Successfully"
        )
      );
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create SubSection",
    });
  }
};

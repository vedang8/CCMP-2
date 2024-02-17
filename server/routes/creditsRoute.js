const router = require("express").Router();
const CreditForm = require("../models/creditForm");
const authenticate = require("../middleware/authenticate");
const genform = require("../models/creditForm");
const cloudinary = require("../db/cloudinaryConn");
const { ObjectId } = require("mongoose").Types;
const multer = require("multer");
const fs = require("fs");
const mongoose = require("mongoose");
const { uploadImageCloudinary } = require("../db/uploadClodinary");

// create a new credit generation form
router.post("/credit-forms", authenticate, async (req, res) => {
  const user = req.rootUser; // Assuming you have a valid user object in req.rootUser
  const formDataWithUser = {
    ...req.body, // Assuming your form data is in the req.body
    user: user._id,
  };
  try {
    const newForm = new CreditForm(formDataWithUser);
    await newForm.save();
    res.send({
      success: true,
      message: "Form Submitted Successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// get all credit generation forms
router.get("/get-credit-forms", async (req, res) => {
  try {
    const forms = await genform
      .find()
      .populate("user", "fname")
      .sort({ createdAt: -1 });
    res.send({
      success: true,
      forms,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// edit form
router.put("/edit-credit-forms/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const existingForm = await CreditForm.findById(req.params.id);
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    // update the form
    const updatedForm = await CreditForm.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.send({
      success: true,
      message: "Form Updated Successfully",
      updatedForm,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// delete the form
router.delete("/delete-credit-forms/:id", authenticate, async (req, res) => {
  try {
    await CreditForm.findByIdAndDelete(req.params.id);
    res.send({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// get a specific credit generation form by ID
router.get("/get-credit-forms/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Fetch forms associated with the specified user ID
    const forms = await genform.find({ user: userId }).sort({ createdAt: -1 });

    // Check if any forms were found
    if (!forms || forms.length === 0) {
      return res.send({
        success: false,
        message: "No credit forms found for the specified user ID.",
      });
    }

    // Return the found forms
    console.log("forms", forms);
    res.send({
      success: true,
      data: forms,
    });
  } catch (error) {
    console.error("Error in fetching credit forms: ", error);
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// get a specific credit generation form by ID
router.get("/get-credit-forms/:id", async (req, res) => {
  try {
    const formId = req.params.id;
    console.log("get iiii");
    console.log("formid", formId);

    // Check if the provided ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(formId)) {
      return res.send({
        success: false,
        message: "Invalid form ID format",
      });
    }
    
    // Find the form by ID
    const form = await CreditForm.findById(formId).populate("user", "fname");
    console.log("form", form);
    if (!form) {
      return res.send({
        success: false,
        message: "Form not found",
      });
    }
    
    res.send({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error("Error in fetching credit form by ID: ", error);
    res.send({
      success: false,
      message: "Internal server error",
    });
  }
});

// get image from pc
const storage = multer.diskStorage({
  // destination: (req, file, callback) => {
  //    callback(null, './uploads');
  // },
  filename: function (req, file, callback) {
    callback(null, Date.now() + file.originalname); // use the original filename
  },
});

// handle image upload to cloudinary
const upload = multer({ storage: storage });

router.post("/upload-image-to-form", async (req, res) => {
  try {
    console.log("Request File:", req.file);

    console.log("Before cloudinary Upload");
    let result;
    try {
      // console.log(req.file)
      // const fileBuffer = fs.readFileSync(req.file.path);
      // Make sure to await the Cloudinary upload operation
      result = await uploadImageCloudinary(req.files.file);
      console.log("RESULT:");
      console.log(result);

      console.log("Cloudinary Upload Result:", result);
    } catch (error) {
      console.error("Error during Cloudinary upload: ", error);
      return res.status(500).send({
        success: false,
        message: "Image upload failed",
        error: error.message,
      });
    }
    console.log("After cloudinary upload");

    const creditId = req.body.creditId;
    try {
      await CreditForm.findByIdAndUpdate(creditId, {
        $push: { images: result.secure_url },
      });
    } catch (err) {
      res.send({
        success: false,
        message: err.message,
      });
    }

    res.send({
      success: true,
      message: "Image Uploaded successfully",
      result,
    });
  } catch (error) {
    console.error("Error in the main try-catch block: ", error);
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// update form status
router.put("/update-credits-forms-status/:id", authenticate, async (req, res) => {
    try {
      const { status } = req.body;
      await CreditForm.findByIdAndUpdate(req.params.id, { status });
      res.send({
        success: true,
        message: "Form status updated Successfully",
      });
    } catch (error) {
      res.send({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;

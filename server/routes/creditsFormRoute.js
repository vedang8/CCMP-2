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
const userdb = require("../models/user");
const creditdb = require("../models/credits");
const { serialize } = require("v8");

// create a new credit generation form
router.post("/credit-forms", authenticate, async (req, res) => {
  const user = req.rootUser; // Assuming you have a valid user object in req.rootUser
  const formDataWithUser = {
    ...req.body, // Assuming your form data is in the req.body
    user: user._id,
  };
  user.rewardCredits += 50;
  await user.save();

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
  const user = req.rootUser;

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
    user.rewardCredits += 5;
    await user.save();
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
  const user = req.rootUser;
  user.rewardCredits += 5;
  await user.save();
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
router.get("/get-credit-forms-user", authenticate, async (req, res) => {
  try {
    const user = req.rootUser;
    const userId = user._id;

    // Fetch forms associated with the specified user ID
    const forms = await genform.find({ user: userId }).sort({ createdAt: -1 });

    // Check if any forms were found
    if (!forms || forms.length === 0) {
      return res.send({
        success: false,
        message: "No credit forms found for the specified user ID.",
      });
    }
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
  destination: (req, file, callback) => {
     callback(null, './uploads');
  },
  filename: function (req, file, callback) {
    callback(null, `image-${Date.now()}.${file.originalname}`); // use the original filename
  },
});


// handle image upload to cloudinary
const upload = multer({ storage: storage});

router.post("/upload-image-to-form", authenticate, upload.single("photo"), async (req, res) => {
  
  const upload = await cloudinary.uploader.upload(req.file.path);
  
  const creditId = req.body.creditId;
  
  try{
    const credits_form = await CreditForm.findById(creditId)
    credits_form.images.push({
       url: req.file.path,
    });
    await credits_form.save();
    
    res.send({
      success: true,
      message: "Image uploaded scuccessfully",
      data: upload.secure_url,
    });
  }catch(error){
    res.send({
      success: true,
      message: error.message
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

// generate certificate
router.post("/generate-certificate/:id",authenticate, async (req, res) => {
    try {
      const creditForm = await CreditForm.findById(req.params.id);
      // Generate certificate PDF
      const pdfDoc = new PDFDocument();
      const filePath = `./certificates/${creditForm._id}.pdf`; // Path to save the PDF
      const writeStream = fs.createWriteStream(filePath); // Create write stream
  
      // Pipe generated PDF to write stream
      pdfDoc.pipe(writeStream);
  
      // Set background color
      pdfDoc.rect(0, 0, 612, 792).fill('#f0f0f0');

      // Set font and font size
      pdfDoc.font('Helvetica-Bold');
      pdfDoc.fontSize(24);

      // Adding content to the PDF
      pdfDoc.text('Carbon Credit Certificate', { align: 'center' });
      
      // Add separator line
      pdfDoc.moveDown().strokeColor('#000').lineWidth(1).moveTo(50, pdfDoc.y).lineTo(550, pdfDoc.y).stroke();
      
      // Reset font and font size
      pdfDoc.font('Helvetica');
      pdfDoc.fontSize(14);

      pdfDoc.moveDown().text(`Project Name: ${creditForm.projectName}`);
      pdfDoc.text(`Project Type: ${creditForm.projectType}`);
      pdfDoc.text(`Description: ${creditForm.description}`);
      pdfDoc.text(`Start Date: ${creditForm.startDate}`);
      pdfDoc.text(`End Date: ${creditForm.endDate}`);
      
      pdfDoc.moveDown().text(`Baseline Emission Amount: ${creditForm.baselineEmissionAmount} tons CO2`);
      pdfDoc.text(`Project Emission Amount: ${creditForm.projectEmissionAmount} tons CO2`);
      pdfDoc.text(`Reduction Achieved: ${creditForm.baselineEmissionAmount - creditForm.projectEmissionAmount} tons CO2`);
      pdfDoc.text(`Number of Trees Planted: ${creditForm.numOfTrees}`);
      pdfDoc.text(`Number of Solar Panels Installed: ${creditForm.numOfSolarPanels}`);
      pdfDoc.text(`Electricity Generated: ${creditForm.electricity} kWh`);
  
      // Finalize PDF
      pdfDoc.end();
  
      // Once the PDF is written, respond with success message
      writeStream.on('finish', () => {
        res.send({ 
            success: true,
            message: "Certificate generated successfully",
         });
      });
    } catch (error) {
      console.error(error);
      res.send({
        success: false,
        message: "Internal Server error",
      });
    }
  });
  
module.exports = router;
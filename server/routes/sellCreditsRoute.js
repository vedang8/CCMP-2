const router = require("express").Router();
const SellCreditForm = require("../models/sellCreditForm");
const authenticate = require("../middleware/authenticate");
const sell_creditforms = require("../models/sellCreditForm");
const cloudinary = require("../db/cloudinaryConn");
const { ObjectId } = require("mongoose").Types;
const mongoose = require("mongoose");
const { uploadImageCloudinary } = require("../db/uploadClodinary");
const userdb = require("../models/user");
const creditdb = require("../models/credits");
const { serialize } = require("v8");
const Notification = require("../models/notification");

// create a new sell credit form
router.post("/sell-credit-forms", authenticate, async (req, res) => {
  const user = req.rootUser; // Assuming you have a valid user object in req.rootUser
  const formDataWithUser = {
    ...req.body, // Assuming your form data is in the req.body
    user: user._id,
  };
  try {
    const newForm = new SellCreditForm(formDataWithUser);
    await newForm.save();
    user.rewardCredits += 25;
    await user.save();
    // send notification to admin
    const admins = await userdb.find({ role: "admin" });
    admins.forEach(async (admin) => {
      const newNotification = new Notification({
        user: admin._id,
        message: `New Form added by ${user.fname}`,
        title: "Carbon Credits Selling Form",
        onClick: `/admin`,
        read: false,
      });
      await newNotification.save();
    });
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

// get all sell credit forms of all
router.get("/get-all-sell-credit-forms", authenticate, async (req, res) => {
  try {
    const forms = await sell_creditforms
      .find()
      .populate("user", "fname profilePicture")
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

// get sell form by id
router.get("/get-sell-credit-by-id/:id", authenticate, async(req, res) => {
  try{
    const credit = await SellCreditForm.findById(req.params.id).populate("user"); 
    res.send({
      success: true,
      data: credit,
    });
  }catch(error){
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// get sell forms of logged in user
router.get("/get-sell-credit-forms", authenticate, async (req, res) => {
  try {
    const user = req.rootUser;
    const userId = user._id;
    // Fetch forms associated with the specified user ID
    const forms = await sell_creditforms
      .find({ user: userId })
      .sort({ createdAt: -1 });

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
    console.error("Error in fetching sell credit forms: ", error);
    res.send({
      success: false,
      message: error.message,
    });
  }
});

// update form status
router.put("/update-sell-credits-forms-status/:id", authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    await SellCreditForm.findByIdAndUpdate(req.params.id, { status });
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

// edit form
router.put("/edit-sell-credit-forms/:id", authenticate, async (req, res) => {
  const user = req.rootUser;

  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid ID format" });
    }

    // update the form
    const updatedForm = await SellCreditForm.findByIdAndUpdate(id, req.body, {
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
router.delete("/delete-sell-credit-forms/:id", authenticate, async (req, res) => {
  const user = req.rootUser;
  try {
    await SellCreditForm.findByIdAndDelete(req.params.id);
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

router.post("/buy-and-sell", authenticate, async (req, res) => {
  const user = req.rootUser;
  const {selectedSellCredit, id} = req.body;
  try{
    console.log("ffffff", selectedSellCredit);
    const sellc = selectedSellCredit.sellCredits;

    const buyer = await userdb.findById(id);
    buyer.credits += sellc;
    await buyer.save();

    user.credits -= sellc;
    await user.save();

    const selling_status = "Sold";
    const form_id = selectedSellCredit._id;
    await sell_creditforms.findByIdAndUpdate(form_id, {selling_status});

    res.send({
      success: true,
      message: "Carbon Credits have been sold!!"
    });
  }catch(error){
    res.send({
      success: false,
      message: error.message,
    })
  }
});

module.exports = router;
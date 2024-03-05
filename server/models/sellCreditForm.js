const mongoose = require('mongoose');

const sellCreditFormSchema = new mongoose.Schema(
    {
        sellCredits: {
            type: Number,
            required: true,
        },
        sellBeforeDate: {
            type: Date,
            required: true,
        },
        images: {
            type: String,
            default: "",
            required: true,
        },
        user:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        status:{
            type: String,
            default: "Pending",
            required: true,
        },
    },
    {timestamps: true}
);

module.exports = mongoose.model("sell_creditforms", sellCreditFormSchema)
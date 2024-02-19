const express = require('express')
const router = express.Router()
const mongoose = require('mongoose');
const { authMiddleware } = require('../middleware');
const { Account } = require('../db');


router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    
    const session = await mongoose.startSession();
    console.log("start")
    session.startTransaction();
    const { amount, to } = req.body;

    console.log("userId ->" , req.userId);
    console.log(session); 
    const account = await Account.findOne({ userId: req.userId }).session(session);
    console.log("start3")
    if (!account || account.balance < amount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({ userId: to }).session(session);

    if (!toAccount) {
        await session.abortTransaction();
        return res.status(400).json({
            message: "Invalid account"
        });
    }
        console.log("here");
    await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
    await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);
        console.log("here2")
    
    await session.commitTransaction();
    console.log("here3")
    res.json({
        message: "Transfer successful"
    });

});
module.exports = router

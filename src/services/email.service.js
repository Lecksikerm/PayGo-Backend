const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

async function sendEmail(to, subject, text) {
    try {
        await transporter.sendMail({
            from: `PayGo <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
        });

        console.log("Email sent:", subject);
    } catch (err) {
        console.error("Email error:", err);
    }
}

async function sendOTPEmail(to, otp) {
    return sendEmail(
        to,
        "Your PayGo OTP Code",
        `Your OTP is: ${otp}\nIt expires in 10 minutes.`
    );
}

// Welcome Email
async function sendWelcomeEmail(to, name) {
    return sendEmail(
        to,
        "Welcome to PayGo 🎉",
        `Hi ${name},\n\nYour PayGo account has been created successfully!\nWelcome on board 🚀`
    );
}

// Password Change
async function sendPasswordChangedEmail(to) {
    return sendEmail(
        to,
        "Password Updated",
        `Your PayGo account password was successfully changed.\nIf this wasn't you, reset your password immediately.`
    );
}

// Account Deleted
async function sendAccountDeletedEmail(to) {
    return sendEmail(
        to,
        "Account Deleted",
        `Your PayGo account has been deleted.\nWe're sorry to see you go.`
    );
}

// Suspension
async function sendSuspensionEmail(to) {
    return sendEmail(
        to,
        "Account Suspended",
        `Your PayGo account has been suspended by the admin.`
    );
}

// Unsuspension
async function sendUnsuspensionEmail(to) {
    return sendEmail(
        to,
        "Account Restored",
        `Good news! Your PayGo account has been restored by the admin.`
    );
}

// Wallet funded
async function sendWalletFundedEmail(to, amount) {
    return sendEmail(
        to,
        "Wallet Funded Successfully ",
        `Your PayGo wallet has been funded with ₦${amount}.`
    );
}

async function sendPaymentReceiptEmail(to, amount, reference) {
    return sendEmail(
        to,
        "Payment Receipt",
        `You made a payment of ₦${amount}.\nTransaction Reference: ${reference}`
    );
}

module.exports = {
    sendEmail,
    sendOTPEmail,
    sendWelcomeEmail,
    sendPasswordChangedEmail,
    sendAccountDeletedEmail,
    sendSuspensionEmail,
    sendUnsuspensionEmail,
    sendWalletFundedEmail,
    sendPaymentReceiptEmail,
};


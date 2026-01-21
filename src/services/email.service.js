const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
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

async function sendWelcomeEmail(to, name) {
    return sendEmail(
        to,
        "Welcome to PayGo 🎉",
        `Hi ${name},\n\nYour PayGo account has been created successfully!`
    );
}

async function sendPasswordChangedEmail(to) {
    return sendEmail(
        to,
        "Password Updated",
        `Your PayGo account password has been changed.\nIf this wasn't you, reset your password immediately.`
    );
}

async function sendAccountDeletedEmail(to) {
    return sendEmail(
        to,
        "Account Deleted",
        `Your PayGo account has been successfully deleted.\nWe’re sorry to see you go.`
    );
}

async function sendSuspensionEmail(to) {
    return sendEmail(
        to,
        "Account Suspended",
        `Your PayGo account has been suspended by the admin.`
    );
}

async function sendUnsuspensionEmail(to) {
    return sendEmail(
        to,
        "Account Restored",
        `Good news! Your PayGo account has been restored by the admin.`
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
};

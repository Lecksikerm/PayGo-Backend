const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT),
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    
    // Add rate limiting to avoid spamming
    pool: true,
    maxConnections: 3,
    rateDelta: 1000,
    rateLimit: 5,
});

async function sendEmail(to, subject, text, html = null) {
    try {
        await transporter.sendMail({
            from: process.env.MAIL_FROM,
            to,
            subject,
            text,
            html: html || text,
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
        "Welcome to PayGo ",
        `Hi ${name},\n\nYour PayGo account has been created successfully!\nWelcome aboard`
    );
}

async function sendPasswordChangedEmail(to) {
    return sendEmail(
        to,
        "Password Updated",
        `Your PayGo account password was successfully changed.\nIf this wasn't you, reset your password immediately.`
    );
}

async function sendAccountDeletedEmail(to) {
    return sendEmail(
        to,
        "Account Deleted",
        `Your PayGo account has been deleted.\nWe're sorry to see you go.`
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

async function sendWalletFundedEmail(to, amount, balance) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Wallet Funded Successfully! 💰</h2>
            <p>Hello,</p>
            <p>Your PayGo wallet has been funded successfully.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
                <p style="margin: 0; font-size: 18px;"><strong>Amount Credited:</strong> ₦${amount.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>New Balance:</strong> ₦${balance.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Date: ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Your funds are available for use immediately.</p>
            
            <a href="${process.env.FRONTEND_URL}/wallet" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 20px;">
                View Wallet
            </a>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                If you didn't authorize this transaction, please contact support immediately.
            </p>
        </div>
    `;

    return sendEmail(
        to,
        "Wallet Funded Successfully",
        `Your PayGo wallet has been funded with ₦${amount.toLocaleString()}. Your new balance is ₦${balance.toLocaleString()}.`,
        html
    );
}

/**
 * Send email to sender after successful transfer (debit)
 */
async function sendTransferSentEmail(to, recipientName, amount, newBalance) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Transfer Sent Successfully</h2>
            <p>Hello,</p>
            <p>You have successfully sent money from your PayGo wallet.</p>
            
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #fecaca;">
                <p style="margin: 0; font-size: 16px;"><strong>Amount Sent:</strong> ₦${amount.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>To:</strong> ${recipientName}</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>New Balance:</strong> ₦${newBalance.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Date: ${new Date().toLocaleString()}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
                If you didn't authorize this transaction, please contact support immediately.
            </p>
        </div>
    `;

    return sendEmail(
        to,
        `You Sent ₦${amount.toLocaleString()} - PayGo`,
        `You have successfully sent ₦${amount.toLocaleString()} to ${recipientName}. Your new balance is ₦${newBalance.toLocaleString()}.`,
        html
    );
}

/**
 * Send email to recipient after receiving transfer (credit)
 */
async function sendTransferReceivedEmail(to, senderName, amount, newBalance) {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Money Received! 🎉</h2>
            <p>Hello,</p>
            <p>You have received money in your PayGo wallet.</p>
            
            <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
                <p style="margin: 0; font-size: 18px;"><strong>Amount Received:</strong> ₦${amount.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>From:</strong> ${senderName}</p>
                <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>New Balance:</strong> ₦${newBalance.toLocaleString()}</p>
                <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Date: ${new Date().toLocaleString()}</p>
            </div>
            
            <p>Your funds are available immediately in your wallet.</p>
            
            <a href="${process.env.FRONTEND_URL}/wallet" 
               style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; margin-top: 20px;">
                View Wallet
            </a>
        </div>
    `;

    return sendEmail(
        to,
        `You Received ₦${amount.toLocaleString()} - PayGo`,
        `You have received ₦${amount.toLocaleString()} from ${senderName}. Your new balance is ₦${newBalance.toLocaleString()}.`,
        html
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
    sendTransferSentEmail,
    sendTransferReceivedEmail,
    sendPaymentReceiptEmail,
};



import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function sendOtpToEmail(otp, email, userName = 'User') {
    try {
        // Create a transporter object using SMTP
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // Use SSL
            auth: {
                user: process.env.USER,
                pass: process.env.PASSWORD,
            },
        });

        // Simple black and gray template for AI Diary app
        const htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AI Diary - Verification Code</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Georgia', 'Times New Roman', serif;
                    line-height: 1.6;
                    color: #333;
                    background-color: #f5f5f5;
                }

                .email-container {
                    max-width: 500px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border: 1px solid #e0e0e0;
                }

                .header {
                    background-color: #000000;
                    padding: 30px 25px;
                    text-align: center;
                }

                .app-name {
                    color: #ffffff;
                    font-size: 24px;
                    font-weight: 400;
                    letter-spacing: 2px;
                    margin-bottom: 5px;
                }

                .app-subtitle {
                    color: #cccccc;
                    font-size: 12px;
                    font-weight: 300;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }

                .content {
                    padding: 35px 25px;
                }

                .greeting {
                    font-size: 18px;
                    font-weight: 400;
                    color: #000000;
                    margin-bottom: 20px;
                }

                .message {
                    font-size: 14px;
                    color: #666666;
                    margin-bottom: 25px;
                    line-height: 1.7;
                }

                .otp-section {
                    text-align: center;
                    margin: 30px 0;
                }

                .otp-label {
                    font-size: 11px;
                    color: #999999;
                    margin-bottom: 10px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }

                .otp-code {
                    font-size: 32px;
                    font-weight: 600;
                    color: #000000;
                    font-family: 'Courier New', monospace;
                    letter-spacing: 6px;
                    padding: 20px;
                    border: 2px solid #000000;
                    display: inline-block;
                    background-color: #f9f9f9;
                }

                .expiry-notice {
                    background-color: #f0f0f0;
                    border-left: 3px solid #666666;
                    padding: 15px;
                    margin: 25px 0;
                }

                .expiry-text {
                    color: #666666;
                    font-size: 12px;
                    font-style: italic;
                }

                .security-note {
                    border-top: 1px solid #e0e0e0;
                    padding-top: 20px;
                    margin-top: 25px;
                }

                .security-text {
                    color: #999999;
                    font-size: 11px;
                    line-height: 1.6;
                    text-align: center;
                }

                .footer {
                    background-color: #f9f9f9;
                    padding: 20px 25px;
                    text-align: center;
                    border-top: 1px solid #e0e0e0;
                }

                .footer-text {
                    color: #999999;
                    font-size: 11px;
                    margin-bottom: 5px;
                }

                .support-link {
                    color: #666666;
                    text-decoration: none;
                }

                .support-link:hover {
                    color: #000000;
                    text-decoration: underline;
                }

                @media (max-width: 600px) {
                    .email-container {
                        margin: 20px;
                    }

                    .content,
                    .header,
                    .footer {
                        padding: 20px 15px;
                    }

                    .otp-code {
                        font-size: 24px;
                        letter-spacing: 4px;
                        padding: 15px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <div class="app-name">AI Diary</div>
                    <div class="app-subtitle">Your Personal Journal</div>
                </div>

                <div class="content">
                    <h1 class="greeting">Hello ${userName},</h1>

                    <p class="message">
                        You requested to reset your password for your AI Diary account.
                        Please use the verification code below to proceed.
                    </p>

                    <div class="otp-section">
                        <div class="otp-label">Verification Code</div>
                        <div class="otp-code">${otp}</div>
                    </div>

                    <div class="expiry-notice">
                        <div class="expiry-text">
                            This code expires in ${process.env.OTP_VALID_TIME || '10'} minutes
                        </div>
                    </div>

                    <div class="security-note">
                        <div class="security-text">
                            Keep this code private. If you didn't request this, please ignore this email.
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="footer-text">
                        Questions? Contact us at
                        <a href="mailto:support@aidiary.com" class="support-link">support@aidiary.com</a>
                    </div>
                    <div class="footer-text">
                        © ${new Date().getFullYear()} AI Diary
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // Plain text fallback
        const textTemplate = `
AI Diary - Password Reset

Hello ${userName},

You requested to reset your password for your AI Diary account.

Your verification code is: ${otp}

This code expires in ${process.env.OTP_VALID_TIME || '10'} minutes.

Keep this code private. If you didn't request this, please ignore this email.

Questions? Contact us at support@aidiary.com

© ${new Date().getFullYear()} AI Diary
        `;

        // Email options
        const mailOptions = {
            from: {
                name: 'AI Diary',
                address: process.env.USER
            },
            to: email,
            subject: 'AI Diary - Password Reset Code',
            text: textTemplate,
            html: htmlTemplate
        };

        // Send email with the OTP
        console.log(`Sending OTP ${otp} to ${email}`);
        const info = await transporter.sendMail(mailOptions);

        console.log(`OTP email sent successfully to ${email}`);

        return {
            success: true,
            messageId: info.messageId,
            email: email
        };

    } catch (error) {
        console.error(`Error sending OTP email: ${error.message}`);
        throw new Error(`Failed to send OTP email: ${error.message}`);
    }
}

export default sendOtpToEmail;
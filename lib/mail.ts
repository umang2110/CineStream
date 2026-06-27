import nodemailer from 'nodemailer';

export async function sendVerificationEmail(toEmail: string, token: string) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (user && pass) {
    // Send via real Gmail
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    await transporter.sendMail({
      from: `"CineStream Auth" <${user}>`,
      to: toEmail,
      subject: 'Verify your CineStream Account',
      text: `Your verification code is: ${token}. It expires in 15 minutes.`,
      html: `<b>Your verification code is: ${token}</b><br/>It expires in 15 minutes.`,
    });
    console.log(`Real email sent to ${toEmail}`);
  } else {
    // Fallback to ethereal if no .env config exists
    console.warn("⚠️ GMAIL_USER and GMAIL_PASS are not set in .env.local! Falling back to test email system.");
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"CineStream Auth" <noreply@cinestream.com>',
      to: toEmail,
      subject: 'Verify your CineStream Account',
      text: `Your verification code is: ${token}. It expires in 15 minutes.`,
      html: `<b>Your verification code is: ${token}</b><br/>It expires in 15 minutes.`,
    });

    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    console.log('Verification OTP:', token); // For easy local testing
  }
}

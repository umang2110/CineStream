import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { findUserByEmail, updateUser } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.is_verified) {
      return NextResponse.json({ error: 'Account is already verified' }, { status: 400 });
    }

    const verification_token = crypto.randomInt(100000, 999999).toString();
    const token_expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    updateUser(email, { verification_token, token_expiry });

    try {
      await sendVerificationEmail(email, verification_token);
    } catch (e) {
      console.error("Failed to resend email", e);
    }

    return NextResponse.json({ message: 'Verification email resent successfully' });
  } catch (error) {
    console.error('Resend error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser, updateUser } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json({ error: 'Only Gmail addresses (@gmail.com) are allowed' }, { status: 400 });
    }

    const existingUser = findUserByEmail(email);
    if (existingUser && existingUser.is_verified) {
      return NextResponse.json({ error: 'Account already exists and is verified' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomInt(100000, 999999).toString();
    const token_expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    const username = name || email.split('@')[0];

    if (existingUser) {
      // Overwrite unverified user
      updateUser(email, { password_hash, verification_token, token_expiry });
    } else {
      createUser({
        email: email.toLowerCase(),
        name: username,
        password_hash,
        is_verified: false,
        verification_token,
        token_expiry
      });
    }

    try {
      await sendVerificationEmail(email, verification_token);
    } catch (e) {
      console.error("Failed to send email", e);
    }

    return NextResponse.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

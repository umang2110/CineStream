import { NextResponse } from 'next/server';
import { findUserByEmail, updateUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, token } = await request.json();

    if (!email || !token) {
      return NextResponse.json({ error: 'Email and token are required' }, { status: 400 });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.is_verified) {
      return NextResponse.json({ error: 'Email is already verified' }, { status: 400 });
    }

    if (user.verification_token !== token) {
      return NextResponse.json({ error: 'Invalid verification token' }, { status: 400 });
    }

    if (user.token_expiry && Date.now() > user.token_expiry) {
      return NextResponse.json({ error: 'Verification token has expired' }, { status: 400 });
    }

    // Mark as verified
    await updateUser(email, { 
      is_verified: true, 
      verification_token: undefined, 
      token_expiry: undefined 
    });

    return NextResponse.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

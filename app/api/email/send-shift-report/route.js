import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateShiftClosureEmail } from '@/utils/emailTemplates';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  try {
    const { shiftData, transactions, recipientEmail } = await request.json();

    if (!resend) {
      console.warn('Resend API key not configured - skipping email');
      return NextResponse.json({ success: false, error: 'Email not configured' });
    }

    const toEmail = recipientEmail || process.env.BUSINESS_EMAIL;
    if (!toEmail) {
      return NextResponse.json({ success: false, error: 'No recipient email configured' }, { status: 400 });
    }

    const html = generateShiftClosureEmail(shiftData, transactions || []);

    const date = shiftData?.date
      ? new Date(shiftData.date).toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });

    const subject = `📊 Laporan Shift ${shiftData?.shiftNumber ?? ''} - ${date}`;

    const { data, error } = await resend.emails.send({
      from: `${process.env.BUSINESS_NAME || 'CakapBayar'} <noreply@resend.dev>`,
      to: toEmail,
      subject,
      html,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, emailId: data.id });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


/**
 * Email Integration Service
 * 
 * Handles email sending functionality.
 * For MVP, this simulates email sending. In production, integrate with
 * SendGrid, Mailgun, or use Supabase Edge Functions.
 */

import { markEmailAsSent, saveEmailReplyDraft } from './emailService';

/**
 * Send an email
 * 
 * @param emailId - ID of the email to send
 * @param replyContent - Content of the reply
 * @param recipientEmail - Recipient email address
 * @returns Promise that resolves when email is sent
 * 
 * @example
 * ```typescript
 * await sendEmail(emailId, replyContent, 'recipient@example.com');
 * ```
 */
export const sendEmail = async (
  emailId: string,
  replyContent: string,
  recipientEmail: string
): Promise<void> => {
  try {
    // Save reply draft first
    await saveEmailReplyDraft(emailId, replyContent);

    // TODO: In production, integrate with actual email service
    // For MVP, we'll simulate sending by marking as sent in database
    // 
    // Example integration:
    // const response = await fetch('/api/send-email', {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     to: recipientEmail,
    //     subject: email.subject,
    //     body: replyContent,
    //   }),
    // });
    // 
    // if (!response.ok) throw new Error('Failed to send email');

    // For now, just mark as sent in database
    await markEmailAsSent(emailId);

    console.log(`Email sent to ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send email via Supabase Edge Function
 * 
 * This requires a Supabase Edge Function to be deployed.
 * See supabase/functions/send-email/ for the function implementation.
 */
export const sendEmailViaEdgeFunction = async (
  emailId: string,
  replyContent: string,
  recipientEmail: string,
  subject: string
): Promise<void> => {
  try {
    // Save reply draft first
    await saveEmailReplyDraft(emailId, replyContent);

    // Call Supabase Edge Function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        to: recipientEmail,
        subject: subject,
        body: replyContent,
        emailId: emailId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send email: ${error}`);
    }

    // Mark as sent in database
    await markEmailAsSent(emailId);
  } catch (error) {
    console.error('Error sending email via edge function:', error);
    throw error;
  }
};











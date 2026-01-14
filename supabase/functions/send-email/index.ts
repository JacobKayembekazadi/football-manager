/**
 * Supabase Edge Function: send-email
 *
 * Sends emails using an email service provider.
 * - Includes CORS protection and rate limiting
 * - Logs email sending for audit
 *
 * To enable actual sending, configure RESEND_API_KEY or similar.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  getCorsHeaders,
  handleCorsPreflightRequest,
  corsJsonResponse,
  corsErrorResponse,
} from '../_shared/cors.ts';
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitExceededResponse,
  addRateLimitHeaders,
  RATE_LIMITS,
} from '../_shared/rateLimit.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const authHeader = req.headers.get('Authorization') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Get user for rate limiting
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    // Check rate limit
    const rateLimitKey = getRateLimitKey(req, userId, 'send-email');
    const rateLimitResult = checkRateLimit(rateLimitKey, RATE_LIMITS.SEND_EMAIL);

    if (!rateLimitResult.allowed) {
      return rateLimitExceededResponse(rateLimitResult, corsHeaders);
    }

    const { to, subject, body, emailId } = await req.json();

    if (!to || !subject || !body) {
      return corsJsonResponse(
        { error: 'Missing required fields: to, subject, body' },
        req,
        400
      );
    }

    // Check if Resend is configured
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (RESEND_API_KEY) {
      // Send actual email via Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('EMAIL_FROM') || 'noreply@pitchside.ai',
          to: [to],
          subject: subject,
          html: body,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send email via Resend: ${errorText}`);
      }
    } else {
      // Log email for development (simulate sending)
      console.log('Email would be sent (RESEND_API_KEY not configured):', {
        to,
        subject,
        body: body.substring(0, 100) + '...',
        emailId,
      });
    }

    // Update email status in database
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    if (emailId) {
      await supabaseService
        .from('inbox_emails')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', emailId);
    }

    // Add rate limit headers to successful response
    const responseHeaders = addRateLimitHeaders(
      { ...corsHeaders, 'Content-Type': 'application/json' },
      rateLimitResult
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: responseHeaders }
    );
  } catch (error) {
    console.error('Error in send-email function:', error);
    return corsErrorResponse(error as Error, req, 500);
  }
});

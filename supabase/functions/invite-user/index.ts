import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const emailHtml = (link: string) => `
<div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #1a1a1a;">
  <p style="font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 32px;">Lachlan Carrick Mastering</p>
  <p style="font-size: 18px; font-weight: normal; margin-bottom: 16px;">You've been invited</p>
  <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 32px;">You've been invited to submit a mastering project. Click below to access your intake form.</p>
  <a href="${link}" style="display: inline-block; background: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; letter-spacing: 0.04em;">Get Started</a>
  <p style="font-size: 12px; color: #aaa; margin-top: 40px; line-height: 1.6;">If you weren't expecting this, you can safely ignore it.</p>
</div>`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verify the caller is the admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('No authorization header')

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) throw new Error('Invalid token')
    if (user.email !== Deno.env.get('ADMIN_EMAIL')) throw new Error('Unauthorized')

    const { email } = await req.json()
    if (!email) throw new Error('Email is required')

    const siteUrl = Deno.env.get('SITE_URL') ?? ''

    // Try magiclink first (existing users), fall back to invite (new users)
    let actionLink: string
    const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/` },
    })

    if (magicError) {
      // User doesn't exist yet — generate an invite link
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email,
        options: { redirectTo: `${siteUrl}/` },
      })
      if (inviteError) throw inviteError
      actionLink = inviteData.properties.action_link
    } else {
      actionLink = magicData.properties.action_link
    }

    // Send via Resend
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Lachlan Carrick Mastering <noreply@lachlan-carrick.com>',
        to: [email],
        subject: "You've been invited — Lachlan Carrick Mastering",
        html: emailHtml(actionLink),
      }),
    })

    if (!resendRes.ok) throw new Error('Failed to send email')

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

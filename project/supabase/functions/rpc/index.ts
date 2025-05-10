
// This edge function enables a stored procedure to update credit balance
// without requiring direct table access

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { user_id, amount } = await req.json()

    if (!user_id || amount === undefined) {
      return new Response(
        JSON.stringify({ error: 'user_id and amount are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // First get the current balance
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .select('credit_balance')
      .eq('id', user_id)
      .single()

    if (profileError) {
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Calculate new balance
    const currentBalance = profileData.credit_balance || 0
    const numericAmount = Number(amount)
    const newBalance = currentBalance + numericAmount

    // Update the user's credit balance
    const { data, error } = await supabaseClient
      .from('profiles')
      .update({ credit_balance: newBalance })
      .eq('id', user_id)
      .select()

    if (error) {
      return new Response(
        JSON.stringify({ error: 'Error updating credit balance' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ success: true, new_balance: newBalance }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { counter_id, is_handicapped } = body;

    if (!counter_id) {
      return NextResponse.json({ error: "Missing counter_id" }, { status: 400, headers: corsHeaders });
    }

    // Initialize Supabase admin client using env variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Calculate the correct next position in the queue
    const { data: maxPosData } = await supabase
      .from("tokens")
      .select("position")
      .eq("counter_id", counter_id)
      .eq("status", "waiting")
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const nextPosition = maxPosData ? maxPosData.position + 1 : 1;

    // 2. Fetch the counter's current wait time to apply to the token
    const { data: counterData } = await supabase
      .from("counters")
      .select("wait_minutes")
      .eq("id", counter_id)
      .single();
      
    const waitTime = counterData?.wait_minutes || 10;

    // 3. Insert the new token perfectly into the queue
    const { data: newToken, error: insertErr } = await supabase
      .from("tokens")
      .insert({
        counter_id,
        is_handicapped: !!is_handicapped,
        status: "waiting",
        position: nextPosition
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Return the perfectly formatted token back to the Voice Agent
    return NextResponse.json(newToken, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("Voice Agent API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

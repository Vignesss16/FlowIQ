import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // For hackathon demo, public inserts are fine

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Seeding realistic data...");

  // Seed queue_stats
  console.log("Updating queue_stats...");
  const { error: qsError } = await supabase.from('queue_stats').upsert({
    id: 1,
    waiting_count: 147,
    avg_wait: 24,
    growth_pct: 12,
    queue_velocity_pct: -8
  });
  if (qsError) console.error("queue_stats error:", qsError);

  // Seed counters
  console.log("Updating counters...");
  const counters = [
    { id: 'A', status: 'active', wait_minutes: 8 },
    { id: 'B', status: 'active', wait_minutes: 31 },
    { id: 'C', status: 'active', wait_minutes: 14 },
    { id: 'D', status: 'closed', wait_minutes: null }
  ];
  
  for (const c of counters) {
    const { error } = await supabase.from('counters').upsert(c);
    if (error) console.error(`Error inserting counter ${c.id}:`, error);
  }

  // Seed a bunch of realistic dummy tokens for visual density
  console.log("Inserting background dummy tokens...");
  const tokens = Array.from({ length: 20 }).map((_, i) => ({
    counter_id: i % 2 === 0 ? 'B' : (i % 3 === 0 ? 'C' : 'A'),
    wait_minutes: 10 + Math.floor(Math.random() * 25),
    status: 'waiting',
    position: i + 100
  }));

  const { error: tError } = await supabase.from('tokens').insert(tokens);
  if (tError) console.error("Error inserting tokens:", tError);

  console.log("Seeding complete! The app is now fully populated.");
}

seed();

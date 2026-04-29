import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  if (!url || !serviceRoleKey) {
    console.log('Worker not configured yet. Add Supabase environment variables to continue.');
    process.exit(0);
  }

  const supabase = createClient(url, serviceRoleKey);
  const { data, error } = await supabase
    .from('jurisdictions')
    .select('slug,name,county_name')
    .order('county_name');

  if (error) {
    console.error('Failed to query jurisdictions', error);
    process.exit(1);
  }

  console.log('Worker boot check successful. Jurisdictions loaded:', data?.length ?? 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

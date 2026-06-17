import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xwetkypysrlxbxezcymb.supabase.co';
const supabaseKey = 'sb_publishable_kAuWC2BwVMzfGuvtW1dYDA__9k4ExBG';

export const supabase = createClient(supabaseUrl, supabaseKey);

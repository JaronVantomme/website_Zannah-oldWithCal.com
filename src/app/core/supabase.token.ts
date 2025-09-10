// supabase.token.ts
import { InjectionToken } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export const SUPABASE_CLIENT = new InjectionToken('Supabase Client', {
  providedIn: 'root',
  factory: () => {
    return createClient(
      environment.supabaseConfig.url,
      environment.supabaseConfig.anonKey
    );
  }
});

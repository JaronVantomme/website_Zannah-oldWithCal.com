// safe-auth.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SafeSupabaseAuthService {
  constructor(private supabase: SupabaseService) {}

  private handleLockError<T>(promise: Promise<T>): Promise<T | null> {
    return promise.catch((error: any) => {
      if (error?.message?.includes('NavigatorLockAcquireTimeoutError')) {
        console.warn('[SafeAuth] Lock error genegeerd');
        return null;
      }
      throw error;
    });
  }

  async login(email: string, password: string) {
    return this.handleLockError(this.supabase.login(email, password));
  }

  async signUp(email: string, password: string) {
    return this.handleLockError(this.supabase.signUp(email, password));
  }

  async getAuthUser() {
    return this.handleLockError(this.supabase.getAuthUser());
  }

  async getUser() {
    return this.handleLockError(this.supabase.getUser());
  }
}

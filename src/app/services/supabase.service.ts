import { Session, SupabaseClient } from '@supabase/supabase-js';
import { Inject, Injectable } from '@angular/core';
import { User } from '../Models/user.model';
import { SUPABASE_CLIENT } from '../core/supabase.token';
import { UserStoreService } from './user-store.service';
import { NavigationService } from './navigation.service';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  // TODO: ZORGEN DAT ALLES MET DE authUser gebeurd, row security instellen zodat alles beveiligd is

constructor(private userStoreService: UserStoreService, @Inject(SUPABASE_CLIENT) private supabase: SupabaseClient, private navigationService: NavigationService) {}
  // ─────────────────────────────
  // 🔐 AUTH METHODS
  // ─────────────────────────────

  // Login met e-mail en wachtwoord
  async login(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  // Registreer een nieuwe gebruiker
  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({ email, password });
  }

  async resetPassword(email: string, redirectUrl: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
  
    if (error) {
      throw new Error(error.message);
    }
  }

  async getSession(): Promise<Session | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session;
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  // async getAuthUser() {
  //   const user = await this.userStoreService.authUser;
  //   if (user) return user;
  
  //   const { data: sessionData } = await this.supabase.auth.getSession();
  //   if (!sessionData.session) return null;
  
  //   const { data, error } = await this.supabase.auth.getUser();
  //   if (error || !data?.user) return null;
  
  //   return data.user;
  // }

  async getAuthUser() {
    const cachedUser = this.userStoreService.authUser;
    if (cachedUser) return cachedUser;
  
    let session = null;
  
    const { data: { session: currentSession } } = await this.supabase.auth.getSession();
    if (currentSession) session = currentSession;
    else {
      const { data: refreshed, error: refreshError } = await this.supabase.auth.refreshSession();
      if (refreshed?.session) session = refreshed.session;
    }
  
    if (!session) return null;
  
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data?.user) return null;
  
    return data.user;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);
  }

  async setSessionFromUrlFragment(fragment: string): Promise<void> {
    const params = new URLSearchParams(fragment ?? '');
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (!accessToken || !refreshToken) {
      throw new Error('Ongeldige of ontbrekende tokens in URL');
    }

    const { error } = await this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) {
      throw new Error('Fout bij instellen sessie: ' + error.message);
    }
  }

  // ─────────────────────────────
// 🚪 LOGOUT METHOD
// ─────────────────────────────
async logout(): Promise<void> {
  const { error } = await this.supabase.auth.signOut();
  if (error) {
    throw new Error('Uitloggen mislukt: ' + error.message);
  }

  // Clear de lokale stores
  this.userStoreService.clearAuthUser();
  this.userStoreService.clearUser();
  localStorage.removeItem('email')
  this.navigationService.navigateTo('home');
}



  // ─────────────────────────────
  // 📥 GET METHODS
  // ─────────────────────────────

  // Haal gebruikersprofiel uit eigen 'users' tabel
  async getUser() {
    const authUser = await this.getAuthUser()

    const { data: profile, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', await authUser.id)
      .single();

    if (error) throw error;
    return profile;
  }

  async getBookingCountForUser(): Promise<number> {
    const authUser = await this.getAuthUser();
    if (!authUser?.id) return 0;
  
    const { count, error } = await this.supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('userID', authUser.id)
      .neq('status', 'DELETED');
  
    if (error) {
      return 0;
    }
  
    return count ?? 0;
  }

  async getAllBookingsFromUser() {
    const authUser = await this.getAuthUser();
    if (!authUser?.id) return [];
  
    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('userID', authUser.id)
      .neq('status', 'DELETED');
  
    if (error && error.code !== 'PGRST116') {
      throw new Error('Fout bij ophalen bookings: ' + error.message);
    }
    
    return data ?? [];
  }


  async getBookingById(bookingID: string) {
    const authUser = await this.getAuthUser()

    const { data, error } = await this.supabase
      .from('bookings')
      .select('*')
      .eq('bookingID', bookingID)
      .eq('userID', authUser.id)
      .maybeSingle();
  
    if (error && error.code !== 'PGRST116') {
      throw new Error('Fout bij ophalen booking: ' + error.message);
    }
  
    return data || null;
  }




  // ─────────────────────────────
  // ➕ INSERT METHODS
  // ─────────────────────────────

  async insertUserProfile(user: Partial<User>) {
    return await this.supabase
      .from('users')
      .insert([user]);
  }

  async insertBooking(bookingData: any) {
    const authUser = await this.getAuthUser()

    const { data, error } = await this.supabase
      .from('bookings')
      .insert([{ ...bookingData, userID: authUser.id }])
      .select()
      .single();

    if (error) throw new Error('Fout bij opslaan booking: ' + error.message);

    return data;
  }

  async updateBooking(bookingID: string, booking: any) {
    const authUser = await this.getAuthUser();
    
    const { data, error } = await this.supabase
      .from('bookings')
      .update(booking)
      .eq('bookingID', bookingID)
      .eq('userID', authUser.id)
      .select('*')
      .maybeSingle();
  
    if (error) throw new Error('Fout bij updaten booking: ' + error.message);
  
    return data;
  }
  




  // ─────────────────────────────
  // ✏️ UPDATE METHODS
  // ─────────────────────────────

  // Werk een profiel bij op basis van user ID
  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select();
      return { data, error };
    } catch (error) {
      return { error };
    }
  }




  // ─────────────────────────────
  // 🗑️ DELETE METHODS
  // ─────────────────────────────

  // Verwijder gebruikersprofiel op basis van ID
  async deleteUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);
    return { data, error };
  }

  
}

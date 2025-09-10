import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword } from 'firebase/auth';
import { NavigationService } from './navigation.service';
import { filter, first, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { collection, doc, getDoc, getDocs, getFirestore } from 'firebase/firestore';
import { User } from '../Models/user.model';
import { SupabaseService } from './supabase.service';
import { UserStoreService } from './user-store.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  constructor(private navigationService: NavigationService, private supabaseService: SupabaseService, private userStoreService: UserStoreService) { 
    // initializeApp(environment.firebaseConfig);
  }

  async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await this.supabaseService.login(email, password);
    await this.userStoreService.setAuthUser(data.user)

    if (error) throw error;
    
    if (!data.user) return null;
  
    const profile = await this.supabaseService.getUser();

    this.userStoreService.setUser(profile)
    localStorage.setItem('email', profile.email);
  
    return profile;
  }
  
  async register(email: string, password: string, firstName: string, lastName: string, phoneNumber: string) {
    const { data, error } = await this.supabaseService.signUp(email, password);
    await this.userStoreService.setAuthUser(data.user)

    if (error) throw error;
  
    const user = data.user;
    if (!user) throw new Error('Registratie is mislukt.');
  
    const profile: User = {
      id: user.id,
      email,
      firstName: firstName,
      lastName: lastName,
      phoneNumber: phoneNumber
    };
  
    const { error: insertError } = await this.supabaseService.insertUserProfile(profile);
    
    this.userStoreService.setUser(profile)
    if (insertError) throw insertError;
  
    return user;
  }

  async forgotPassword(email: string) {
    await this.supabaseService.resetPassword(
      email,
      `${environment.url}/reset-password`
    );
  }

  // isAuthenticated(): boolean {
  //   return this.userStoreService.authUser !== null;
  // }

  // async isAuthenticated(): Promise<boolean> {
  //   if (this.userStoreService.authUser) return true;
  //   if (this.userStoreService.authState === 'unauthenticated') return false;
  
  //   return new Promise<boolean>((resolve) => {
  //     const sub = this.userStoreService.authState$.subscribe((state) => {
  //       if (state !== 'loading') {
  //         sub.unsubscribe();
  //         resolve(state === 'authenticated');
  //       }
  //     });
  //   });
  // }

  async isAuthenticated(): Promise<boolean> {
    if (this.userStoreService.authUser) return true;
    if (this.userStoreService.authState === 'unauthenticated') return false;
  
    const state = await this.userStoreService.authState$
      .pipe(
        filter((s) => s !== 'loading'),
        first()
      )
      .toPromise();
  
    return state === 'authenticated';
  }

  // async isAdministrator(): Promise<boolean> {
  //   const user = this.userStoreService.user;
  //   if (user) return this.checkAdmin(user);
  
  //   return new Promise<boolean>((resolve) => {
  //     let sub: any;
  //     sub = this.userStoreService.userState$.subscribe((state) => {
  //       if (state !== 'loading') {
  //         sub.unsubscribe();
  //         const loadedUser = this.userStoreService.user;
  //         resolve(this.checkAdmin(loadedUser));
  //       }
  //     });
  //   });
  // }

  async isAdministrator(): Promise<boolean> {
    const user = this.userStoreService.user;
    if (user) return this.checkAdmin(user);
  
    await this.userStoreService.userState$
      .pipe(
        filter((s) => s !== 'loading'),
        first()
      )
      .toPromise();
  
    const loadedUser = this.userStoreService.user;
    return this.checkAdmin(loadedUser);
  }
  
  public checkAdmin(user: any | null): boolean {
    if (!user) return false;
      
    if ((environment.validEmail === user.email && environment.validUid === user.id) ||(environment.devValidEmail === user.email && environment.devValidUid === user.id)) {
      return true;
    }
    return false;
  }

  // isAdministrator() {
  //   const user = JSON.parse(localStorage.getItem('user') as string);

  //   if (user && environment.validEmail === user.email && environment.validUid === user.id) {
  //     return true;
  //   } else {
  //     if (user && environment.devValidEmail === user.email && environment.devValidUid === user.id)  {
  //       return true;
  //     } else {
  //       return false;
  //     }
  //   }
  // }

  // async isAdministrator(): Promise<boolean> {
  //   if (this.userStoreService.user) return true;
  //   if (this.userStoreService.userState === 'unauthenticated') return false;
  
  //   return new Promise<boolean>((resolve) => {
  //     const sub = this.userStoreService.authState$.subscribe((state) => {
  //       if (state !== 'loading') {
  //         sub.unsubscribe();
  //         resolve(state === 'authenticated');
  //       }
  //     });
  //   });
  // }

  // async isAdministrator(): Promise<boolean> {
  //   const isAuth = await this.isAuthenticated();
  //   if (!isAuth) return false;
  
  //   const user = this.userStoreService.user ?? {}
  
  //   if (!user) return false;
  
  //   if (environment.validEmail === user.email && environment.validUid === user.id) return true;
  //   if (environment.devValidEmail === user.email && environment.devValidUid === user.id) return true;
  
  //   return false;
  // }
}
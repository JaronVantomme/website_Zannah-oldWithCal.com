import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';
export type UserState = 'loading' | 'loaded' | 'empty';


@Injectable({ providedIn: 'root' })
export class UserStoreService {
  private userSubject = new BehaviorSubject<any | null>(null);
  private authUserSubject = new BehaviorSubject<any | null>(null);

  private userStateSubject = new BehaviorSubject<UserState>('loading');
  private authStateSubject = new BehaviorSubject<AuthState>('loading');

  user$ = this.userSubject.asObservable();
  userState$ = this.userStateSubject.asObservable();

  authUser$ = this.authUserSubject.asObservable();
  authState$ = this.authStateSubject.asObservable();

  constructor() {}

  get authUser() {
    return this.authUserSubject.value;
  }

  setAuthUser(authUser: any | null) {
    this.authUserSubject.next(authUser);
    this.authStateSubject.next(authUser ? 'authenticated' : 'unauthenticated');
  }

  clearAuthUser() {
    this.authUserSubject.next(null);
    this.authStateSubject.next('unauthenticated');
  }

  get user() {
    return this.userSubject.value;
  }

  setUser(user: any | null) {
    this.userSubject.next(user);
    this.userStateSubject.next(user ? 'loaded' : 'empty');

  }

  clearUser() {
    this.userSubject.next(null);
    this.userStateSubject.next('empty');
  }

  get authState(): AuthState {
    return this.authStateSubject.value;
  }

  setLoading() {
    this.authStateSubject.next('loading');
  }

  get userState(): UserState {
    return this.userStateSubject.value;
  }

  setUserLoading() {
    this.userStateSubject.next('loading');
  }

  // TODO: zorgen dat hij opslaat of hij loading is of loaded zodat ik dat kan ophalen met await voor adminAuthGuard

}
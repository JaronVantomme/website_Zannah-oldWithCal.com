import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './view/header/header.component';
import { FooterComponent } from './view/footer/footer.component'; 
import { ToastComponent } from './components/toast/toast.component';
import { BirthdayModalComponent } from './components/birthday-modal/birthday-modal.component';
import { SessionExpiredModalComponent } from './components/session-expired/session-expired.component';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { environment } from '../environments/environment';
import { SupabaseService } from './services/supabase.service';
import { UserStoreService } from './services/user-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, ToastComponent, HeaderComponent, FooterComponent, 
    CommonModule, BirthdayModalComponent, SessionExpiredModalComponent
  ],
  template: `
  <div class="flex flex-col min-h-screen">
    <app-toast></app-toast>
    <app-birthday-modal *ngIf="isDashboardOpen && birthDate" [birthDate]="birthDate"></app-birthday-modal>
    <app-header *ngIf="!isDashboardOpen"></app-header>
    <div class="flex-1 bg-background-dark-0">
      <router-outlet></router-outlet>
    </div>    
    <app-footer *ngIf="!isDashboardOpen"></app-footer>

    <app-session-expired-modal *ngIf="showSessionExpired" (close)="showSessionExpired = false"></app-session-expired-modal>
  </div>
  `,
})
export class AppComponent implements OnInit {
  title = 'website_zannah';
  isDashboardOpen = false;
  birthDate: null | string = null;
  showSessionExpired = false;

  private lastTouch = 0;
  private handler = (event: TouchEvent) => {
    const now = Date.now();
    if (now - this.lastTouch <= 300) event.preventDefault();
    this.lastTouch = now;
  };

  constructor(private router: Router, private supabaseService: SupabaseService, private userStore: UserStoreService) {}

  async ngOnInit(): Promise<void> {
    this.birthDate = environment.birthDay;
    this.checkDashboardRoute();

    // initieel checken
    const email = localStorage.getItem('email')
    if (email) {
      const authUser = await this.supabaseService.getAuthUser()
      if (authUser) {
        await this.userStore.setAuthUser(authUser);
        await this.userStore.setUser(await this.supabaseService.getUser());
      } else {
        this.userStore.clearAuthUser()
        this.userStore.clearUser();
        this.showSessionExpired = true;
      } 
    } else {
      this.userStore.clearAuthUser()
      this.userStore.clearUser();
    }
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkDashboardRoute();
      });

    document.addEventListener('touchend', this.handler as EventListener, { passive: false });
  }

  private checkDashboardRoute(): void {
    this.isDashboardOpen = this.router.url.includes('home-admin');
  }

  ngOnDestroy() {
    document.removeEventListener('touchend', this.handler as EventListener);
  }
}
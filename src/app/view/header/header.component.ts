import { Component, OnInit } from '@angular/core';
import { ScrollService } from '../../services/scroll.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from './../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';
import { UserStoreService } from '../../services/user-store.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnInit {
  public menuOpen = false;
  public buisnessName: string = environment.buisnessName
  private $unsubscribe = new Subject<void>();
  public isLoggedIn: boolean = false
  private user: any;

  constructor(
    private router: Router,
    private scrollService: ScrollService,
    private userStoreService: UserStoreService
  ) {}

  ngOnInit() {
    this.userStoreService.user$.pipe(takeUntil(this.$unsubscribe)).subscribe(user => {
      if (user) {
        this.user = user
        this.isLoggedIn = true
      } else {
        this.isLoggedIn = false
      }
    });
  }

  ngOnDestroy() {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }

  scrollTo(anchor: string): void {
    this.menuOpen = false
    if (this.router.url === '/home') {
      this.scrollService.scrollToAnchor(anchor);
    } else {
      this.router.navigateByUrl('/home').then(() => {
        this.scrollService.scrollToAnchor(anchor);
      });
    }
  }

  navigateTo(path: string) {
    this.router.navigateByUrl(path)
  }

  mobileNavigateTo(path: string) {
    this.menuOpen = false
    this.router.navigateByUrl(path)
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  isAuthenticated(): boolean {
    const user = this.userStoreService.authUser;
    return user !== null;
  }

  isAdministrator() {
    const user = this.userStoreService.user;
    if (user && environment.validEmail === user.email && environment.validUid === user.uid) {
      return true;
    } else {
      if (user && environment.devValidEmail === user.email && environment.devValidUid === user.uid)  {
        return true;
      } else {
        return false;
      }
    }
  }

  getInitials(): string {
    return ((this.user?.firstName?.charAt(0) ?? '') + (this.user?.lastName?.charAt(0) ?? '')).toUpperCase();
  }

}

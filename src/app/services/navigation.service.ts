import { Injectable } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private router: Router) {}

  navigateTo(route: string, extras?: NavigationExtras) {
    if (route === 'services') {
      this.router.navigate(['/home'], { fragment: 'services', ...extras });
    } else {
      this.router.navigate([route], extras).then(() => this.scrollToTop());
    }
  }

  private scrollToTop() {
    window.scrollTo(0, 0);
  }
}

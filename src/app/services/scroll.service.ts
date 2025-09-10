import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class ScrollService {

  constructor(private router: Router) {}

  scrollToAnchor(anchor: string): void {
    if (anchor === 'welkom') {
      this.router.navigateByUrl('/home').then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    } else {
      const element = document.getElementById(anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
}

import { Component } from '@angular/core';
import { ScrollService } from '../../services/scroll.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.css'
})
export class NotFoundPageComponent {
  
  constructor(
    private router: Router,
    private scrollService: ScrollService
  ) {}

  scrollTo(anchor: string): void {
    this.router.navigateByUrl('/home').then(() => {
      this.scrollService.scrollToAnchor(anchor);
    });  
  }
}

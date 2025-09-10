import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ScrollService } from '../../services/scroll.service';
import { environment } from './../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  public buisnessName: string = environment.buisnessName
  public phoneNumber: string = environment.phoneNumber;
  public address: string = environment.address;
  public footerAddress = environment.footerAddress;
  // public facebookLink: string = environment.facebookLink;
  public instagramLink: string = environment.instagramLink;


  constructor(
    private router: Router,
    private scrollService: ScrollService
  ) {}

  scrollTo(anchor: string): void {
    if (this.router.url === '/home') {
      this.scrollService.scrollToAnchor(anchor);
    } else {
      this.router.navigateByUrl('/home').then(() => {
        this.scrollService.scrollToAnchor(anchor);
      });
    }
  }

  openAddressPage(address: string): void {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  }
  
}

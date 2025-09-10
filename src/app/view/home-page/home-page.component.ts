import { CommonModule, ViewportScroller } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ScrollService } from '../../services/scroll.service';
import { environment } from './../../../environments/environment';
import { AuthenticationService } from '../../services/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ToastService } from '../../services/toaster.service';
import { UserStoreService } from '../../services/user-store.service';
import { Subject, takeUntil } from 'rxjs';
import { CalendarPopupComponent } from '../../components/calendar-popup/calendar-popup.component';

interface Order {
  name: string;
  price: number;
  duration: string;
  quantity: number;
}

interface Section {
  sectionName: string;
  title: string;
  isVisible: boolean;
  items: Order[];
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [LucideAngularModule, CommonModule, CalendarPopupComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.css'
})
export class HomePageComponent implements OnInit {
  public totalPrice: number = 0
  public totalDuration: string = '0u00'
  public selectedService: string = ''
  public ordersMobileCount: string = ''
  public isExpanded = false;
  public showLoginPoppup = false
  
  public calendarURL: string = environment.calendarURL;
  public longitude: string = environment.longitude;
  public latitude: string = environment.latitude;
  public mapUrl: SafeResourceUrl = '';
  public address: string = environment.address;
  public addressLines: any = environment.footerAddress.split(', ');
  
  private filteredSections: Section[] = [];

  public phoneNumber: string = environment.phoneNumber;
  public email: string = environment.email;
  public isModalOpen: boolean = false
  public bookingData: { eventTypeSlug: string, userName: string, title: string, price: number, bookingID: string | null} = { eventTypeSlug: '', userName: '', title: '', price: 0, bookingID: null }

  public sections: Section[] = [
    {
      sectionName: 'Haar',
      title: 'Heren & Kinderen',
      isVisible: true,
      items: [
        { name: 'Knippen man', price: 15, duration: '0:30', quantity: 1 },
        { name: 'Knippen kind t.m 16j', price: 13, duration: '0:30', quantity: 1 }
      ]
    },
    {
      sectionName: 'Haar',
      title: 'Dames - Kleuring & Styling',
      isVisible: false,
      items: [
        { name: 'Bijwerking uitgroei', price: 35, duration: '0:45', quantity: 1 },
        { name: 'Bijwerking uitgroei + lengtes', price: 43, duration: '1:00', quantity: 1 },
        { name: 'Balyage uitgroei', price: 45, duration: '1:15', quantity: 1 },
        { name: 'Balyage volledig', price: 55, duration: '1:30', quantity: 1 },
        { name: 'Foliage uitgroei', price: 45, duration: '1:15', quantity: 1 },
        { name: 'Foliage volledig', price: 55, duration: '1:30', quantity: 1 },
        { name: 'Toner', price: 15, duration: '0:30', quantity: 1 }
      ]
    },
    {
      sectionName: 'Haar',
      title: 'Dames - Knippen & Styling',
      isVisible: false,
      items: [
        { name: 'Knippen vrouw', price: 15, duration: '0:45', quantity: 1 },
        { name: 'Losdrogen', price: 3, duration: '0:15', quantity: 1 },
        { name: 'Brushen', price: 15, duration: '0:45', quantity: 1 },
        { name: 'Krullen', price: 3, duration: '0:30', quantity: 1 },
        { name: 'Opstelen', price: 20, duration: '0:45', quantity: 1 }
      ]
    },
    {
      sectionName: 'Nagels',
      title: 'Gel - Bijwerking',
      isVisible: true,
      items: [
        { name: 'Bijwerking ander salon', price: 45, duration: '1:00', quantity: 1 },
        { name: 'Bijwerking natuurlijke nagel', price: 43, duration: '1:00', quantity: 1 }
      ]
    },
    {
      sectionName: 'Nagels',
      title: 'Gel - Nieuwe set',
      isVisible: false,
      items: [
        { name: 'Nieuwe set natuurlijke nagel', price: 43, duration: '1:15', quantity: 1 },
        { name: 'Nieuwe set verlenging', price: 50, duration: '1:30', quantity: 1 }
      ]
    },
    {
      sectionName: 'Nagels',
      title: 'Gel - Overige',
      isVisible: false,
      items: [
        { name: 'Verwijderen set', price: 15, duration: '0:30', quantity: 1 },
        { name: 'Biab', price: 25, duration: '1:00', quantity: 1 },
        { name: 'Gelish', price: 23, duration: '0:45', quantity: 1 }
      ]
    }
  ];
  
  private $unsubscribe = new Subject<void>();
  
  public orders: Order[] = [];
  private user: any;


  constructor(private scrollService: ScrollService, private authentication: AuthenticationService, private router: Router, private sanitizer: DomSanitizer, private route: ActivatedRoute, private scroller: ViewportScroller, private toastr: ToastService, private userStoreService: UserStoreService) {}
  
  ngOnInit(): void {
    this.selectedService = this.sections[0].sectionName
    const mapUrl = `https://hilarious-centaur-3b92d5.netlify.app/?lat=${this.latitude}&long=${this.longitude}&color=EFCEC9&outline=B9677D`;
    this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(mapUrl);

    this.route.fragment.subscribe(fragment => {
      if (fragment) setTimeout(() => this.scroller.scrollToAnchor(fragment));
    });

    this.userStoreService.user$.pipe(takeUntil(this.$unsubscribe)).subscribe(user => {
      if (user) {
        this.user = user
      } else {
        this.user = null
      }
    });
  }

  
  ngOnDestroy() {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }

  scrollTo(anchor: string): void {
    this.scrollService.scrollToAnchor(anchor);
  }


  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }

  toggleSection(index: number): void {
    this.filteredSections.forEach((section, i) => {
      if (i === index) {
        section.isVisible = !section.isVisible;
      } else {
        section.isVisible = false;
      }
    });
  }

  getUniqueSectionNames(): string[] {
    const sectionNamesSet = new Set<string>();
  
    this.sections.forEach(section => {
      sectionNamesSet.add(section.sectionName);
    });
  
    return Array.from(sectionNamesSet);
  }

  filterNagelsSections(sections: Section[]): Section[] {
    this.filteredSections = sections.filter(section => section.sectionName === this.selectedService);
    return this.filteredSections
  }

  changeServices(services: string) {
    this.selectedService = services
  }

  getOrderSummary() {
    const count = this.orders.reduce((total, order) => total + order.quantity, 0);
    const serviceWord = count === 1 ? 'service' : 'services';
    this.ordersMobileCount = `${count} geselecteerde ${serviceWord}`;
  }

  formatTime(inputTime: string): string {
    try {
      const [hours, minutes] = inputTime.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours >= 24 || minutes < 0 || minutes >= 60) {
        throw new Error('Invalid time format');
      }
  
      if (hours === 0) {
        return `${minutes} min`;
      } else {
        const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        return `${hours}u${formattedMinutes}`;
      }
    } catch (err) {
      return inputTime;
    }
  }  

  togglePopup() {
    this.showLoginPoppup = !this.showLoginPoppup
  }

  navigateTo(path: string) {
    if (path === '/login-booking') {
      this.router.navigate(['/login'], { queryParams: { redirectTo: 'services' } });
    } else {
      this.router.navigateByUrl(path)
    }
  }

  async selectItem(item: Order): Promise<void> {
    if(await this.authentication.isAuthenticated()) {
      this.showLoginPoppup = false

      const existingItem = this.orders.find(o => o.name === item.name);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        this.orders.push({ ...item, quantity: 1 });
      }

      this.calculateTotal();
      this.getOrderSummary()
    } else {
      this.showLoginPoppup = true
    }
  }

  calculateTotal(): void {
    let totalMinutes = 0;
    let totalPrice = 0;

    this.orders.forEach(order => {
      totalPrice += order.price * order.quantity;
      const [hours, minutes] = order.duration.split(':').map(Number);
      totalMinutes += (hours * 60 + minutes) * order.quantity;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    this.totalDuration = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
    this.totalPrice = totalPrice;
  }

  updateQuantity(order: Order, change: number): void {
    order.quantity += change;

    if (order.quantity < 0) {
      order.quantity = 0;
    }

    if (order.quantity === 0) {
      this.removeOrder(order);
      this.isExpanded = false
    }

    this.calculateTotal();
    this.getOrderSummary()
  }

  removeOrder(order: Order): void {
    const index = this.orders.indexOf(order);
    if (index !== -1) {
      this.orders.splice(index, 1);
    }
  }

  getCalendarID(totalDuration: string): string {
    const [hours, minutesStr] = totalDuration.split(':');
    const minutes = parseInt(minutesStr);

    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    const calendarID = `${formattedHours}-${formattedMinutes}`;

    return this.calendarURL + calendarID;
  }

  openBookingModal() {
    const [hours, minutesStr] = this.totalDuration.split(':');
    const minutes = parseInt(minutesStr);

    const totalMinutes = parseInt(hours) * 60 + minutes;
    const maxMinutes = environment.maxBookingHours * 60;

    if (totalMinutes > maxMinutes) {
      this.toastr.show({type: 'error', title: `Maximale duur overschreden`, text: `Je kan maximaal ${environment.maxBookingHours} uur achter elkaar boeken.`});
      return;
    }

    const formattedHours = hours.padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');

    const calendarID = `${formattedHours}-${formattedMinutes}`;

    this.bookingData = {
      eventTypeSlug: calendarID,
      userName: environment.username,
      title: this.generateTitle(),
      price: this.totalPrice,
      bookingID: null
    }
    
    this.isModalOpen = true
  }
  
  generateName(): string {
    return this.user ? `${this.user.firstName} ${this.user.lastName}` : '';
  }
  
  generateEmail(): string {
    return this.user ? `${this.user.email}` : '';
  }
  
  generatePhone(): string {
    return this.user ? `${this.user.phoneNumber}` : '';
  }

  generateTitle(): string {
    let totalPrice = 0;
    let servicesDetails = '';

    this.orders.forEach(order => {
        totalPrice += order.price * order.quantity;
        servicesDetails += `${order.quantity} x ${order.name}, \n`;
    });

    return `${servicesDetails}`;
}

  getCalConfig(): string {
    const config = {
      layout: "month_view",
      name: this.generateName(),
      email: this.generateEmail(),
      phone: this.generatePhone(),
      title: this.generateTitle()
    };
    return JSON.stringify(config);
  }

  openAddressPage(address: string): void {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  }

  callPhoneNumber(phoneNumber: string): void {
    const telUrl = `tel:${phoneNumber}`;
    window.open(telUrl, '_self');
  }

  sendEmail(emailAddress: string): void {
    const mailtoUrl = `mailto:${emailAddress}`;
    window.open(mailtoUrl, '_self');
  }
}

import { Component, OnInit } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { AuthenticationService } from '../../services/authentication.service';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { User } from '../../Models/user.model';
import { ToastService } from '../../services/toaster.service';
import { UserStoreService } from '../../services/user-store.service';
import { firstValueFrom, Subject, takeUntil } from 'rxjs';
import { NavigationService } from '../../services/navigation.service';
import { CalComService } from '../../services/cal-com.service';
import { SafeUrlPipe } from '../../pipes/safeUrl.pipe';
import { CalendarPopupComponent } from '../../components/calendar-popup/calendar-popup.component';

interface Appointment {
  user: string;
  eventTypeSlug: string;
  bookingID: string;
  rescheduleID: string;
  rescheduledBy: string;
  title: string;
  day: string;
  date: string;
  month: string;
  year: string;
  time: string;
  services: string[];
  address: string;
  startTime: Date;
  endTime: Date;
  duration: number;
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SafeUrlPipe, CalendarPopupComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.css'
})
export class ProfilePageComponent implements OnInit {
  public isRescheduleModalOpen: boolean = false;
  public rescheduleUrl: string = '';
  public buisnessName: string  = environment.buisnessName;
  public address: string = environment.address;
  public footerAddress: string = environment.footerAddress;
  public selectedService: string = 'bookingHistory'

  public profileForm: FormGroup;
  public user: User = new User()
  public name: string = '';
  public email: string = '';
  public showTooltip: boolean = false;
  public initialFormValues: any;
  public updateError: string = ''
  public today = new Date();
  public bookingCount: number = 0
  public bookingData: { eventTypeSlug: string, userName: string, title: string, price?: number, bookingID: string | null} = { eventTypeSlug: '', userName: '', title: '', price: 0, bookingID: null }

  private $unsubscribe = new Subject<void>();
  private appointments: Appointment[] = [];

  public minBookingDays: number = 2

  public isDeleteModalOpen: boolean = false;
  public appointmentToDelete: Appointment | null = null; 
  
  constructor(private authenticationService: AuthenticationService, private fb: FormBuilder, private supabaseService: SupabaseService, private toastr: ToastService, private userStoreService: UserStoreService, private navigationService: NavigationService, private calComService: CalComService) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, this.phoneNumberValidator]],
    });
  }

  async ngOnInit(): Promise<void> {
    this.minBookingDays = environment.minBookingDays
    this.user = this.userStoreService.user ?? {};
    this.initializeUserForm(this.user)

    await this.getBookingsCount()
    await this.loadBookings();

    this.userStoreService.user$.pipe(takeUntil(this.$unsubscribe)).subscribe(user => {
      if (user) {
        this.initializeUserForm(user)
      }
    });
  }

  ngOnDestroy() {
    this.$unsubscribe.next();
    this.$unsubscribe.complete();
  }

  initializeUserForm(user: any) {
    this.user = user
    this.initialFormValues = {
      firstName: this.user.firstName || '',
      lastName: this.user.lastName || '',
      phoneNumber: this.user.phoneNumber || ''
    };
    this.profileForm.patchValue(this.initialFormValues); 
  }

  async getBookingsCount() {
    this.bookingCount = await this.supabaseService.getBookingCountForUser()
  }  

  async loadBookings() {
    try {
      const authUser = await this.supabaseService.getAuthUser();
      if (!authUser?.id) return;
  
      const data = await this.supabaseService.getAllBookingsFromUser()
  
      this.appointments = (data || []).map(booking => {
        const start = new Date(booking.startTime);
        const end = new Date(booking.endTime);

        const services = booking.title 
          ? booking.title.split(',').map((s: any) => s.trim()).filter((s: any) => s) 
          : [];
  
        const dayNames = ['Zondag','Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag'];
        const months = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
  
        const duration = Math.round((end.getTime() - start.getTime()) / 60000);
  
        return {
          bookingID: booking.bookingID,
          user: booking.user,
          eventTypeSlug: booking.eventTypeSlug,
          rescheduleID: booking.rescheduleID,
          rescheduledBy: booking.rescheduledBy || booking.email,
          title: booking.title,
      
          day: dayNames[start.getDay()],
          date: start.getDate().toString(),
          month: months[start.getMonth()],
          year: start.getFullYear().toString(),
          time: `${this.formatBelgiumTime(start)} – ${this.formatBelgiumTime(end)}`,
          services,
          address: booking.location,
          startTime: start,
          endTime: end,
          duration: duration,
        };
      });
  
    } catch (err) {
      console.error('Error loading bookings', err);
    }
  }

  formatBelgiumTime(date: Date): string {
    const belgiumOffset = 0;
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const belgiumTime = new Date(utc + belgiumOffset * 60000);
  
    const hours = belgiumTime.getHours().toString().padStart(2, '0');
    const minutes = belgiumTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

  getDayName(dateString: string): string {
    const dayNames: { [key: number]: string } = {
      0: 'Sun',
      1: 'Mon',
      2: 'Tue',
      3: 'Wed',
      4: 'Thu',
      5: 'Fri',
      6: 'Sat'
    };
    const date = new Date(dateString);
    return dayNames[date.getDay()] || '';
  }
  
  getMonthName(monthIndex: number): string {
    const months = [
      'Januari','Februari','Maart','April','Mei','Juni',
      'Juli','Augustus','September','Oktober','November','December'
    ];
    return months[monthIndex] || '';
  }

  async openReschedule(booking: Appointment) {
    this.bookingData = { eventTypeSlug: booking.eventTypeSlug, userName: booking.user, title: booking.title, bookingID: booking.bookingID }
    this.isRescheduleModalOpen = true;
  }

  async deleteBooking(appointment: Appointment) {
    if (!confirm('Weet je zeker dat je deze afspraak wilt verwijderen?')) return;

    try {
      await firstValueFrom(this.calComService.deleteBooking(appointment.bookingID));

      await this.supabaseService.updateBooking(appointment.bookingID, { status: 'DELETED' });
      this.appointments = this.appointments.filter(a => a.bookingID !== appointment.bookingID);
      this.toastr.show({ type: 'success', title: 'Afspraak verwijderd!', text: 'De afspraak is succesvol verwijderd.' });

    } catch (err: any) {
      this.toastr.show({ type: 'error', title: 'Verwijderen mislukt', text: err?.message || 'Er is iets misgegaan bij het verwijderen van de afspraak.' });
    }
  }


  phoneNumberValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const phoneNumberPattern = /^\+32\d{8,9}$/;
    return phoneNumberPattern.test(control.value) ? null : { invalidPhoneNumber: true };
  }

  openAddressPage(address: string): void {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
  }

  getInitials(): string {
    return ((this.user.firstName?.charAt(0) ?? '') + (this.user.lastName?.charAt(0) ?? '')).toUpperCase();
  }  

  changeOption(option: string) {
    this.selectedService = option
  }

  async logout() {
    await this.supabaseService.logout();
  }

  onEmailClick() {
    this.showTooltip = true;
    setTimeout(() => this.showTooltip = false, 5000)
  }

  get sortedAppointments() {
    return this.appointments.slice().sort((a, b) => {
      return this.getAppointmentDate(b).getTime() - this.getAppointmentDate(a).getTime();
    });
  }

  async editProfile() {
    const currentFormValues = this.profileForm.value;
  
    if (this.profileForm.valid && !this.areValuesEqual(this.initialFormValues, currentFormValues)) {
      this.initialFormValues = { ...currentFormValues };
  
      try {
        const user = this.userStoreService.user ?? {};
  
        if (!user?.id) {
          this.updateError = 'Gebruiker niet gevonden.';
          return;
        }
  
        const { error, data } = await this.supabaseService.updateUserProfile(user.id, {
          firstName: currentFormValues.firstName,
          lastName: currentFormValues.lastName,
          phoneNumber: currentFormValues.phoneNumber,
          updatedAt: new Date()
        });
  
        if (error) {
          this.updateError = 'Bijwerken mislukt.';
          return;
        }

        if (data?.[0]) {
          await this.userStoreService.setUser(data[0])
          this.user = data[0]
          this.toastr.show({ type: 'success', title: `Profiel bijgewerkt!`, text: 'Je profiel is succesvol opgeslagen.'});
        } else this.updateError = 'Er is een fout opgetreden.';

        this.updateError = '';
      } catch (error) {
        this.updateError = 'Er is een fout opgetreden.';
      }
    }
  }

  getFullDate(appointment: any): string {
    const dayNames: { [key: string]: string } = {
      'Mon': 'Maandag',
      'Tue': 'Dinsdag',
      'Wed': 'Woensdag',
      'Thu': 'Donderdag',
      'Fri': 'Vrijdag',
      'Sat': 'Zaterdag',
      'Sun': 'Zondag',
      'Don': 'Donderdag',
    };
  
    const day = dayNames[appointment.day] || appointment.day;
    return `${day} ${appointment.date} ${appointment.month} ${appointment.year}`;
  }
  
  areValuesEqual(obj1: any, obj2: any): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  isPast(appointment: any): boolean {
    const appointmentDate = this.getAppointmentDate(appointment);
    return new Date() > appointmentDate;
  }

  isStartTimePast(appointment: any): boolean {
    return new Date() > new Date(appointment.startTime); 
  }

  getAppointmentDate(appointment: any): Date {
    const timeStart = appointment.time.split('–')[0].trim();
    const [hour, minute] = timeStart.split(':').map(Number);
  
    const months: { [key: string]: number } = {
      'Januari': 0,
      'Februari': 1,
      'Maart': 2,
      'April': 3,
      'Mei': 4,
      'Juni': 5,
      'Juli': 6,
      'Augustus': 7,
      'September': 8,
      'Oktober': 9,
      'November': 10,
      'December': 11,
    };
  
    return new Date(+appointment.year, months[appointment.month], +appointment.date, hour, minute);
  }

  goTo(location: string) {
    this.navigationService.navigateTo(location)
  }

  isAdmin(): boolean {
    return localStorage.getItem('email') === environment.validEmail || localStorage.getItem('email') === environment.devValidEmail
  }

  closePopup() {
    this.isRescheduleModalOpen = false
  }

  canModifyBooking(appointment: Appointment): boolean {
    if (!appointment.startTime) return false;
  
    const now = new Date();
    const startDate = new Date(appointment.startTime);
  
    const diffInMs = startDate.getTime() - now.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  
    return diffInDays >= this.minBookingDays;
  }

  openDeleteModal(appointment: Appointment) {
    this.appointmentToDelete = appointment;
    this.isDeleteModalOpen = true;
  }
  
  async confirmDelete() {
    if (!this.appointmentToDelete) return;
  
    try {
      await firstValueFrom(this.calComService.deleteBooking(this.appointmentToDelete.bookingID));
      await this.supabaseService.updateBooking(this.appointmentToDelete.bookingID, { status: 'DELETED' });
      this.appointments = this.appointments.filter(a => a.bookingID !== this.appointmentToDelete?.bookingID);
      this.toastr.show({ type: 'success', title: 'Afspraak verwijderd!', text: 'De afspraak is succesvol verwijderd.' });
    } catch (err: any) {
      this.toastr.show({ type: 'error', title: 'Verwijderen mislukt', text: err?.message || 'Er is iets misgegaan bij het verwijderen van de afspraak.' });
    } finally {
      this.closeDeleteModal();
    }
  }
  
  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.appointmentToDelete = null;
  }
}

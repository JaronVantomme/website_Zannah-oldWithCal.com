import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalComService } from '../../services/cal-com.service';
import { UserStoreService } from '../../services/user-store.service';
import { environment } from '../../../environments/environment'
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { Booking } from '../../Models/booking.model';
import { NavigationService } from '../../services/navigation.service';

@Component({
  selector: 'app-calendar-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calendar-popup.component.html',
  styleUrl: './calendar-popup.component.css'
})
export class CalendarPopupComponent {
  @Input() bookingData?: { eventTypeSlug: string, userName: string, title: string, price?: number, bookingID?: string | null};
  @Output() close = new EventEmitter<void>();
  
  public availableDays: { [date: string]: { start: string }[] } = {};  
  public Object = Object;
  public selectedDate: Date | null = null;  
  public timeFormat: '12' | '24' = '24';
  public monthDays: { date: Date | null, label: string }[] = [];
  public currentMonth: Date = new Date();
  public isLoading: boolean = false
  public minBookingDays: number = 2
  private maxBookingDays: number = 60;

  constructor(private calComService: CalComService, private userStoreService: UserStoreService, private router: Router, private supabaseService: SupabaseService, private navigationService: NavigationService) {}

  async ngOnInit(): Promise<void> {
    this.minBookingDays = environment.minBookingDays
    this.maxBookingDays = environment.maxBookingDays
    this.isLoading = true

    await this.calComService.getAvailableTimeSlots(this.bookingData?.eventTypeSlug as string, this.bookingData?.userName as string, this.minBookingDays, this.maxBookingDays).subscribe(
      (response) => {
        this.availableDays = response.data
        this.isLoading = false

        const availableDates = Object.keys(this.availableDays).map(d => this.parseLocalDate(d)).sort((a,b) => a.getTime() - b.getTime());

        if (availableDates.length > 0) {
          const firstAvailable = availableDates[0];
          this.currentMonth = new Date(firstAvailable.getFullYear(), firstAvailable.getMonth(), 1);
          this.generateMonthDays(this.currentMonth.getFullYear(), this.currentMonth.getMonth());
          this.selectedDate = firstAvailable;
        } else {
          this.selectedDate = null;
        }
      }
    )
  }

  private parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  hasAvailableDaysThisMonth(): boolean {
    return this.monthDays.some(day => day.date && this.isAvailable(day.date));
  }

  generateMonthDays(year: number, month: number) {
    this.monthDays = this.getMonthDays(year, month);
  }

  getMonthDays(year: number, month: number): { date: Date | null, label: string }[] {
    const days: { date: Date | null, label: string }[] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
  
    const startDay = firstDay.getDay(); 
    const emptyDays = (startDay === 0 ? 6 : startDay - 1); 
  
    for (let i = 0; i < emptyDays; i++) {
      days.push({ date: null, label: '' });
    }
  
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({ date, label: day.toString() });
    }
  
    return days;
  }

  isAvailable(date: Date): boolean {
    const key = this.formatDateKey(date);
    return this.availableDays.hasOwnProperty(key);
  }

  isSelected(date: Date): boolean {
    return this.selectedDate?.toISOString().split('T')[0] === date.toISOString().split('T')[0];
  }  

  formatSelectedDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('nl-NL', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  }

  selectDate(date: Date) {
    this.selectedDate = date;
  }

  formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  hasSlots(date: Date | null): boolean {
    if (!date) return false;
    const key = this.formatDateKey(date);
    return this.availableDays?.[key]?.length > 0;
  }

  async selectSlot(date: string, time: string) {
    this.isLoading = true;
    try {
      if (!date || !time) throw new Error('Date or time is invalid');
  
      const user = await this.userStoreService.user;
  
      if (!this.bookingData?.bookingID) {
        // CREATE BOOKING
        const createData = {
          start: new Date(time).toISOString(),
          attendee: {
            name: `${user.firstName} ${user.lastName}`,
            email: "zannahjavox@gmail.com",
            timeZone: "Europe/Amsterdam",
            language: "nl"
          },
          eventTypeSlug: this.bookingData?.eventTypeSlug,
          username: this.bookingData?.userName,
          bookingFieldsResponses: {
            customField: "customValue",
            phone: user.phoneNumber,
            title: this.bookingData?.title ?? 'Afspraak Zannahshoekje'
          },
          location: {
            type: "address",
            location: environment.address
          },
          metadata: {
            realCustomerEmail: user.email,
            customerUid: user.uid
          }
        };
  
        this.calComService.createBooking(createData).subscribe(
          async (res: any) => {
            const data = res.data;
            
            const newBooking = this.mapCalDataToBooking(data);
        
            await this.supabaseService.insertBooking(newBooking);  
            this.redirectToCompletedPage(newBooking, user, 'ADD');
          },
          (err) => console.error("Create booking error:", err)
        );        
      } else {
        // RESCHEDULE
        const rescheduleData = {
          start: new Date(time).toISOString(),
          rescheduledBy: user.email,
          reschedulingReason: "User requested reschedule"
        };
  
        this.calComService.rescheduleBooking(this.bookingData.bookingID, rescheduleData).subscribe(
          async (res: any) => {
            const data = res.data;
        
            const updatedBooking = this.mapCalDataToBooking(data);
        
            const updateData = {
              startTime: updatedBooking.startTime,
              endTime: updatedBooking.endTime,
              attendeeStartTime: updatedBooking.startTime,
              hostStartTime: updatedBooking.startTime,
              status: 'RESCHEDULE',
              bookingID: updatedBooking.bookingID,
              rescheduledBy: updatedBooking.rescheduledBy,
              formerTime: updatedBooking.formerTime
            };
        
            const oldBookingID = data.rescheduledFromUid || updatedBooking.bookingID;
        
            await this.supabaseService.updateBooking(oldBookingID, updateData);
        
            this.redirectToCompletedPage(updatedBooking, user, 'RESCHEDULE');
          },
          (err) => console.error("Reschedule booking error:", err)
        );               
      }
    } catch (error) {
      ''
    }
  }

  mapCalDataToBooking(data: any): Booking {
    const attendee = data.attendees?.[0] || {};
    const responses = data.bookingFieldsResponses || {};
    const metadata = data.metadata || {};

    const startLocal = this.toBelgiumTime(data.start);
    const endLocal = this.toBelgiumTime(data.end);

    const realEmail = metadata.realCustomerEmail ?? attendee.email ?? responses.email ?? '';
  
    return new Booking({
      bookingID: data.uid,
      user: data.hosts[0].username,
      attendeeName: attendee.name ?? responses.name ?? '',
      attendeeEmail: realEmail,
      attendeePhone: responses.phone ?? '',
      description: data.description ?? '',
      title: responses.title ?? data.title ?? '',
      location: data.location ?? responses.location ?? '',
      eventTypeSlug: data.eventType?.slug ?? '',
      type: data.eventTypeId?.toString() ?? '',
      hostName: data.hosts?.[0]?.name ?? '',
      attendeeStartTime: startLocal,
      hostStartTime: startLocal,
      startTime: startLocal,
      endTime: endLocal,
      name: attendee.name ?? responses.name ?? '',
      email: realEmail,
      phone: responses.phone ?? '',
      isEmbed: 'false',
      isSuccessBookingPage: 'true',
      slot: data.start,
      formerTime: '',
      rescheduleUid: '',
      rescheduledBy: data.rescheduledByEmail ?? '',
      status: data.rescheduledByEmail ? 'RESCHEDULE' : 'ADD',
      price: this.bookingData?.price ?? 0
    });
  }

  private toBelgiumTime(utcString: string): string {
    const date = new Date(utcString);  
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 19);;
  }
    
  private redirectToCompletedPage(booking: any, user: any, status: 'ADD' | 'RESCHEDULE' | 'DELETED') {
    const queryParams: any = {
      bookingID: booking.bookingID,
      user: booking.user,
      attendeeName: booking.attendeeName,
      email: booking.attendeeEmail,
      title: booking.title,
      location: booking.location,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status
    };
  
    this.navigationService.navigateTo('/home/completed', { queryParams });
  }  


  convertTo12Hour(time: string): string {
    const date = new Date(time);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  getSortedDates(): string[] {
    return Object.keys(this.availableDays).sort();
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.generateMonthDays(this.currentMonth.getFullYear(), this.currentMonth.getMonth());
  }
  
  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.generateMonthDays(this.currentMonth.getFullYear(), this.currentMonth.getMonth());
  }

  closeCalendar() {
    this.close.emit()
  }
  
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { CalBookingEvent } from '../../Models/calWebhookPayload.model';
import { Booking } from '../../Models/booking.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-completed-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './completed-page.component.html',
  styleUrl: './completed-page.component.css'
})
export class CompletedPageComponent implements OnInit {
  public bookingData: Booking = new Booking()

  constructor(private route: ActivatedRoute) {}
  
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const data = params as CalBookingEvent

      this.bookingData = new Booking({
        bookingID: data.bookingID ?? '',
        user: data.user ?? '',
        attendeeName: data.attendeeName ?? '',
        email: Array.isArray(data.email) ? data.email[0] : data.email ?? '',
        title: Array.isArray(data.title) ? data.title[0] : data.title ?? '',
        location: data.location ?? environment.address,
        startTime: data.startTime ?? '',
        endTime: data.endTime ?? '',
        status: data.status ?? 'ADD'
      });
    });
  }


  getServicesOutOfTitle(): string[] {
    const title = this.bookingData.title;
    const services = title ? title.split(',').map((service: string) => service.trim()) : [];
    return services.filter((service: string) => service.length > 0);
  }
  
  getDate(): string {
    if (this.bookingData.startTime) {
      const date = new Date(this.bookingData.startTime);
      
      const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
      const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
      
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const monthName = months[date.getMonth()];
    
      return `${dayName} ${day} ${monthName}`;
    } else return ''
  }
  
  getTime(): string {
    if (this.bookingData.startTime && this.bookingData.endTime) {
      const startDate = new Date(this.bookingData.startTime);
      const endDate = new Date(this.bookingData.endTime);
    
      const startHours = startDate.getHours().toString().padStart(2, '0');
      const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    
      const startTimeFormatted = `${startHours}:${startMinutes}`;
      const endTimeFormatted = `${endHours}:${endMinutes}`;
    
      const duration = endDate.getTime() - startDate.getTime();
      const durationString = this.formatDuration(duration);
    
      return `${startTimeFormatted} - ${endTimeFormatted} (${durationString})`;
    } else return ''
  }
  
  formatDuration(duration: number): string {
    const totalMinutes = Math.floor(duration / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  
    return `${hours}u${minutes}m`;
  }
  
  generateGoogleCalendarLink(): string {
    const startDateTime = this.bookingData.startTime ? new Date(this.bookingData.startTime).toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z' : '';
    const endDateTime = this.bookingData.endTime ? new Date(this.bookingData.endTime).toISOString().replace(/[-:.]/g, '').slice(0, -4) + 'Z' : '';
    const title = encodeURIComponent('Afspraak bij Zannah Kappersalon');
    const location = this.bookingData.location ? encodeURIComponent(this.bookingData.location) : '';

    const description = this.bookingData.title ? `Je hebt een afspraak bij Zannah Kappersalon voor de volgende diensten: ${this.bookingData.title}.` : 'Je hebt een afspraak bij Zannah Kappersalon.';
    const details = description ? encodeURIComponent(description) : '';

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDateTime}/${endDateTime}&details=${details}&location=${location}`;

    return googleCalendarUrl;
  }

  generateOutlookCalendarLink(): string {
    const startTime = this.bookingData.startTime ? new Date(this.bookingData.startTime) : '';
    const endTime = this.bookingData.endTime ? new Date(this.bookingData.endTime) : '';

    const startDateTime = startTime ? startTime.toISOString() : '';
    const endDateTime = endTime ? endTime.toISOString() : '';

    const title = encodeURIComponent('Afspraak bij Zannah Kappersalon');
    const location = this.bookingData.location ? encodeURIComponent(this.bookingData.location) : '';
    const body = this.bookingData.title ? encodeURIComponent(`Je hebt een afspraak bij Zannah Kappersalon voor de volgende diensten: ${this.bookingData.title}.`) : 'Je hebt een afspraak bij Zannah Kappersalon.';

    const outlookCalendarUrl = `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${startDateTime}&enddt=${endDateTime}&location=${location}&body=${body}`;

    return outlookCalendarUrl;
  }

  generateAppleCalendarLink(): string {
    const startDateTime = this.bookingData.startTime ? new Date(this.bookingData.startTime).toISOString().replace(/[-:.]/g, '').replace(/[:]/g, '') + 'Z' : '';
    const endDateTime = this.bookingData.endTime ? new Date(this.bookingData.endTime).toISOString().replace(/[-:.]/g, '').replace(/[:]/g, '') + 'Z' : '';
  
    const title = this.bookingData.title ? encodeURIComponent(this.bookingData.title) : '';
    const location = this.bookingData.location ? encodeURIComponent(this.bookingData.location) : '';
    const notes = encodeURIComponent(`Contact: ${this.bookingData.email}, ${this.bookingData.phone}`);
  
    const calendarContent = `BEGIN:VCALENDAR
      VERSION:2.0
      BEGIN:VEVENT
      SUMMARY:${title}
      DTSTART:${startDateTime}
      DTEND:${endDateTime}
      LOCATION:${location}
      DESCRIPTION:${notes}
      END:VEVENT
      END:VCALENDAR`;
  
    const base64Content = btoa(calendarContent);
    const appleCalendarUrl = `data:text/calendar;base64,${base64Content}`;
  
    return appleCalendarUrl;
  }
  

  generateYahooCalendarLink(): string {
    const startTime =  this.bookingData.startTime ? new Date(this.bookingData.startTime) : '';
    const endTime = this.bookingData.endTime ? new Date(this.bookingData.endTime) : '';

    const formatDate = (date: Date): string => {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        const seconds = ('0' + date.getSeconds()).slice(-2);

        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
    };

    const startDateTime = startTime ? formatDate(startTime) : '';
    const endDateTime = endTime ? formatDate(endTime): '';

    const title = encodeURIComponent('Afspraak bij Zannah Kappersalon');
    const location = this.bookingData.location ? encodeURIComponent(this.bookingData.location) : '';
    const body = this.bookingData.title ? encodeURIComponent(`Je hebt een afspraak bij Zannah Kappersalon voor de volgende diensten: ${this.bookingData.title}.`) : 'Je hebt een afspraak bij Zannah Kappersalon.';

    const yahooCalendarUrl = `https://calendar.yahoo.com/?v=60&view=d&type=20&title=${title}&st=${startDateTime}&et=${endDateTime}&desc=${body}&in_loc=${location}`;

    return yahooCalendarUrl;
  }
}

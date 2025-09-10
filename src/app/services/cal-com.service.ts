import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { defer, from, Observable, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CalComService {
  private readonly apiUrl = 'https://api.cal.com/v2';
  private readonly apiKey = environment.apiKey;

  private requestLimit = 10;

  private get requestCount(): number {
    const count = localStorage.getItem('calcom_requestCount');
    return count ? parseInt(count, 10) : 0;
  }

  private set requestCount(value: number) { 
    localStorage.setItem('calcom_requestCount', value.toString()) 
  }

  private get currentMinute(): number {
    const minute = localStorage.getItem('calcom_currentMinute');
    return minute ? parseInt(minute, 10) : new Date().getMinutes();
  }

  private set currentMinute(value: number) {
    localStorage.setItem('calcom_currentMinute', value.toString());
  }

  constructor(private http: HttpClient) {}

  private ensureRateLimit<T>(requestFn: () => Observable<T>): Observable<T> {
    return defer(() => {
      const now = new Date();
      const minute = now.getMinutes();

      if (minute !== this.currentMinute) {
        this.currentMinute = minute;
        this.requestCount = 0;
      }

      if (this.requestCount < this.requestLimit) {
        this.requestCount++;
        return requestFn();
      } else {
        const waitMs = 60000 - (now.getSeconds() * 1000 + now.getMilliseconds());

        const delayedObsPromise: Promise<Observable<T>> = new Promise((resolve) => {
          setTimeout(() => {
            this.currentMinute = new Date().getMinutes();
            this.requestCount = 1;
            resolve(requestFn());
          }, waitMs);
        });

        return from(delayedObsPromise).pipe(switchMap(obs => obs));
      }
    });
  }

  getAvailabilities(scheduleId: number, x: any, y: any): Observable<any> {
    return this.ensureRateLimit(() => {
      const url = `${this.apiUrl}/schedules/${scheduleId}?apiKey=${this.apiKey}`;
      return this.http.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-06-11'
        },
      });
    });
  }

  getAvailableTimeSlots( eventTypeSlug: string, userName: string, minBookingDays: number, maxBookingDays: number ): Observable<any> {
    return this.ensureRateLimit(() => {

      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + minBookingDays);
  
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + maxBookingDays);
  
      const formatDate = (d: Date) => d.toLocaleDateString('en-CA');
  
      const start = formatDate(startDate);
      const end = formatDate(endDate);
  
      const url = `${this.apiUrl}/slots?eventTypeSlug=${eventTypeSlug}&username=${userName}&start=${start}&end=${end}`;
      return this.http.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-09-04'
        },
      });
    });
  }

  generateRescheduleUid(bookingID: string): Observable<string> {
    return this.ensureRateLimit(() => {
      if (!bookingID) throw new Error('BookingID is vereist');
  
      const url = `${this.apiUrl}/bookings/${bookingID}/reschedule?apiKey=${this.apiKey}`;
  
      return this.http.post<any>(url, {}, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-06-11'
        },
      }).pipe(
        switchMap((data) => {
          const rescheduleUid = data?.rescheduleUid;
          if (!rescheduleUid) throw new Error('Geen rescheduleUid ontvangen van Cal.com');
          return from([rescheduleUid]);
        })
      );
    });
  }

  createBooking(data: any) {
    return this.ensureRateLimit(() => {
      const url = `${this.apiUrl}/bookings`;
      const payload = data;
  
      return this.http.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
        },
      });
    });
  }

  rescheduleBooking(bookingUid: string, data: any) {
    return this.ensureRateLimit(() => {
      const url = `${this.apiUrl}/bookings/${bookingUid}/reschedule`;
    
      return this.http.post(url, data, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-08-13',
        },
      });
    });
  }

  deleteBooking(bookingUid: string, cancellationReason = 'Gebruiker heeft zijn afspraak geannuleerd') {
    return this.ensureRateLimit(() => {
      const url = `${this.apiUrl}/bookings/${bookingUid}/cancel`;
  
      return this.http.post(
        url,
        { cancellationReason },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'cal-api-version': '2024-08-13',
          },
        }
      );
    });
  }
  
  updateWorkingHours(scheduleId: number, data: any) {
    return this.ensureRateLimit(() => {
      const payload = data;
      const url = `${this.apiUrl}/schedules/${scheduleId}?apiKey=${this.apiKey}`;
      return this.http.patch(url, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-06-11'
        },
      });
    });
  }

  updateOverride(schedulID: number, payload: any) {
    return this.ensureRateLimit(() => {
      const url = `${this.apiUrl}/schedules/${schedulID}?apiKey=${this.apiKey}`;
      return this.http.patch(url, payload, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-06-11'
        },
      });
    });
  }

  getScheduleId(): Observable<number> {
    return this.ensureRateLimit(() => 
      from(
        new Promise<number>((resolve, reject) => {
          this.getSchedules().subscribe(
            (response) => {
              if (response.data && response.data.length > 0) resolve(response.data[0].id);
              else reject('No schedules found');
            },
            (error) => reject(error)
          );
        })
      )
    );
  }

  getSchedules(): Observable<any> {
    return this.ensureRateLimit(() => {
      const url = `${this.apiUrl}/schedules?apiKey=${this.apiKey}`;
      return this.http.get(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'cal-api-version': '2024-06-11'
        },
      });
    });
  }
}

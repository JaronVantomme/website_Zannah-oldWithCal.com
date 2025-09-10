// src/app/services/email.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, delay, retryWhen, mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface SendWelcomeResponse {
  success: boolean;
  message: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  constructor(private http: HttpClient) {}

  sendWelcomeEmail(email: string, name: string): Observable<SendWelcomeResponse> {
    const url = `${environment.backendUrl}/send-welcome`;
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'x-api-key': environment.BACKEND_API_KEY
    });

    const body = { email, name };

    return this.http.post<SendWelcomeResponse>(url, body, { headers }).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error, index) => {
            if (index < 2 && (error.status === 503 || error.status === 0)) {
              console.warn(`Backend niet bereikbaar, retry #${index + 1} over 5s`);
              return of(error).pipe(delay(5000));
            }
            return throwError(() => error);
          })
        )
      ),
      catchError(err => {
        console.error('Mail versturen mislukt na retries:', err);
        return throwError(() => err);
      })
    );
  }
}
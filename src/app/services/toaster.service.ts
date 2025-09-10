import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ToastMessage } from '../Models/toastMessage.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  show(toast: ToastMessage) {
    this.toastSubject.next(toast);
  }
}
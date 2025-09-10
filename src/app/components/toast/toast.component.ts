import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toaster.service';
import { CommonModule } from '@angular/common';
import { ToastMessage } from '../../Models/toastMessage.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.css'
})
export class ToastComponent implements OnInit {
  toast: ToastMessage | null = null;
  timeout: any;
  progress = 100;
  interval: any;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe(toast => {
      this.toast = toast;
      this.progress = 100;

      const step = 100 / (50);
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.progress -= step;
        if (this.progress <= 0) {
          clearInterval(this.interval);
          this.toast = null;
        }
      }, 100);

      clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.toast = null;
        clearInterval(this.interval);
      }, 5000);
    });
  }
}
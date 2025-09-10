import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-expired-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.css'
})
export class SessionExpiredModalComponent {
  @Output() close = new EventEmitter<void>();

  constructor(private router: Router) {}

  goToLogin() {
    this.close.emit()
    this.router.navigate(['/login']);
  }
}
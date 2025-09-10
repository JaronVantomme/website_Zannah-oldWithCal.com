import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-birthday-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './birthday-modal.component.html',
  styleUrls: ['./birthday-modal.component.css'],
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('scaleFade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' }))
      ])
    ])
  ]
})
export class BirthdayModalComponent {
  @Input() birthDate!: string;
  public isBirthday: boolean = false;
  public showModal: boolean = false;
  public age: number = 0;

  ngOnInit(): void {
    if (!this.birthDate) return;
  
    const today = new Date();
    const birth = new Date(this.birthDate);
  
    this.isBirthday = today.getDate() === birth.getDate() && today.getMonth() === birth.getMonth();
  
    if (this.isBirthday) {
      this.showModal = true;
  
      setTimeout(() => {
        const canvas = document.getElementById('confettiCanvas') as HTMLCanvasElement;
        if (canvas) {
          const myConfetti = confetti.create(canvas, { resize: true, useWorker: true });
          myConfetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
      }, 100);
    }
  }  

  closeModal() {
    this.showModal = false;
  }
}
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css'
})
export class PopupComponent {
  @Input() title: string = ''
  @Input() desciption: string = '' 
  @Input() button1: string = '' 
  @Input() button2: string = '' 

  @Output() save = new EventEmitter<void>();
  @Output() discard = new EventEmitter<void>();

  closeSave() {
    this.save.emit();
  }

  closeDiscard() {
    this.discard.emit();
  }
}

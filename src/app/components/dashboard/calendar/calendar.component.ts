import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SelectedDayChange } from '../../../Models/workingHours';
import { HostListener } from '@angular/core';
import { PopupComponent } from '../../popup/popup.component'; 

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, PopupComponent],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  @Input() daysOfWeek: any;
  @Input() overrides: any;
  @Input() selectedDate: Date = new Date();
  @Output() close = new EventEmitter<void>();
  @Output() saveOverrides = new EventEmitter<{date: Date, times: string[]}[]>();

  public selectedDays: SelectedDayChange[] = [];
  public originalSelectedDays: SelectedDayChange[] = [];

  public currentMonth: number = new Date().getMonth();
  public currentYear: number = new Date().getFullYear();

  private longPressTimeout: any;
  private longPressDuration = 500;
  private longPressTriggered = false;
  public startTimeOnHold: string | null = null

  public showConfirmDialog = false;
  private pendingSelection: { start: string; end: string; action: 'add' | 'remove' } | null = null;

  private pressTimeout: any;
  private isPressing = false;
  private pressedTime: string | null = null;

  public showUnsavedModal: boolean = false

  ngOnInit(): void {
    this.currentMonth = this.selectedDate.getMonth()
    this.currentYear = this.selectedDate.getFullYear()

    this.convertOverridesToSelectedDays();
    window.addEventListener("beforeunload", this.beforeUnloadHandler);
  }

  ngAfterViewInit() {
    this.scrollToFirstSelectedTime()
  }

  ngOnDestroy(): void {
    window.removeEventListener("beforeunload", this.beforeUnloadHandler);
  }

  beforeUnloadHandler = (event: BeforeUnloadEvent): string | undefined => {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
      return '';
    }
    return undefined;
  };

  convertOverridesToSelectedDays(): void {
    if (!this.overrides || !Array.isArray(this.overrides)) return;
    
    for (const override of this.overrides) {
      const date = new Date(override.date);
      const added: string[] = [];
      let removed: string[] = [];
  
      const weekdayIndex = date.getDay();
      const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
      const dayData = this.daysOfWeek?.[index];
  
      if (dayData?.times?.length) {
        for (const t of dayData.times) {
          let start = t.startTime;
          while (start <= t.endTime) {
            removed.push(this.minutesToTimeString(start));
            start += 15;
          }
        }
      }
  
      const isWholeDayBlocked = override.times.some((timeBlock: any) =>
        (timeBlock.startTime === 0 && timeBlock.endTime === 0) ||
        (timeBlock.startTime === -1 && timeBlock.endTime === -1)
      );
  
      if (!isWholeDayBlocked) {
        for (const timeBlock of override.times) {
          let start = timeBlock.startTime;
          while (start <= timeBlock.endTime) {
            added.push(this.minutesToTimeString(start));
            start += 15;
          }
        }
  
        removed = removed.filter(time => !added.includes(time));
      }
  
      this.selectedDays.push({
        date,
        added,
        removed
      });

      this.originalSelectedDays = JSON.parse(JSON.stringify(this.selectedDays))
    }
  }
  

  hasTimesForDay(date: Date): boolean {
    const weekdayIndex = date.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    const dateStr = date.toDateString();
    const change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
  
    const hasOriginalTimes = dayData && dayData.active && dayData.times && dayData.times.length > 0;
  
    const hasAddedTimes = change && change.added.length > 0;
  
    return hasOriginalTimes || hasAddedTimes;
  }

  createDate(day: number): Date {
    return new Date(this.currentYear, this.currentMonth, day);
  }

  timeStringToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  isTimeSelected(timeLabel: string): boolean {
    const dateStr = this.selectedDate.toDateString();
    const change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
  
    if (change) {
      if (change.removed.includes(timeLabel)) return false;
      if (change.added.includes(timeLabel)) return true;
    }
  
    const minutes = this.timeStringToMinutes(timeLabel);
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    if (!dayData || !dayData.times?.length) return false;

    return dayData.times.some((t: any) => minutes >= t.startTime && minutes <= t.endTime);
  }

  get monthDays(): number[] {
    const date = new Date(this.currentYear, this.currentMonth, 1);
    const days = [];
    while (date.getMonth() === this.currentMonth) {
      days.push(date.getDate());
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  get weekdayNames(): string[] {
    return ['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'];
  }

  getCurrentMonthName(): string {
    return new Date(this.currentYear, this.currentMonth).toLocaleString('nl-NL', { month: 'long' });
  }

  getFirstWeekday(): number {
    const date = new Date(this.currentYear, this.currentMonth, 1);
    let day = date.getDay();
    return day === 0 ? 6 : day - 1;
  }

  minutesToTimeString(minutes: number): string {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
  
  get calendarGrid(): (number | null)[] {
    const emptyDays = Array(this.getFirstWeekday()).fill(null);
    return [...emptyDays, ...this.monthDays];
  }

  isPastTimeSlot(time: string): boolean {
    if (!this.selectedDate) return false;
    if (!this.isTodayDate(this.selectedDate)) return false;
  
    const [hour, minute] = time.split(':').map(Number);
    const slotDate = new Date(this.selectedDate);
    slotDate.setHours(hour, minute, 0, 0);
  
    const now = new Date();
    return slotDate < now;
  }

  isTodayDate(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  scrollToFirstSelectedTime() {
    const selectedDateStr = this.selectedDate.toDateString();
    const selectedChange = this.selectedDays.find(d => d.date.toDateString() === selectedDateStr);
    const selectedAdded = selectedChange?.added ?? [];
  
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    const originalTimes: string[] = [];
  
    if (dayData?.times?.length) {
      for (const t of dayData.times) {
        let start = t.startTime;
        while (start <= t.endTime) {
          originalTimes.push(this.minutesToTimeString(start));
          start += 15;
        }
      }
    }
  
    const removed = selectedChange?.removed ?? [];
    const finalOriginal = originalTimes.filter(t => !removed.includes(t));
  
    const combinedTimes = Array.from(new Set([...selectedAdded, ...finalOriginal]));
  
    if (combinedTimes.length === 0) return;
  
    combinedTimes.sort((a, b) => {
      const [aH, aM] = a.split(':').map(Number);
      const [bH, bM] = b.split(':').map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });
  
    let firstTime = combinedTimes[0];
    
    const exceptions = ['00:15', '00:30', '00:45', '01:00'];
    
    if (!exceptions.includes(firstTime)) {
      let [h, m] = firstTime.split(':').map(Number);
      let totalMinutes = h * 60 + m - 60;
    
      if (totalMinutes < 0) totalMinutes = 0;
    
      const newH = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
      const newM = String(totalMinutes % 60).padStart(2, '0');
      firstTime = `${newH}:${newM}`;
    }
        
    const el = document.getElementById('slot-' + firstTime);
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }

  getTimeSlots(): string[] {
    const times: string[] = [];
    const start = new Date();
    start.setHours(0, 15, 0, 0);
  
    const end = new Date();
    end.setHours(23, 45, 0, 0);
  
    const current = new Date(start);
  
    while (current <= end) {
      const hours = current.getHours();
      const minutes = current.getMinutes();
      let label: string;
  
      label = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
      times.push(label);
      current.setMinutes(current.getMinutes() + 15);
    }
  
    return times;
  }

  isToday(day: number): boolean {
    if (day === null) return false;
    const today = new Date();
    const dateToCheck = this.createDate(day);
    return (
      today.getDate() === dateToCheck.getDate() &&
      today.getMonth() === dateToCheck.getMonth() &&
      today.getFullYear() === dateToCheck.getFullYear()
    );
  }

  isPastDate(day: number): boolean {
    const date = this.createDate(day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }
  

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else this.currentMonth--;
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else this.currentMonth++;
  }

  selectDate(day: number) {
    this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
    
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    const alreadyModified = this.selectedDays.some(d => d.date.toDateString() === this.selectedDate.toDateString());
  
    if (!alreadyModified && (!dayData || !dayData.times || dayData.times.length === 0)) this.blockWholeDay();
  
    this.scrollToFirstSelectedTime();
  }

  blockWholeDay() {
    const dateStr = this.selectedDate.toDateString();
    let change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
    if (!change) {
      change = { date: new Date(this.selectedDate), added: [], removed: [] };
      this.selectedDays.push(change);
    }
  
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    if (dayData?.times?.length) {
      for (const t of dayData.times) {
        let start = t.startTime;
        while (start <= t.endTime) {
          const label = this.minutesToTimeString(start);
          if (!change.removed.includes(label)) change.removed.push(label);
          start += 15;
        }
      }
    }
  
    change.added = [];
  
    if (change.removed.length === 0 && change.added.length === 0) {
      const i = this.selectedDays.indexOf(change);
      this.selectedDays.splice(i, 1);
    }
  }

  unblockWholeDay() {
    const dateStr = this.selectedDate.toDateString();
    const change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
    if (!change) return;
  
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    if (dayData?.times?.length) {
      for (const t of dayData.times) {
        let start = t.startTime;
        while (start <= t.endTime) {
          const label = this.minutesToTimeString(start);
          const i = change.removed.indexOf(label);
          if (i !== -1) change.removed.splice(i, 1);
          start += 15;
        }
      }
    }
  
    if (change.added.length === 0 && change.removed.length === 0) {
      const i = this.selectedDays.indexOf(change);
      if (i !== -1) this.selectedDays.splice(i, 1);
    }
  }
  

  isWholeDayRemoved(date: Date): boolean {
    const dateStr = date.toDateString();
    const change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
  
    const weekdayIndex = date.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    const originalSlots: string[] = [];
    if (dayData?.times?.length) {
      for (const t of dayData.times) {
        let start = t.startTime;
        while (start <= t.endTime) {
          originalSlots.push(this.minutesToTimeString(start));
          start += 15;
        }
      }
    }
  
    const hasNoOriginal = originalSlots.length === 0;
    const hasNoChanges = !change || (change.added.length === 0 && change.removed.length === 0);
    if (hasNoOriginal && hasNoChanges) return true;
  
    if (change?.added?.length ?? 0 > 0) return false;
    if (!change?.removed?.length) return false;
  
    return originalSlots.every(slot => change.removed.includes(slot));
  }

  isDayCompletelyRemoved(day: number): boolean {
    const date = this.createDate(day);
    const entry = this.selectedDays.find(d => d.date.toDateString() === date.toDateString());
  
    if (!entry) return false;
  
    const removed = entry.removed ?? [];
    const added = entry.added ?? [];
  
    if (added.length > 0) return false;
  
    const weekdayIndex = date.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    if (!dayData?.times?.length) return removed.length > 0;
  
    const originalSlots: string[] = [];
    for (const t of dayData.times) {
      let start = t.startTime;
      while (start <= t.endTime) {
        originalSlots.push(this.minutesToTimeString(start));
        start += 15;
      }
    }
  
    return originalSlots.every(slot => removed.includes(slot));
  }

  isOnlyAddedDay(day: number): boolean {
    const date = this.createDate(day);
    const entry = this.selectedDays.find(d => d.date.toDateString() === date.toDateString());
  
    if (!entry) return false;
  
    const weekdayIndex = date.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    const hasNoOriginal = !dayData || !dayData.times || dayData.times.length === 0;
    return hasNoOriginal && entry.added.length > 0 && entry.removed.length === 0;
  }
  
  isDayModified(day: number): boolean {
    const date = this.createDate(day);
    return (this.selectedDays.some(d => d.date.toDateString() === date.toDateString()) ?? false);
  }

  isSelected(day: number): boolean {
    return this.selectedDate.getDate() === day && this.selectedDate.getMonth() === this.currentMonth && this.selectedDate.getFullYear() === this.currentYear;
  }

  wasOriginallySelected(timeLabel: string): boolean {
    const minutes = this.timeStringToMinutes(timeLabel);
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    if (!dayData || !dayData.times?.length) return false;
  
    return dayData.times.some((t: any) => minutes >= t.startTime && minutes <= t.endTime);
  }
  
  wasOriginallySelectedButRemoved(timeLabel: string): boolean {
    const dateStr = this.selectedDate.toDateString();
    const change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
    return this.wasOriginallySelected(timeLabel) && (change?.removed?.includes(timeLabel) ?? false);
  }
  
  wasOverridden(timeLabel: string): boolean {
    const dateStr = this.selectedDate.toDateString();
    const change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
    return (change?.added?.includes(timeLabel) ?? false) || (change?.removed?.includes(timeLabel) ?? false);
  }

  toggleTimeSelection(time: string) {
    if (this.startTimeOnHold !== null) {
      this.selectTimes(time);
      return
    }
    const dateStr = this.selectedDate.toDateString();
    let change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
  
    const minutes = this.timeStringToMinutes(time);
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    let originallyActive = false;
    if (dayData?.times?.length) {
      originallyActive = dayData.times.some((t: any) => minutes >= t.startTime && minutes <= t.endTime);
    }
  
    if (!change) {
      change = { date: new Date(this.selectedDate), added: [], removed: [] };
      this.selectedDays.push(change);
    }
  
    if (originallyActive) {
      const i = change.removed.indexOf(time);
      if (i === -1) change.removed.push(time);
      else change.removed.splice(i, 1);
    } else {
      const i = change.added.indexOf(time);
      if (i === -1) change.added.push(time);
      else change.added.splice(i, 1);
    }
  
    if (change.added.length === 0 && change.removed.length === 0) {
      const i = this.selectedDays.indexOf(change);
      this.selectedDays.splice(i, 1);
    }
  }

  selectTimes(endTimeOnHoldtime: string) {
    if (!this.startTimeOnHold) return;
  
    const startMinutes = this.timeStringToMinutes(this.startTimeOnHold);
    const endMinutes = this.timeStringToMinutes(endTimeOnHoldtime);
    const from = Math.min(startMinutes, endMinutes);
    const to = Math.max(startMinutes, endMinutes);
  
    const slotsToToggle: string[] = [];
    for (let minutes = from; minutes <= to; minutes += 15) {
      slotsToToggle.push(this.minutesToTimeString(minutes));
    }
  
    const firstActive = this.isTimeSelected(slotsToToggle[0]);
    const lastActive = this.isTimeSelected(slotsToToggle[slotsToToggle.length - 1]);
  
    if (firstActive !== lastActive) {
      this.pendingSelection = {
        start: this.startTimeOnHold,
        end: endTimeOnHoldtime,
        action: 'add'
      };
      this.showConfirmDialog = true;
      return;
    }
  
    const shouldRemove = firstActive;
    this.applyBulkTimeChange(slotsToToggle, shouldRemove);
    this.startTimeOnHold = null;
  }

  applyBulkTimeChange(slots: string[], remove: boolean) {
    const dateStr = this.selectedDate.toDateString();
    let change = this.selectedDays.find(d => d.date.toDateString() === dateStr);
  
    if (!change) {
      change = { date: new Date(this.selectedDate), added: [], removed: [] };
      this.selectedDays.push(change);
    }
  
    const weekdayIndex = this.selectedDate.getDay();
    const index = weekdayIndex === 0 ? 6 : weekdayIndex - 1;
    const dayData = this.daysOfWeek?.[index];
  
    for (const slot of slots) {
      const isOriginallyActive = dayData?.times?.some((t: any) => {
        const minutes = this.timeStringToMinutes(slot);
        return minutes >= t.startTime && minutes < t.endTime;
      }) ?? false;
  
      if (remove) {
        if (isOriginallyActive) {
          if (!change.removed.includes(slot)) change.removed.push(slot);
          const i = change.added.indexOf(slot);
          if (i !== -1) change.added.splice(i, 1);
        } else {
          const i = change.added.indexOf(slot);
          if (i !== -1) change.added.splice(i, 1);
        }
      } else {
        if (isOriginallyActive) {
          const i = change.removed.indexOf(slot);
          if (i !== -1) change.removed.splice(i, 1);
        } else {
          if (!change.added.includes(slot)) change.added.push(slot);
        }
      }
    }
  
    if (change.added.length === 0 && change.removed.length === 0) {
      const i = this.selectedDays.indexOf(change);
      this.selectedDays.splice(i, 1);
    }
  }

  confirmPendingSelection(action: 'add' | 'remove') {
    if (!this.pendingSelection) return;
  
    const startMinutes = this.timeStringToMinutes(this.pendingSelection.start);
    const endMinutes = this.timeStringToMinutes(this.pendingSelection.end);
    const from = Math.min(startMinutes, endMinutes);
    const to = Math.max(startMinutes, endMinutes);
  
    const slots: string[] = [];
    for (let minutes = from; minutes <= to; minutes += 15) {
      slots.push(this.minutesToTimeString(minutes));
    }
  
    this.applyBulkTimeChange(slots, action === 'remove');
    this.pendingSelection = null;
    this.showConfirmDialog = false;
    this.startTimeOnHold = null;
  }
  
  cancelPendingSelection() {
    this.pendingSelection = null;
    this.showConfirmDialog = false;
    this.startTimeOnHold = null;
  }

  toggleWholeDay() {
    const isCurrentlyBlocked = this.isWholeDayRemoved(this.selectedDate);
  
    if (isCurrentlyBlocked) this.unblockWholeDay();
    else this.blockWholeDay();
  }

  isDayWithAddedOrRemovedTimes(day: number): boolean {
    const date = this.createDate(day);
    const entry = this.selectedDays.find(d => d.date.toDateString() === date.toDateString());
  
    if (!entry) return false;
  
    if (!(entry.removed.length > 0) && this.isDayCompletelyRemoved(day)) return false;
  
    return entry.added.length > 0 || entry.removed.length > 0;
  }

  hasAddedTimes(d: number | null): boolean {
    if (d === null) return false;
    return this.isDayWithAddedOrRemovedTimes(d);
  }

  onMouseDown(time: string) {
    this.longPressTriggered = false;
    this.longPressTimeout = setTimeout(() => {
      this.longPressTriggered = true;
      this.longPressAction(time);
    }, this.longPressDuration);
  }
  
  onMouseUp(time: string) {
    clearTimeout(this.longPressTimeout);
    if (!this.longPressTriggered) {
      this.toggleTimeSelection(time);
    }
  }
  
  onMouseLeave(time: string) {
    clearTimeout(this.longPressTimeout);
  }
  
  onTouchStart(time: string) {
    this.longPressTriggered = false;
    this.longPressTimeout = setTimeout(() => {
      this.longPressTriggered = true;
      this.longPressAction(time);
    }, this.longPressDuration);
  }
  
  onTouchEnd(time: string) {
    clearTimeout(this.longPressTimeout);
    if (!this.longPressTriggered) {
      this.toggleTimeSelection(time);
    }
  }
  
  longPressAction(time: string) {
    this.startTimeOnHold = time
  }

  onPressStart(time: string, event: PointerEvent) {
    event.preventDefault();
    this.longPressTriggered = false;
  
    clearTimeout(this.pressTimeout);
    this.pressTimeout = setTimeout(() => {
      this.longPressTriggered = true;
      this.longPressAction(time);
    }, this.longPressDuration || 500);
  }
  
  onPressEnd(time: string, event: PointerEvent) {
    event.preventDefault();
    clearTimeout(this.pressTimeout);
  
    if (!this.longPressTriggered) {
      this.toggleTimeSelection(time);
    }
  }
  
  onPressCancel() {
    clearTimeout(this.pressTimeout);
  }
  
  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onGlobalPressEnd(_e: Event) {
    if (!this.isPressing) return;
  
    clearTimeout(this.pressTimeout);
  
    if (!this.longPressTriggered && this.pressedTime) {
      this.toggleTimeSelection(this.pressedTime);
    }
  
    this.isPressing = false;
    this.pressedTime = null;
  }

  hasUnsavedChanges(): boolean {
    if (!this.originalSelectedDays || !this.selectedDays) return false;
    if (this.originalSelectedDays.length !== this.selectedDays.length) return true;
  
    for (let i = 0; i < this.originalSelectedDays.length; i++) {
      const originalDay = this.originalSelectedDays[i];
      const selectedDay = this.selectedDays[i];
  
      const originalDate = (typeof originalDay.date === 'string') ? new Date(originalDay.date).toISOString() : originalDay.date.toISOString();
      const selectedDate = (typeof selectedDay.date === 'string') ? new Date(selectedDay.date).toISOString() : selectedDay.date.toISOString();
  
      if (originalDate !== selectedDate) return true;
  
      if (originalDay.added.length !== selectedDay.added.length || originalDay.removed.length !== selectedDay.removed.length) return true;
  
      for (let j = 0; j < originalDay.added.length; j++) {
        if (originalDay.added[j] !== selectedDay.added[j]) return true;
      }
  
      for (let j = 0; j < originalDay.removed.length; j++) {
        if (originalDay.removed[j] !== selectedDay.removed[j]) return true;
      }
    }
    return false;
  }

  getFinalSelectedDays(): { date: Date, times: string[] }[] {
    return this.selectedDays.map(change => {
      const finalTimes = this.getFinalSelectedTimesForDate(change.date);
      return {
        date: change.date,
        times: finalTimes
      };
    });
  }
  
  getFinalSelectedTimesForDate(date: Date): string[] {
    const dateStr = date.toDateString();
  
    const selectedChange = this.selectedDays.find(d => d.date.toDateString() === dateStr);
  
    const dayIndex = date.getDay();
    const weekDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    const dayData = this.daysOfWeek?.[weekDayIndex];
  
    const originalTimes: string[] = [];
  
    if (dayData?.times?.length) {
      for (const t of dayData.times) {
        let start = t.startTime;
        while (start <= t.endTime) {
          const label = this.minutesToTimeString(start);
          originalTimes.push(label);
          start += 15;
        }
      }
    }
  
    const removed = selectedChange?.removed ?? [];
    const added = selectedChange?.added ?? [];

    const filteredOriginals = originalTimes.filter(t => !removed.includes(t));
    const allTimes = Array.from(new Set([...filteredOriginals, ...added]));
  
    return allTimes.sort((a, b) => this.timeStringToMinutes(a) - this.timeStringToMinutes(b));
  }

  saveChanges() {
    const finalSelectedDays = this.getFinalSelectedDays();
    this.saveOverrides.emit(finalSelectedDays);
  }

  closeModal() {
    if (this.hasUnsavedChanges()) this.showUnsavedModal = true
    else this.close.emit()
  }

  onSaveChanges() {
    this.showUnsavedModal = false
  }

  onDiscardChanges() {
    this.close.emit();
  }
}

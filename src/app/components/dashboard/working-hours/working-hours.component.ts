import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalComService } from './../../../services/cal-com.service';
import { CalendarComponent } from '../calendar/calendar.component';
import { Day } from '../../../Models/workingHours';
import { environment } from './../../../../environments/environment';
import { firstValueFrom, Observable } from 'rxjs';
import { ToastService } from '../../../services/toaster.service';

type DayNameEnglish = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

interface TimeRange {
  startTime: number;
  endTime: number;
}

interface DayOfWeek {
  active: boolean;
  isOpen: boolean;
  name: string;
  times: TimeRange[];
}

interface WorkingHour {
  days: DayNameEnglish[];
  startTime: string;
  endTime: string;
}

@Component({
  selector: 'app-working-hours',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule, CalendarComponent],
  templateUrl: './working-hours.component.html',
  styleUrl: './working-hours.component.css'
})

export class WorkingHoursComponent implements OnInit {
  @ViewChildren('timeOption') timeOptions!: QueryList<ElementRef>;

  public showTestButton = !environment.production;

  public dropdownOpen: string | null = null;
  private hasClickedOutside: boolean = false;

  public daysOfWeek: Day[] = []
  private initialDaysOfWeek: Day[] = [];

  public overrides: {title: string, date: string, time: any[]}[] = [];

  public dateFrom: string = '';
  public dateTo: string = '';
  public isLoading: boolean = true
  public showCalendar: boolean = false
  private scheduleId: number = 0

  public selectedOverrideDate: Date = new Date();

  public hasUnsavedChanges(): boolean {
    return this.timeDataChanged();
  }

  constructor(private calComService: CalComService, private toastr: ToastService) {}

  ngOnInit(): void {
    if (!this.showTestButton) {
      this.initializeData()
      this.fetchAvailabilityData();
    }
  }

  fetchDataTesting() {
    this.initializeData()
    this.setDateRange();
    this.fetchAvailabilityData();
  }

  initializeData() {
    this.isLoading = true;
    this.daysOfWeek = [
      { active: false,  name: 'maandag', times: [], isOpen: false },
      { active: false,  name: 'dinsdag', times: [], isOpen: false },
      { active: false,  name: 'woensdag', times: [], isOpen: false },
      { active: false,  name: 'donderdag', times: [], isOpen: false },
      { active: false,  name: 'vrijdag', times: [], isOpen: false },
      { active: false,  name: 'zaterdag', times: [], isOpen: false },
      { active: false,  name: 'zondag', times: [], isOpen: false },
    ];
    this.initialDaysOfWeek = [
      { active: false,  name: 'maandag', times: [], isOpen: false },
      { active: false,  name: 'dinsdag', times: [], isOpen: false },
      { active: false,  name: 'woensdag', times: [], isOpen: false },
      { active: false,  name: 'donderdag', times: [], isOpen: false },
      { active: false,  name: 'vrijdag', times: [], isOpen: false },
      { active: false,  name: 'zaterdag', times: [], isOpen: false },
      { active: false,  name: 'zondag', times: [], isOpen: false },
    ];
  }

  setDateRange(): void {
    const today = new Date();
    this.dateFrom = today.toISOString();

    const dateTo = new Date(today);
    dateTo.setMonth(dateTo.getMonth() + 3);
    this.dateTo = dateTo.toISOString();
  }
  
  async fetchAvailabilityData(): Promise<void> {
    await this.getScheduleId()

    this.calComService.getAvailabilities(this.scheduleId, this.dateFrom, this.dateTo).subscribe(
      async (response) => {
        await this.transformApiData(response)
        this.isLoading = false;
      },
      (error) => {
        console.error('Error getting availabilities:', error);
      }
    );
  }

  async transformApiData(response: any): Promise<void> {
    await this.processWorkingHours(response.data.availability)
    await this.processOverrides(response.data.overrides)
  }

  async getScheduleId() {
    try {
      this.scheduleId = await firstValueFrom(this.calComService.getScheduleId());
    } catch (error) {
      console.error('Fout bij ophalen scheduleId:', error);
    }
  }

  processWorkingHours(workingHours: any) {
    const dayNames = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
  
    const dayMap: Record<string, number> = {
      Monday: 0,
      Tuesday: 1,
      Wednesday: 2,
      Thursday: 3,
      Friday: 4,
      Saturday: 5,
      Sunday: 6
    };
  
    const timeToMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(":").map(Number);
      return h * 60 + m;
    };
  
    this.daysOfWeek = dayNames.map(name => ({
      active: false,
      isOpen: false,
      name,
      times: [] as { startTime: number; endTime: number }[]
    }));
  
    if (!Array.isArray(workingHours)) return;
  
    workingHours.forEach(entry => {
      const start = timeToMinutes(entry.startTime);
      const end = timeToMinutes(entry.endTime);
  
      entry.days.forEach((day: string) => {
        const index = dayMap[day];
        if (index !== undefined) {
          this.daysOfWeek[index].active = true;
          this.daysOfWeek[index].isOpen = false;
          this.daysOfWeek[index].times.push({ startTime: start, endTime: end });
        }
      });
    });

    this.daysOfWeek.forEach(day => {
      day.times.sort((a, b) => a.startTime - b.startTime);
    });

    this.initialDaysOfWeek = JSON.parse(JSON.stringify(this.daysOfWeek))
  }
  
  processOverrides(overrides: any) {
    if (!Array.isArray(overrides)) {
      this.overrides = [];
      return;
    }
  
    const transformed = overrides.map((override: any) => {
      const options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" };
      const dateObj = new Date(override.date);
      const title = dateObj.toLocaleDateString('nl-NL', options);
  
      const [sh, sm] = override.startTime.split(":").map(Number);
      const [eh, em] = override.endTime.split(":").map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
  
      return {
        date: override.date,
        title,
        times: [{ startTime: startMinutes, endTime: endMinutes }]
      };
    });
  
    const groupedByDate = transformed.reduce((acc: any, current: any) => {
      const existing = acc.find((item: any) => item.date === current.date);
      if (existing) existing.times.push(...current.times);
      else acc.push(current);
      return acc;
    }, []);
  
    this.overrides = groupedByDate.sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  toggleDay(day: any): void {
    day.isOpen = !day.isOpen
    this.daysOfWeek.forEach((dayItem) => {
      if (day.name !== dayItem.name) dayItem.isOpen = false
    });
  }

  formatTime(minutes: number): string {
    if (minutes) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    } else return 'Selecteer'
  }

  formatDate2(date: any): string {
    let formattedDate = new Date(date);
    if (formattedDate instanceof Date && !isNaN(formattedDate.getTime())) return formattedDate.toLocaleDateString();
    else return 'Invalid Date';
  }

  addTime(day: any) {
    if (!day.times) day.times = [];
    day.times.push({ startTime: null, endTime: null });
  }

  removeTime(day: any, index: number): void {
    if (day.times && index >= 0 && index < day.times.length) day.times.splice(index, 1);
  }

  toggleActive(day: any): void {
    day.active = !day.active;
  
    if (day.active) day.times = [{ startTime: 540, endTime: 1020 }];
    else day.times = [];
  }

  createTimesLine(dayOrOverride: any): string {
    if (!dayOrOverride.times || dayOrOverride.times.length === 0) return 'Geen tijden ingesteld';
  
    const isUnavailableAllDay = dayOrOverride.times.every((t: any) => (t.startTime === 0 || t.startTime === -1) && (t.endTime === 0 || t.endTime === -1));
    if (isUnavailableAllDay) return 'Niet beschikbaar';
  
    return dayOrOverride.times.map((t: any) => `${this.formatTime(t.startTime)} - ${this.formatTime(t.endTime)}`).join(', ');
  }

  getTimeOptions(type: 'startTime' | 'endTime', times: any, index: number): number[] {
    let start = 0;
    const maxMinutes = 23 * 60 + 45;
  
    switch (type) {
      case 'startTime':
        if (index !== 0) start = times.times[index - 1].endTime + 15;
        break;
      case 'endTime':
        start = times.times[index].startTime + 15;
        break;
    }
  
    const options: number[] = [];
  
    for (let i = start; i <= maxMinutes; i += 15) {
      options.push(i);
    }
  
    return options;
  }

  padZero(num: number): string {
    return num < 10 ? '0' + num : num.toString();
  }

  toggleDropdown(type: string, index: number, time: any): void {
    if (this.dropdownOpen === `${type}-${index}`) this.dropdownOpen = null;
    else {
      this.dropdownOpen = `${type}-${index}`;
      setTimeout(() => {
        const targetOption = this.timeOptions.find((element) => element.nativeElement.textContent.trim() === this.formatTime(time));
        if (targetOption) targetOption.nativeElement.scrollIntoView({ block: 'center' });
      }, 0);
    }
  }

  selectTime(type: string, option: number, index: number): void {
    this.daysOfWeek.forEach((day) => {
      if (day.isOpen) {
        if (!day.times[index]) day.times[index] = { startTime: 0, endTime: 0 };
        if (type === 'startTime') day.times[index].startTime = option;
        else if (type === 'endTime') day.times[index].endTime = option;
      }
    });
  
    this.dropdownOpen = null;
  }
  

  timeDataChanged(): boolean {
    return !this.deepCompare(this.daysOfWeek, this.initialDaysOfWeek);
  }
  
  private deepCompare(arr1: Day[], arr2: Day[]): boolean {
    if (arr1.length !== arr2.length) return false;
  
    for (let i = 0; i < arr1.length; i++) {
      const day1 = arr1[i];
      const day2 = arr2[i];
  
      if ( day1.active !== day2.active || day1.name !== day2.name || day1.times.length !== day2.times.length ) return false;
  
      for (let j = 0; j < day1.times.length; j++) {
        const time1 = day1.times[j];
        const time2 = day2.times[j];
  
        if ( time1.startTime !== time2.startTime || time1.endTime !== time2.endTime ) return false;
      }
    }
  
    return true;
  }

  async saveData() {
    this.isLoading = true
    await this.transformWorkingHours()
    this.toastr.show({ type: 'success', title: `Wijzigingen opgeslagen!`, text: 'De wijzigingen zijn succesvol opgeslagen.' });  
  }

  minutesToHHMM(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  }
  
  async transformWorkingHours() {
    const data = this.daysOfWeek;
    
    const dayMap: Record<string, string> = {
      maandag: "Monday",
      dinsdag: "Tuesday",
      woensdag: "Wednesday",
      donderdag: "Thursday",
      vrijdag: "Friday",
      zaterdag: "Saturday",
      zondag: "Sunday"
    };
  
    const timeSlotMap: Record<string, string[]> = {};
  
    data.forEach((dayObj: any) => {
      if (dayObj.active && dayObj.times.length > 0) {
        dayObj.times.forEach((time: any) => {
          const key = `${time.startTime}-${time.endTime}`;
          if (!timeSlotMap[key]) {
            timeSlotMap[key] = [];
          }
          timeSlotMap[key].push(dayMap[dayObj.name]);
        });
      }
    });
  
    const availability = Object.entries(timeSlotMap).map(([timeKey, days]) => {
      const [startTime, endTime] = timeKey.split("-").map(Number);
      return {
        days,
        startTime: this.minutesToHHMM(startTime),
        endTime: this.minutesToHHMM(endTime)
      };
    });
    
    await this.calComService.updateWorkingHours(this.scheduleId, { availability })
      .subscribe(async (response) => {
        await this.transformApiData(response)
        this.toastr.show({ type: 'success', title: `Wijzigingen opgeslagen!`, text: 'De wijzigingen zijn succesvol opgeslagen.' });  
        this.isLoading = false
      });
  }

  async saveOverrides(overrides: { date: Date, times: string[] }[]) {
    const result: { overrides: { date: string; startTime: string; endTime: string }[] } = {
      overrides: [],
    };
  
    const groupTimeBlocks = (times: string[]): { start: number; end: number }[] => {
      if (!times || times.length === 0) return [];
  
      const minutesArray = times
        .map(t => {
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m;
        })
        .sort((a, b) => a - b);
  
      const blocks: { start: number; end: number }[] = [];
  
      let start = minutesArray[0];
      let prev = minutesArray[0];
  
      for (let i = 1; i < minutesArray.length; i++) {
        const current = minutesArray[i];
        if (current === prev + 15) {
          prev = current;
        } else {
          blocks.push({ start, end: prev });
          start = current;
          prev = current;
        }
      }
  
      blocks.push({ start, end: prev });
      return blocks;
    };
  
    const formatTime = (totalMinutes: number): string => {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };
  
    overrides.forEach(override => {
      const dateStr = `${override.date.getFullYear()}-${(override.date.getMonth() + 1).toString().padStart(2, '0')}-${override.date.getDate().toString().padStart(2, '0')}`;
  
      if (!override.times || override.times.length === 0) {
        result.overrides.push({
          date: dateStr,
          startTime: '00:00',
          endTime: '00:00',
        });
      } else {
        const blocks = groupTimeBlocks(override.times);
  
        blocks.forEach(block => {
          result.overrides.push({
            date: dateStr,
            startTime: formatTime(block.start),
            endTime: formatTime(block.end),
          });
        });
      }
    });
  
    this.showCalendar = false;
    this.isLoading = true;
  
    await this.calComService.updateOverride(this.scheduleId, result).subscribe(
      async (response) => {
        await this.transformApiData(response)
        this.toastr.show({ type: 'success', title: `Wijzigingen opgeslagen!`, text: 'De wijzigingen zijn succesvol opgeslagen.' });  
        this.isLoading = false
      }
    );
  }
  
  formatTimeToISOString(minutes: number): string {
    const date = new Date(1970, 0, 1);
    date.setMinutes(minutes + 60);
    return date.toISOString().split('T')[1];
  }
  
  groupDuplicateTimes(availability: any[]): any[] {
    const mergedAvailability: any[] = [];
    const timeSlotMap = new Map();
    availability.forEach((item) => {
      const timeSlot = `${item.startTime}-${item.endTime}`;

      if (timeSlotMap.has(timeSlot)) {
        const existingEntry = timeSlotMap.get(timeSlot);
        existingEntry.days = [...new Set([...existingEntry.days, ...item.days])];
      } else {
        const newEntry = { ...item, days: [...item.days] };
        timeSlotMap.set(timeSlot, newEntry);
        mergedAvailability.push(newEntry);
      }
    });

    return mergedAvailability;
  }

  addDateOverride(): void {
    this.selectedOverrideDate = new Date()
    this.showCalendar = true
  }

  editOverride(date: string) {
    this.selectedOverrideDate = new Date(date);
    this.showCalendar = true;
  }

  async deleteOverride(dateToDelete: string) {  
    const overrides = await this.overrides.filter(o => o.date !== dateToDelete);
  
    const result = {
      overrides: overrides.flatMap((o: any) =>
        (o.times ?? []).map((t: any) => ({
          date: o.date,
          startTime: t.startTime === 0 ? '00:00' : this.formatTime(t.startTime),
          endTime: t.endTime === 0 ? '00:00' : this.formatTime(t.endTime)
        }))
      )
    };


    await this.calComService.updateOverride(this.scheduleId, result).subscribe(
      async (response) => {
        await this.transformApiData(response)
        this.toastr.show({ type: 'success', title: `Datum overschrijving verwijderd!`, text: 'De datum overschrijving is succesvol verwijderd.' });        
        this.isLoading = false
      }
    );
  }

  onModalClose() {
    this.showCalendar = false
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(): void {
    if (this.dropdownOpen !== null) {
      if (this.hasClickedOutside) {
        this.dropdownOpen = null;
        this.hasClickedOutside = false;
      } else this.hasClickedOutside = true;
    } else this.hasClickedOutside = false;
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: BeforeUnloadEvent): void {
    if (this.timeDataChanged()) {
      $event.preventDefault();
      $event.returnValue = 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt afsluiten?';
    }
  }
}


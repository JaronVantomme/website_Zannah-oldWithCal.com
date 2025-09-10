import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkingHoursComponent } from "./../../../components/dashboard/working-hours/working-hours.component";
import { PopupComponent } from '../../../components/popup/popup.component';
import { environment } from './../../../../environments/environment';
import { AuthenticationService } from './../../../services/authentication.service';
import { UserStoreService } from '../../../services/user-store.service';
import { SupabaseService } from '../../../services/supabase.service';
import { NavigationService } from '../../../services/navigation.service';
import { ClientsComponent } from "../../../components/dashboard/clients/clients.component";

enum DashboardPages {
  Dashboard = 'dashboard',
  Afspraken = 'Afspraken',
  Werkuren = 'Werkuren',
  Klanten = 'Klanten',
  Financien = 'Financiën',
  Meldingen = 'Meldingen',
  Instellingen = 'Instellingen',
  Help = 'Help',
  Darkmode = 'Darkmode'
}

@Component({
  selector: 'app-home-admin-page',
  standalone: true,
  imports: [HttpClientModule, CommonModule, FormsModule, WorkingHoursComponent, PopupComponent, ClientsComponent],
  templateUrl: './home-admin-page.component.html',
  styleUrls: ['./home-admin-page.component.css']
})
export class HomeAdminPageComponent implements OnInit {
  public DashboardPages = DashboardPages;
  public selectedPage: DashboardPages = DashboardPages.Werkuren;
  public fullName: string = environment.fullName
  public buisnessName: string = environment.buisnessName
  public isSidebarOpen: boolean = false;
  public currentSection: string = 'working-hours';

  constructor(private authenticationService: AuthenticationService, private userStoreService: UserStoreService, private supabaseService: SupabaseService, private navigationService: NavigationService) {}

  ngOnInit(): void {
    setTimeout(() => {

    }, 2000)
  }

  getInitials(name: string): string {
    return name.split(' ')[0][0] + name.split(' ')[1][0]
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  async logout() {
    await this.supabaseService.logout();
  }

  @ViewChild(WorkingHoursComponent) workingHoursComp?: WorkingHoursComponent;
  showUnsavedModal = false;
  pendingPage: DashboardPages | null = null;

  changePage(newPage: DashboardPages) {
    if (this.workingHoursComp?.hasUnsavedChanges()) {
      this.pendingPage = newPage;
      this.showUnsavedModal = true;
    } else {
      this.selectedPage = newPage;
      this.toggleSidebar();
    }
  }

  async onSaveChanges() {
    if (this.workingHoursComp) await this.workingHoursComp.saveData();
  
    this.showUnsavedModal = false;
    if (this.pendingPage) {
      this.selectedPage = this.pendingPage;
      this.pendingPage = null;
      this.toggleSidebar();
    }
  }
  
  onDiscardChanges() {
    this.selectedPage = this.pendingPage!;
    this.showUnsavedModal = false;
    this.pendingPage = null;
  }

  goTo(location: string) {
    this.navigationService.navigateTo(location)
  }
}
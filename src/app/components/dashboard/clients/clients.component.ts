import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

interface Appointment {
  date: Date;
  status: 'Voltooid' | 'Gepland' | 'Geannuleerd';
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  appointments: Appointment[];
  isBlocked: boolean;
}
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.css'
})
export class ClientsComponent {
  customers: Customer[] = [];
  selectedCustomer: Customer | null = null;
  isLoading = true;

  ngOnInit() {
    // Simuleer API call
    setTimeout(() => {
      this.customers = [
        { id: 1, name: 'Jan Jansen', email: 'jan@example.com', phone: '0612345678', appointments: [{date: new Date(), status: 'Gepland'}], isBlocked: false },
        { id: 2, name: 'Marie de Vries', email: 'marie@example.com', phone: '0687654321', appointments: [{date: new Date(), status: 'Voltooid'}], isBlocked: false },
        { id: 3, name: 'Marie de Vries', email: 'marie@example.com', phone: '0687654321', appointments: [{date: new Date(), status: 'Voltooid'}], isBlocked: false },
        { id: 4, name: 'Marie de Vries', email: 'marie@example.com', phone: '0687654321', appointments: [{date: new Date(), status: 'Voltooid'}], isBlocked: false },
        { id: 5, name: 'Marie de Vries', email: 'marie@example.com', phone: '0687654321', appointments: [{date: new Date(), status: 'Voltooid'}], isBlocked: false },
      ];
      this.isLoading = false;
    }, 1000);
  }

  openCustomerDetail(customer: Customer) {
    this.selectedCustomer = customer;
  }

  closeModal() {
    this.selectedCustomer = null;
  }

  getUpcomingAppointments(customer: Customer) {
    return customer.appointments.filter(a => a.status === 'Gepland').length;
  }

  rescheduleAppointment(appt: Appointment) {
    // Voeg logica toe om afspraak te verplaatsen
  }

  cancelAppointment(appt: Appointment) {
    // Voeg logica toe om afspraak te annuleren
  }

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map(n => n.charAt(0)).join('');
    return initials.slice(0, 2).toUpperCase();
  }

  toggleBlockUser(user: any) {
    user.isBlocked = !user.isBlocked;
    // TODO: stuur naar backend om user te blokkeren/deblokkeren
  }
  
  createBooking(user: any) {
    const date = prompt('Selecteer datum voor nieuwe afspraak (YYYY-MM-DD HH:MM)');
    if (date) {
      // TODO: verstuur naar backend en update selectedCustomer.appointments
      user.appointments.push({ date: new Date(date), status: 'Nieuw' });
    }
  }
}

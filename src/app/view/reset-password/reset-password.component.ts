import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../services/toaster.service';
import { SupabaseErrorService } from '../../services/supabaseError.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  newPassword: string = '';
  hasToken = false;
  loading = false;
  formError: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private toastr: ToastService,
    private supabaseErrorService: SupabaseErrorService
  ) {}

  ngOnInit(): void {
    const fragment = this.route.snapshot.fragment;

    if (!fragment) {
      this.hasToken = false;
      return;
    }

    this.supabaseService.setSessionFromUrlFragment(fragment)
      .then(() => {
        this.hasToken = true;
      })
      .catch((err) => {
        console.error('Session setup failed:', err);
        this.hasToken = false;
      });
  }

  async resetPassword() {
    this.formError = null;
    if (this.newPassword.length < 6) {
      this.formError = 'Wachtwoord moet minstens 6 tekens bevatten.';
      return;
    }

    this.loading = true;

    try {
      await this.supabaseService.updatePassword(this.newPassword);
      this.toastr.show({ type: 'success', title: 'Wachtwoord gewijzigd', text: 'Je wachtwoord is succesvol aangepast. Je kunt nu inloggen met je nieuwe wachtwoord.'});      
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.formError = this.supabaseErrorService.translate(error.message) || 'Wachtwoord resetten is mislukt.';
    } finally {
      this.loading = false;
    }
  }

  goTo(location: string) {
    this.router.navigate([location]);
  }
}
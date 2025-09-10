import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SupabaseErrorService } from '../../services/supabaseError.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toaster.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-loginpage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loginpage.component.html',
  styleUrls: ['./loginpage.component.css'],
})
export class LoginpageComponent implements OnInit {
  public passwordHidden: boolean = true;
  public isLoggedin: boolean = false;
  public showEmailError: boolean = false;
  public showPasswordError: boolean = false;
  public isLoginFailed: boolean = false;
  public formError: string | null = null; 

  public loginForm: any = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
  });

  constructor(private navigationService: NavigationService, private authenticationService: AuthenticationService, private supabaseErrorService: SupabaseErrorService, private route: ActivatedRoute, private toastr: ToastService, private router: Router ) { }

  ngOnInit(): void {
    window.scrollTo(0, 0);
    const email = localStorage.getItem('email') ? localStorage.getItem('email') : ''
    this.loginForm.get('email')?.setValue(email);
  }

  togglePasswordVisibility() {
    this.passwordHidden = !this.passwordHidden;
  }

  async onSubmit() {
    this.formError = null;
    this.loginForm.markAllAsTouched();
  
    this.showEmailError = this.loginForm.get('email')?.invalid ?? false;
    this.showPasswordError = this.loginForm.get('password')?.invalid ?? false;
  
    if (!this.loginForm.valid) return;
  
    this.isLoggedin = true;
    this.isLoginFailed = false;
  
    try {
      const email = this.loginForm.get('email')?.value;
      const password = this.loginForm.get('password')?.value;
    
      const profile = await this.authenticationService.login(email, password);
    
      if (!profile) throw new Error('Gebruiker niet gevonden.');
            
      const isAdmin = profile?.role === 'ADMIN';

      this.toastr.show({ type: 'success', title: 'Welkom terug!', text: 'Je bent succesvol ingelogd.' });
    
      const redirectTo = this.route.snapshot.queryParams['redirectTo'] || (isAdmin ? 'home-admin' : 'home');

      if (redirectTo  === 'services') this.toastr.show({ type: 'success', title: `Welkom terug${profile.firstName ? ', ' + profile.firstName : ''}!`, text: 'Je bent ingelogd, je kunt nu beginnen met je boeking.'});
      else if (redirectTo === 'home-admin') this.toastr.show({ type: 'success', title: `Welkom terug, ${environment.fullName.split(' ')[0]}! 👋`, text: 'Je bent succesvol ingelogd als eigenaar. Veel succes vandaag!'});
      else if (redirectTo === 'home') this.toastr.show({ type: 'success', title: `Welkom terug${profile.firstName ? ', ' + profile.firstName : ''}!`, text: 'Je bent succesvol ingelogd.' });
      else this.toastr.show({ type: 'success', title: `Welkom terug${profile.firstName ? ', ' + profile.firstName : ''}!`, text: 'Je bent succesvol ingelogd.' });

      this.navigationService.navigateTo(redirectTo);

    
    } catch (error: any) {
      this.isLoginFailed = true;
      this.formError = this.supabaseErrorService.translate(error?.message);
    }
    
  }

  navigateTo(path: string) {
    const queryParams = { ...this.route.snapshot.queryParams };
  
    this.router.navigate([path], { queryParams });
  }
}



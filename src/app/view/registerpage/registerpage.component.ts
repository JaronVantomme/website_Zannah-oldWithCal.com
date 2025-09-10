import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { AuthenticationService } from '../../services/authentication.service';
import { ChangeDetectorRef } from '@angular/core';
import { User } from '../../Models/user.model';
import { initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';
import { SupabaseErrorService } from '../../services/supabaseError.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../services/toaster.service';
import { UserStoreService } from '../../services/user-store.service';
import { EmailService } from '../../services/email.service';

@Component({
  selector: 'app-registerpage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './registerpage.component.html',
  styleUrl: './registerpage.component.css'
})
export class RegisterpageComponent {
  public passwordHidden = true;
  public confirmPasswordHidden = true;
  public isLoggedin = false;
  public formError: string | null = null;

  public registerForm: FormGroup;

  
  constructor(
    private navigationService: NavigationService,
    private authenticationService: AuthenticationService,
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private supabaseErrorService: SupabaseErrorService,
    private route: ActivatedRoute,
    private toastr: ToastService,
    private router: Router,
    private userStoreService: UserStoreService,
    private emailService: EmailService
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      landCode: ['+32', [Validators.required, this.landCodeValidator]],
      phoneNumber: ['', [Validators.required, this.phoneNumberValidator]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required, Validators.minLength(8)]],
      termsAccepted: [false, Validators.requiredTrue]
    }, { validators: this.passwordsMatchValidator });
    // initializeApp(environment.firebaseConfig);
  }

  landCodeValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const landCodePattern = /^\+\d{2}$/;
    return landCodePattern.test(control.value) ? null : { invalidLandCode: true };
  }

  phoneNumberValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const phoneNumberPattern = /^\d{9}$/;
    return phoneNumberPattern.test(control.value) ? null : { invalidPhoneNumber: true };
  }

  passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordsMismatch: true };
  }
  
  togglePasswordVisibility() {
    this.passwordHidden = !this.passwordHidden;
    this.cd.detectChanges();
  }

  toggleComfirmPasswordVisibility() {
    this.confirmPasswordHidden = !this.confirmPasswordHidden;
    this.cd.detectChanges();
  }

  async onSubmit() {
    this.formError = null;
    this.registerForm.markAllAsTouched();
  
    if (!this.registerForm.valid) {
      this.setFormError();
      return;
    }
  
    this.isLoggedin = true;
  
    try {
      const firstName = this.registerForm.get('firstName')?.value || '';
      const lastName = this.registerForm.get('lastName')?.value || '';
      const email = this.registerForm.get('email')?.value || '';
      const password = this.registerForm.get('password')?.value;
      const phoneNumber = this.registerForm.get('landCode')!.value + this.registerForm.get('phoneNumber')!.value;
  
      const supabaseUser = await this.authenticationService.register(
        email,
        password,
        firstName,
        lastName,
        phoneNumber
      );

      const user: User = {
        id: supabaseUser.id,
        firstName,
        lastName,
        phoneNumber,
        email,
        createdAt: new Date()
      };

      const redirectTo = this.route.snapshot.queryParams['redirectTo'] || 'home';
      if (redirectTo === 'services') this.toastr.show({ type: 'success', title: `Welkom${user.firstName ? ', ' + user.firstName : ''}!`, text: 'Je account is aangemaakt, je kunt nu beginnen met je boeking.' });
      else this.toastr.show({ type: 'success', title: `Welkom${user.firstName ? ', ' + user.firstName : ''}!`, text: 'Je registratie is succesvol voltooid.' });
      
      await this.userStoreService.setUser(user)

      if (user.email && user.firstName) await this.emailService.sendWelcomeEmail(user.email, user.firstName).subscribe();
  
      this.navigationService.navigateTo(redirectTo);
  
    } catch (error: any) {
      this.formError = this.supabaseErrorService.translate(error?.message);
    }
  }
  

  setFormError() {
    const errors: { [key: string]: string } = {};
  
    for (const controlName in this.registerForm.controls) {
      const control = this.registerForm.get(controlName);
      if (control?.invalid && (control.dirty || control.touched)) {
        const controlErrors = control.errors;
        if (controlErrors) {
          if (controlErrors['required']) {
            errors['required'] = 'Alle velden zijn verplicht.';
          }
          if (controlErrors['email']) {
            errors['email'] = 'Ongeldig email adres.';
          }
          if (controlErrors['minlength']) {
            const requiredLength = controlErrors['minlength'].requiredLength;
            errors['minlength'] = `Wachtwoord min. ${requiredLength} tekens lang.`;
          }
          if (controlErrors['invalidLandCode']) {
            errors['invalidLandCode'] = 'Landcode moet + en 2 cijfers zijn.';
          }
          if (controlErrors['invalidPhoneNumber']) {
            errors['invalidPhoneNumber'] = 'Gsm-nummer moet 9 cijfers zijn.';
          }
        }
      }
    }
  
    if (this.registerForm.errors?.['passwordsMismatch']) {
      errors['passwordsMismatch'] = 'Wachtwoorden zijn niet gelijk.';
    }
  
    // Prioritize errors
    if (errors['required']) {
      this.formError = errors['required'];
    } else if (errors['email']) {
      this.formError = errors['email'];
    } else if (errors['minlength']) {
      this.formError = errors['minlength'];
    } else if (errors['invalidLandCode']) {
      this.formError = errors['invalidLandCode'];
    } else if (errors['invalidPhoneNumber']) {
      this.formError = errors['invalidPhoneNumber'];
    } else if (errors['passwordsMismatch']) {
      this.formError = errors['passwordsMismatch'];
    } else {
      this.formError = null;
    }
  }
  
  
  getControlName(controlName: string): string {
    const controlNames: { [key: string]: string } = {
      firstName: 'Voornaam',
      lastName: 'Achternaam',
      email: 'Email',
      landCode: 'Landcode',
      phoneNumber: 'Telefoonnummer',
      password: 'Wachtwoord',
      confirmPassword: 'Bevestig wachtwoord'
    };
    return controlNames[controlName] || controlName;
  }
  

  navigateTo(path: string) {
    const queryParams = { ...this.route.snapshot.queryParams };
  
    this.router.navigate([path], { queryParams });
  }

  goToLogin() {
    localStorage.setItem('email', this.registerForm.get('email')!.value)
    this.navigateTo('/login')
  }
}

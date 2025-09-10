import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationService } from '../../services/navigation.service';
import { AuthenticationService } from '../../services/authentication.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-forgotpasswordpage',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgotpasswordpage.component.html',
  styleUrl: './forgotpasswordpage.component.css'
})
export class ForgotpasswordpageComponent {
  public isLoggedin = false;
  public showEmailError = false;
  public sendMailSuccess = false;
  public sendMailFailed = false;

  public forgotpasswordForm: any = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor(private authenticationService: AuthenticationService, private router: Router, private route: ActivatedRoute) { }

  onSubmit() {
    this.forgotpasswordForm.markAllAsTouched();
    if (this.forgotpasswordForm.get('email').invalid) this.showEmailError = true;
    if (this.forgotpasswordForm.valid) {
      this.isLoggedin = true;
      this.authenticationService.forgotPassword(this.forgotpasswordForm.get('email').value).then(() => {
        this.sendMailSuccess = true;
      }).catch(() => {
        this.sendMailFailed = true;
      });
    }
  }

  navigateTo(path: string) {
    const queryParams = { ...this.route.snapshot.queryParams };
  
    this.router.navigate([path], { queryParams });
  }
}

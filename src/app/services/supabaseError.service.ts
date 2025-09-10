import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SupabaseErrorService {
  private errorMap: Record<string, string> = {
    'Invalid login credentials': 'Ongeldige inloggegevens.',
    'User already registered': 'Dit e-mailadres is al geregistreerd.',
    'Email not confirmed': 'Bevestig je e-mailadres voordat je kunt inloggen.',
    'Email rate limit exceeded': 'Je hebt te vaak geprobeerd. Probeer het later opnieuw.',
    'User not found': 'Gebruiker niet gevonden.',
    'Password should be at least 6 characters': 'Wachtwoord moet minstens 6 tekens lang zijn.',
    'Token has expired or is invalid': 'De link is verlopen of ongeldig.',
    'Email not found': 'E-mailadres niet gevonden.',
    'Invalid token': 'Ongeldige of verlopen token.',
    'Confirmation token is invalid or expired': 'Bevestigingslink is ongeldig of verlopen.',
    'User already confirmed': 'Je account is al bevestigd.',
    'New password should be different from the old password': 'Het nieuwe wachtwoord moet anders zijn dan het oude wachtwoord.',
    'Invalid email or password': 'Ongeldig e-mailadres of wachtwoord.',
  };

  translate(message: string | undefined | null): string {
    if (!message) return 'Er is iets misgegaan.';
    return this.errorMap[message] || 'Er is iets misgegaan.';
  }
}

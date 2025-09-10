import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

type Party = {
  displayName: string;
  legalName: string;
  roleLabel?: string;
  email: string;
  phone?: string;
  url?: string;
  vat?: string;
  kbo?: string;
  address: {
    street: string;
    postalCode: string;
    city: string;
    country: string;
  };
  dpo?: {
    name: string;
    email: string;
  };
};

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent {
  site = {
    siteName: 'Zannahshoekje',
    siteUrl: 'https://zannahshoekje.be',
    lastUpdatedISO: '2025-08-24',
    lastUpdatedHuman: '24 augustus 2025',
    shopType: 'kappersalon',
  };

  client: Party = {
    displayName: 'Zannahshoekje',
    legalName: 'Zannahshoekje',
    roleLabel: 'kappersalon',
    email: 'info@zannahshoekje.be',
    phone: '+32 468 52 86 69',
    url: 'https://zannahshoekje.be',
    vat: '',
    address: {
      street: '',
      postalCode: '',
      city: '',
      country: ''
    }
  };

  provider: Party = {
    displayName: 'Javoweb',
    legalName: 'Javoweb',
    roleLabel: 'websiteplatform',
    email: 'privacy@javoweb.be',
    url: 'https://javoweb.be',
    phone: undefined,
    vat: 'BE1026.240.303',
    address: {
      street: 'Gentstraat 59',
      postalCode: '8800',
      city: 'Roeselare',
      country: 'België'
    },
    dpo: {
      name: 'Jaron Vantomme',
      email: 'privacy@javoweb.be'
    }
  };

  controllerParty: 'client' | 'provider' = 'provider';

  get controller(): Party { return this.controllerParty === 'provider' ? this.provider : this.client; }
  get processor(): Party { return this.controllerParty === 'provider' ? this.client : this.provider; }

  retention = {
    accountData: '24 maanden na laatste login',
    orderData: '7 jaar (boekhoudkundige bewaarplicht)',
    contactForms: '12 maanden',
    analytics: '14 maanden',
    appointments: '24 maanden na laatste afspraak',
  } as const;

  processors = [
    { name: 'Hostingprovider', purpose: 'Hosting & beveiliging', location: 'EU', dpa: true },
    { name: 'E-maildienst', purpose: 'Transactie-e-mails / contactformulieren', location: 'EU/EEA', dpa: true },
    { name: 'Analytics (Google Analytics)', purpose: 'Statistieken', location: 'EU/VS (met EU-instellingen)', dpa: true }
  ];

  cookies = [
    { provider: 'Google Analytics', name: '_ga', purpose: 'Bezoekersstatistieken', retention: '2 jaar' },
    { provider: 'Google Analytics', name: '_gid', purpose: 'Sessie/statistics', retention: '24 uur' },
    { provider: this.site.siteName, name: 'cookie_consent', purpose: 'Opslaan cookietoestemming', retention: '6 maanden' }
  ];
}
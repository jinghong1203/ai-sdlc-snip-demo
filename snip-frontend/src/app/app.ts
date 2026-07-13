import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

export interface Link {
  code: string;
  url: string;
  shortUrl: string;
  hits: number;
  createdAt: string;
}

// Empty string → relative URLs (/api/links, /:code).
// Works on any origin: Railway, Docker, local bundle (bun start).
// For local ng-serve dev, start the Bun backend separately; the
// browser will still reach it because ng serve proxies nothing by
// default — just open the bundle on :3000 instead of :4200.
const API = '';

@Component({
  selector: 'app-root',
  imports: [FormsModule, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private http = inject(HttpClient);

  // Plain property — updated synchronously by ngModel (template events
  // already trigger change detection in zoneless mode).
  newUrl = '';

  // Signals — Angular 22 zoneless change detection tracks these
  // automatically, so HTTP callback updates are visible immediately.
  links      = signal<Link[]>([]);
  errorMsg   = signal('');
  successUrl = signal('');
  loading    = signal(false);

  constructor() {
    this.loadLinks();
  }

  loadLinks(): void {
    this.http.get<Link[]>(`${API}/api/links`).subscribe({
      next: links => this.links.set(links.slice().reverse()),
      error: () => {},
    });
  }

  shorten(): void {
    const url = this.newUrl.trim();
    if (!url) return;
    this.errorMsg.set('');
    this.successUrl.set('');
    this.loading.set(true);

    this.http.post<Link>(`${API}/api/links`, { url }).subscribe({
      next: link => {
        this.successUrl.set(link.shortUrl);
        this.newUrl = '';
        this.links.update(prev => [link, ...prev]);
        this.loading.set(false);
      },
      error: err => {
        this.errorMsg.set(err.error?.error ?? 'Something went wrong');
        this.loading.set(false);
      },
    });
  }
}

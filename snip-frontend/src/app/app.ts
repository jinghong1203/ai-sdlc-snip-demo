import { Component, inject } from '@angular/core';
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

  newUrl = '';
  links: Link[] = [];
  errorMsg = '';
  successUrl = '';
  loading = false;

  constructor() {
    this.loadLinks();
  }

  loadLinks(): void {
    this.http.get<Link[]>(`${API}/api/links`).subscribe({
      next: links => (this.links = links.slice().reverse()),
      error: () => {},
    });
  }

  shorten(): void {
    const url = this.newUrl.trim();
    if (!url) return;
    this.errorMsg = '';
    this.successUrl = '';
    this.loading = true;

    this.http.post<Link>(`${API}/api/links`, { url }).subscribe({
      next: link => {
        this.successUrl = link.shortUrl;
        this.newUrl = '';
        this.links.unshift(link);
        this.loading = false;
      },
      error: err => {
        this.errorMsg = err.error?.error ?? 'Something went wrong';
        this.loading = false;
      },
    });
  }
}

import { Injectable, computed, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AppLoadingService {
  private readonly pendingHttpRequests = signal(0);
  private readonly pendingNavigations = signal(0);

  readonly isVisible = computed(
    () => this.pendingHttpRequests() > 0 || this.pendingNavigations() > 0
  );

  startHttpRequest(): void {
    this.pendingHttpRequests.update((count) => count + 1);
  }

  finishHttpRequest(): void {
    this.pendingHttpRequests.update((count) => Math.max(0, count - 1));
  }

  startNavigation(): void {
    this.pendingNavigations.update((count) => count + 1);
  }

  finishNavigation(): void {
    this.pendingNavigations.update((count) => Math.max(0, count - 1));
  }
}

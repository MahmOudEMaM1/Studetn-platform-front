import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { appRouteLinks } from '../../core/routing/app-route-paths';
import { AuthSessionService } from '../../core/services/auth-session.service';
import { CatalogTabsApiService } from '../../data-access/catalog/catalog-tabs-api.service';
import { CatalogTab } from '../../data-access/catalog/catalog-tabs.models';

interface TabPreviewScene {
  readonly layout: 'molecule' | 'columns' | 'process' | 'board';
  readonly label: string;
  readonly chips: string[];
}

@Component({
  selector: 'app-course-contents',
  standalone: true,
  imports: [],
  templateUrl: './course-contents.component.html',
  styleUrl: './course-contents.component.scss'
})
export class CourseContentsComponent {
  private readonly localTabImages: Record<string, string> = {
    'analytical chemistry': 'assets/images/Analytical Chemistry.png',
    'general chemistry': 'assets/images/General Chemistry.png',
    'organic chemistry': 'assets/images/Organic Chemistry.png',
    'physical chemistry': 'assets/images/Physical Chemistry.png'
  };

  private readonly destroyRef = inject(DestroyRef);
  private readonly authSession = inject(AuthSessionService);
  private readonly catalogTabsApi = inject(CatalogTabsApiService);
  private readonly router = inject(Router);

  protected readonly tabs = signal<CatalogTab[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly activeUser = this.authSession.currentUser;
  protected readonly hoveredTabId = signal<string | null>(null);

  protected readonly activeUserName = computed(
    () => this.activeUser()?.full_name || this.activeUser()?.username || 'Active user'
  );
  protected readonly activeUserInitial = computed(() =>
    this.activeUserName().trim().charAt(0).toUpperCase() || 'U'
  );

  constructor() {
    this.loadTabs();
  }

  protected trackTab(index: number, tab: CatalogTab): string {
    return `${tab.id}-${index}`;
  }

  protected setHoveredTab(tabId: string): void {
    this.hoveredTabId.set(tabId);
  }

  protected clearHoveredTab(tabId: string): void {
    if (this.hoveredTabId() === tabId) {
      this.hoveredTabId.set(null);
    }
  }

  protected openTab(tabId: string): void {
    void this.router.navigate([appRouteLinks.courseContents, tabId]);
  }

  protected isActionCardVisible(tabId: string): boolean {
    return this.hoveredTabId() === tabId;
  }

  protected topicImageUrl(tab: CatalogTab): string | null {
    const localImage = this.localTabImages[tab.title.trim().toLowerCase()];

    return localImage ?? tab.imageUrl;
  }

  protected previewScene(tab: CatalogTab): TabPreviewScene {
    const title = tab.title.toLowerCase();

    if (title.includes('analytical')) {
      return {
        layout: 'board',
        label: 'Lab analysis',
        chips: ['Titration', 'Spectra', 'Chromatography', 'Sampling']
      };
    }

    if (title.includes('physical')) {
      return {
        layout: 'columns',
        label: 'Energy states',
        chips: ['Heat', 'Phase', 'Kinetics', 'Pressure']
      };
    }

    if (title.includes('organic')) {
      return {
        layout: 'molecule',
        label: 'Reaction map',
        chips: ['Carbon chains', 'Bonds', 'Groups', 'Synthesis']
      };
    }

    if (title.includes('general')) {
      return {
        layout: 'process',
        label: 'Core concepts',
        chips: ['Atoms', 'Moles', 'Solutions', 'Equilibrium']
      };
    }

    return {
      layout: 'board',
      label: 'Course overview',
      chips:
        tab.tags.length > 0
          ? tab.tags.slice(0, 4)
          : tab.title
              .split(' ')
              .filter((segment) => segment.trim().length > 2)
              .slice(0, 4)
    };
  }

  private loadTabs(): void {
    this.catalogTabsApi
      .getTabs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tabs) => {
          this.tabs.set(tabs);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(this.extractErrorMessage(error));
          this.isLoading.set(false);
        }
      });
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage =
      'We could not load the tabs right now. Please try again in a moment.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}

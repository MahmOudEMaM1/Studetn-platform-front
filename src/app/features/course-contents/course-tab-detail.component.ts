import { NgTemplateOutlet } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { appRouteLinks } from '../../core/routing/app-route-paths';
import { CatalogTabsApiService } from '../../data-access/catalog/catalog-tabs-api.service';
import {
  CatalogTabDetails,
  CatalogTopic,
  CatalogTopicCategory,
  CatalogTopicDetails,
  CatalogTopicTerm
} from '../../data-access/catalog/catalog-tabs.models';

@Component({
  selector: 'app-course-tab-detail',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  template: `
    <section class="page-shell">
      <img
        class="background-glow"
        src="assets/images/Group 41.png"
        alt=""
        aria-hidden="true"
      />

      <main class="page-layout">
        @if (loadError()) {
          <section class="state-panel state-panel-error">
            <span class="state-badge">Unavailable</span>
            <h2>Tab details could not be loaded</h2>
            <p>{{ loadError() }}</p>
          </section>
        } @else if (!isLoading() && !tabDetails()) {
          <section class="state-panel">
            <span class="state-badge">Empty</span>
            <h2>This tab is not available</h2>
            <p>Return to the catalog and choose another tab.</p>
          </section>
        } @else {
          <section class="detail-page-frame">
            <section
              class="detail-layout"
              [class.detail-layout-collapsed]="isTopicsPanelCollapsed()"
            >
            <aside
              class="topics-panel"
              [class.topics-panel-collapsed]="isTopicsPanelCollapsed()"
            >
              <div class="topics-panel-top">
              <div class="topics-panel-actions">
                <a
                  [routerLink]="routeLinks.courseContents"
                  class="topics-back-link"
                  [attr.aria-label]="isTopicsPanelCollapsed() ? 'Back to tabs' : null"
                >
                  @if (!isTopicsPanelCollapsed()) {
                    <span>Back to tabs</span>
                  } @else {
                    <span aria-hidden="true">←</span>
                  }
                </a>
              </div>

              <div class="topics-panel-head">
                @if (!isTopicsPanelCollapsed()) {
                  <div class="topics-panel-title">
                    <p class="eyebrow">Topics</p>
                    <h2>{{ tabDetails()!.topicsCount }} topics in this tab</h2>
                  </div>
                }

                <button
                  type="button"
                  class="topics-toggle"
                  [attr.aria-label]="
                    isTopicsPanelCollapsed() ? 'Show topics panel' : 'Hide topics panel'
                  "
                  (click)="toggleTopicsPanel()"
                >
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    [class.topics-toggle-icon-collapsed]="isTopicsPanelCollapsed()"
                  >
                    <path d="M15 6L9 12L15 18" />
                  </svg>
                </button>
              </div>
              </div>

              @if (!isTopicsPanelCollapsed()) {
                <div class="topics-list">
                  @for (topic of tabDetails()!.topics; track trackTopic($index, topic)) {
                    <button
                      type="button"
                      class="topic-item"
                      [class.topic-item-active]="selectedTopic()?.id === topic.id"
                      (click)="selectTopic(topic.id)"
                    >
                      <span class="topic-order">{{ topicOrder($index) }}</span>
                      <span class="topic-copy">
                        <strong>{{ topic.title }}</strong>
                        <span>
                          {{ topic.termsCount }} terms - {{ topic.questionsCount }} questions
                        </span>
                      </span>
                    </button>
                  }
                </div>
              }
            </aside>

            <section class="content-panel">
              @if (selectedTopic(); as topic) {
                <div class="content-hero">
                  <div class="hero-copy">
                    <p class="eyebrow">{{ tabDetails()!.title }}</p>
                    <h1>{{ activeTopicTitle() }}</h1>
                    <p>
                      This section belongs to the {{ tabDetails()!.title }} tab and shows the
                      terms returned for the selected topic.
                    </p>
                  </div>

                  
                </div>

                @if (topicDetailsError() && !isTopicDetailsLoading()) {
                  <section class="state-panel state-panel-error content-state-panel">
                    <span class="state-badge">Unavailable</span>
                    <h2>Topic terms could not be loaded</h2>
                    <p>{{ topicDetailsError() }}</p>
                  </section>
                } @else if (topicDetails(); as details) {
                  <div class="content-grid">
                    <div class="terms-panel-head">
                      <p class="eyebrow">Terms</p>
                      <h2>Key concepts in this topic</h2>
                    </div>

                    @if (details.terms.length === 0) {
                      <section class="state-panel content-state-panel">
                        <span class="state-badge">Empty</span>
                        <h2>No terms available yet</h2>
                        <p>This topic does not have term content yet.</p>
                      </section>
                    } @else {
                      <div class="terms-list">
                        @for (term of details.terms; track trackTerm($index, term)) {
                          <article class="term-card">
                            <div class="term-card-head">
                              <span class="term-badge">{{ termOrder($index) }}</span>
                              <h3>{{ term.title }}</h3>
                            </div>

                            <p class="term-explanation">{{ term.explanation }}</p>

                            @if (term.imageUrls.length > 0) {
                              <div class="term-images">
                                @for (imageUrl of term.imageUrls; track imageUrl) {
                                  <img [src]="imageUrl" [alt]="term.title" />
                                }
                              </div>
                            }

                            @if (term.categories.length > 0) {
                              <div class="term-categories">
                                <p class="term-section-label">Categories</p>

                                <div class="category-tree">
                                  <ng-container
                                    *ngTemplateOutlet="
                                      categoryBranch;
                                      context: { $implicit: term.categories, depth: 0 }
                                    "
                                  />
                                </div>
                              </div>
                            }
                          </article>
                        }
                      </div>

                      <div class="quiz-cta">
                        <div class="quiz-cta-copy">
                          <p class="eyebrow">Ready to practice?</p>
                          <h2>Test yourself on this topic</h2>
                          <p>
                            Open a focused quiz built from the currently selected topic and answer
                            each question one by one.
                          </p>
                        </div>

                        <button class="quiz-cta-button" type="button" (click)="openTopicQuiz()">
                          Test yourself
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="content-grid"></div>
                }

              }
            </section>
          </section>
          </section>
        }
      </main>

      <ng-template #categoryBranch let-items let-depth="depth">
        <div class="category-level" [class.category-level-root]="depth === 0">
          @for (category of items; track trackCategory($index, category)) {
            <div class="category-node">
              <div class="category-point" [class.category-point-child]="depth > 0">
                <span class="category-point-marker"></span>

                <div class="category-point-copy">
                  <h4>{{ category.title }}</h4>

                  @if (category.explanation) {
                    <p>{{ category.explanation }}</p>
                  }
                </div>
              </div>

              @if (category.children.length > 0) {
                <div class="category-children">
                  <ng-container
                    *ngTemplateOutlet="
                      categoryBranch;
                      context: { $implicit: category.children, depth: depth + 1 }
                    "
                  />
                </div>
              }
            </div>
          }
        </div>
      </ng-template>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
      }

      .page-shell {
        position: relative;
        height: 100dvh;
        padding: 12px clamp(14px, 2vw, 32px);
        overflow: hidden;
        background: linear-gradient(180deg, #f5efe8 0%, #f6f1ec 100%);
      }

      .background-glow {
        position: absolute;
        left: 50%;
        bottom: -18%;
        width: min(1340px, 95vw);
        transform: translateX(-50%);
        opacity: 0.84;
        pointer-events: none;
      }

      .page-layout {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 16px;
        width: 100%;
        height: 100%;
        margin: 0 auto;
      }

      .topics-panel,
      .content-panel,
      .state-panel,
      .term-card {
        border: 1px solid rgba(198, 189, 216, 0.78);
        background: rgba(255, 255, 255, 0.86);
        box-shadow: 0 24px 70px rgba(103, 90, 120, 0.12);
        backdrop-filter: blur(18px);
      }

      .topics-panel,
      .topics-list,
      .topic-copy,
      .content-panel,
      .content-grid,
      .terms-list,
      .term-images,
      .category-tree,
      .state-panel {
        display: grid;
      }

      .topics-panel,
      .term-card {
        gap: 16px;
      }

      .eyebrow {
        margin: 0;
        color: #6b6078;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      h1,
      h2,
      h3,
      h4,
      p {
        margin: 0;
      }

      .detail-layout {
        display: grid;
        grid-template-columns: 380px minmax(0, 1fr);
        gap: 16px;
        align-items: start;
        height: 100%;
        min-height: 0;
        transition: grid-template-columns 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .detail-page-frame {
        position: relative;
        width: min(90vw, 1720px);
        height: 100%;
        min-height: 0;
        margin-inline: auto;
      }

      .detail-layout-collapsed {
        grid-template-columns: 56px minmax(0, 1fr);
      }

      .topics-panel,
      .content-panel {
        padding: 18px;
        border-radius: 24px;
      }

      .topics-panel {
        height: 100%;
        min-height: 0;
        grid-template-rows: auto minmax(0, 1fr);
        overflow: hidden;
        transition:
          transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 180ms ease,
          border-color 160ms ease;
      }

      .topics-panel-collapsed {
        height: auto;
        padding: 10px 8px;
        align-items: start;
        border: 0;
        background: transparent;
        box-shadow: none;
        backdrop-filter: none;
        overflow: visible;
      }

      .topics-panel-head h2,
      .terms-panel-head h2,
      .hero-copy h1 {
        color: #241924;
      }

      .topics-panel-top {
        position: sticky;
        top: 0;
        z-index: 2;
        display: grid;
        gap: 14px;
        padding-bottom: 14px;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.97) 0%,
          rgba(255, 255, 255, 0.92) 100%
        );
        border-bottom: 1px solid rgba(209, 202, 226, 0.72);
        transition:
          gap 180ms ease,
          padding-bottom 180ms ease,
          margin-bottom 180ms ease,
          transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
          opacity 180ms ease;
      }

      .topics-panel-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .topics-panel-title {
        display: grid;
        gap: 6px;
        min-width: 0;
      }

      .topics-panel-title h2 {
        font-size: 0.96rem;
        line-height: 1.35;
        letter-spacing: -0.02em;
      }

      .topics-panel-actions {
        display: flex;
        justify-content: flex-start;
      }

      .topics-back-link {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 42px;
        padding: 0 16px;
        border: 1px solid rgba(184, 176, 205, 0.82);
        border-radius: 999px;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.95) 0%,
          rgba(248, 244, 255, 0.92) 100%
        );
        color: #3c3046;
        font-size: 0.84rem;
        font-weight: 700;
        text-decoration: none;
        box-shadow: 0 10px 24px rgba(120, 107, 144, 0.08);
        transition:
          transform 140ms ease,
          box-shadow 160ms ease,
          border-color 160ms ease;
      }

      .topics-panel-collapsed .topics-panel-actions {
        justify-content: center;
      }

      .topics-panel-collapsed .topics-back-link {
        min-width: 42px;
        padding: 0;
      }

      .topics-panel-collapsed .topics-panel-head {
        justify-content: center;
      }

      .topics-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 42px;
        height: 42px;
        border: 1px solid rgba(184, 176, 205, 0.82);
        border-radius: 14px;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.95) 0%,
          rgba(245, 242, 255, 0.92) 100%
        );
        color: #524866;
        cursor: pointer;
        flex-shrink: 0;
        box-shadow: 0 10px 24px rgba(120, 107, 144, 0.08);
        transition:
          transform 140ms ease,
          box-shadow 160ms ease,
          border-color 160ms ease;
      }

      .topics-toggle svg {
        width: 18px;
        height: 18px;
        stroke: currentColor;
        stroke-width: 2;
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
        transition: transform 180ms ease;
      }

      .topics-toggle-icon-collapsed {
        transform: rotate(180deg);
      }

      .topics-list {
        gap: 10px;
        min-height: 0;
        max-height: 100%;
        overflow-y: auto;
        padding-top: 6px;
        padding-right: 6px;
        scrollbar-gutter: stable;
        opacity: 1;
        transform: translateX(0);
        transition:
          opacity 140ms ease,
          transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .topic-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 14px;
        align-items: start;
        width: 100%;
        padding: 14px 15px;
        border: 1px solid rgba(190, 183, 216, 0.74);
        border-radius: 16px;
        background: rgba(252, 251, 255, 0.88);
        text-align: left;
        cursor: pointer;
        transition:
          transform 140ms ease,
          border-color 160ms ease,
          box-shadow 160ms ease,
          background 160ms ease;
      }

      .topic-item-active {
        border-color: rgba(121, 208, 201, 0.9);
        background: linear-gradient(
          180deg,
          rgba(240, 255, 251, 0.96) 0%,
          rgba(246, 249, 255, 0.96) 100%
        );
        box-shadow: 0 16px 30px rgba(91, 162, 169, 0.14);
      }

      .topic-order,
      .term-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 40px;
        min-height: 40px;
        border-radius: 12px;
        background: rgba(110, 220, 202, 0.16);
        color: #31736f;
        font-size: 0.86rem;
        font-weight: 800;
      }

      .topic-copy {
        gap: 4px;
      }

      .topic-copy strong,
      .term-card h3,
      .category-point h4 {
        color: #2a2230;
      }

      .topic-copy strong {
        font-size: 0.94rem;
        line-height: 1.35;
      }

      .topic-copy span,
      .hero-copy p,
      .term-explanation,
      .category-point p {
        color: #6d6378;
      }

      .topic-copy span {
        font-size: 0.82rem;
      }

      .topics-panel-collapsed .topics-panel-top {
        gap: 10px;
        justify-items: center;
        padding-bottom: 0;
        margin-bottom: 0;
        background: transparent;
        border-bottom: 0;
      }

      .topics-panel-collapsed .topics-toggle,
      .topics-panel-collapsed .topics-back-link {
        width: 42px;
      }

      .topics-panel-collapsed .topics-list {
        display: none;
      }

      .content-panel {
        position: relative;
        gap: 24px;
        height: 100%;
        max-height: 100%;
        min-height: 0;
        padding-bottom: 96px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scroll-padding-bottom: 120px;
        scrollbar-gutter: stable;
        transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .content-hero,
      .hero-copy,
      .hero-meta,
      .terms-panel-head,
      .term-categories {
        display: grid;
      }

      .content-hero {
        gap: 16px;
        transition:
          opacity 160ms ease,
          transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .hero-copy {
        gap: 14px;
      }

      .hero-copy h1 {
        font-size: clamp(2rem, 4.2vw, 3.2rem);
        line-height: 1;
        letter-spacing: -0.04em;
      }

      .hero-meta {
        grid-template-columns: repeat(2, minmax(0, max-content));
        gap: 10px;
      }

      .hero-meta span {
        display: inline-flex;
        align-items: center;
        min-height: 36px;
        padding: 0 14px;
        border-radius: 999px;
        background: rgba(47, 224, 182, 0.12);
        color: #276d62;
        font-size: 0.86rem;
        font-weight: 700;
      }

      .content-grid {
        grid-template-columns: minmax(0, 1fr);
        gap: 14px;
        align-items: start;
        min-height: 0;
        padding-bottom: 42px;
        transition:
          opacity 160ms ease,
          transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .detail-layout-collapsed .content-panel {
        transform: translateX(2px);
      }

      .detail-layout-collapsed .content-hero,
      .detail-layout-collapsed .content-grid {
        transform: translateX(4px);
      }

      .topics-back-link:hover,
      .topics-toggle:hover {
        transform: translateY(-1px) scale(1.02);
        box-shadow: 0 14px 28px rgba(120, 107, 144, 0.12);
      }

      .topic-item:hover {
        transform: translateY(-1px);
        border-color: rgba(158, 205, 206, 0.92);
        box-shadow: 0 12px 24px rgba(91, 162, 169, 0.1);
      }

      .term-card,
      .category-card {
        padding: 22px;
        border-radius: 22px;
      }

      .content-state-panel {
        text-align: left;
      }

      .term-images img {
        display: block;
        width: 100%;
        object-fit: cover;
      }

      .terms-list {
        gap: 16px;
      }

      .quiz-cta,
      .quiz-cta-copy {
        display: grid;
      }

      .quiz-cta {
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 18px;
        align-items: center;
        padding: 22px 24px;
        border: 1px solid rgba(198, 189, 216, 0.74);
        border-radius: 24px;
        background: linear-gradient(
          135deg,
          rgba(250, 251, 255, 0.96) 0%,
          rgba(240, 255, 251, 0.94) 100%
        );
        box-shadow: 0 20px 40px rgba(103, 90, 120, 0.08);
      }

      .quiz-cta-copy {
        gap: 10px;
      }

      .quiz-cta-copy h2 {
        color: #241924;
        font-size: clamp(1.45rem, 2vw, 1.8rem);
        line-height: 1.1;
        letter-spacing: -0.03em;
      }

      .quiz-cta-copy p:not(.eyebrow) {
        color: #665a70;
      }

      .quiz-cta-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 54px;
        padding: 0 20px;
        border: 0;
        border-radius: 16px;
        background: linear-gradient(135deg, #2f2638 0%, #3b3046 100%);
        color: #fff;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 18px 34px rgba(47, 38, 56, 0.2);
        transition:
          transform 140ms ease,
          box-shadow 160ms ease,
          filter 160ms ease;
      }

      .quiz-cta-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 22px 38px rgba(47, 38, 56, 0.24);
        filter: brightness(1.03);
      }

      .term-card {
        background: rgba(252, 251, 255, 0.9);
      }

      .term-card-head {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        gap: 14px;
        align-items: start;
      }

      .term-card h3 {
        font-size: 1.1rem;
        line-height: 1.3;
      }

      .term-explanation {
        font-size: 0.98rem;
        line-height: 1.75;
      }

      .term-images {
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 12px;
      }

      .term-images img {
        height: 180px;
        border-radius: 16px;
      }

      .term-categories {
        gap: 12px;
      }

      .category-tree,
      .category-level,
      .category-node,
      .category-children,
      .category-point-copy {
        display: grid;
      }

      .category-tree,
      .category-level,
      .category-node {
        gap: 12px;
      }

      .term-section-label {
        color: #544a63;
        font-size: 0.84rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .category-point {
        grid-template-columns: auto minmax(0, 1fr);
        gap: 12px;
        align-items: start;
        padding: 16px 18px;
        border-radius: 18px;
        background: rgba(248, 251, 253, 0.92);
      }

      .category-point-child {
        background: rgba(251, 252, 255, 0.9);
      }

      .category-point-marker {
        width: 10px;
        height: 10px;
        margin-top: 7px;
        border-radius: 50%;
        background: linear-gradient(135deg, #39d7b8 0%, #67d1dc 100%);
      }

      .category-children {
        gap: 12px;
        margin-left: 26px;
        padding-left: 18px;
        border-left: 1px solid rgba(188, 216, 212, 0.82);
      }

      .state-panel {
        gap: 12px;
        padding: 28px;
        border-radius: 26px;
        text-align: center;
      }

      .state-panel-error {
        border-color: rgba(194, 119, 136, 0.48);
        background: rgba(255, 245, 247, 0.92);
      }

      .state-badge {
        display: inline-flex;
        justify-self: center;
        align-items: center;
        min-height: 32px;
        padding: 0 12px;
        border-radius: 999px;
        background: rgba(47, 224, 182, 0.14);
        color: #237866;
        font-size: 0.8rem;
        font-weight: 800;
      }

      @media (max-width: 1080px) {
        .detail-layout {
          grid-template-columns: 1fr;
          height: auto;
          min-height: 0;
        }

        .detail-layout-collapsed {
          grid-template-columns: 1fr;
        }

        .topics-panel {
          height: auto;
          max-height: 420px;
        }

        .content-panel {
          height: auto;
          max-height: calc(100dvh - 150px);
        }

        .topics-list {
          overflow-y: auto;
        }
      }

      @media (max-width: 960px) {
        .detail-page-frame {
          width: min(100%, 1720px);
        }

        .page-shell {
          padding: 12px;
        }
      }

      @media (max-width: 640px) {
        .page-shell {
          padding: 10px;
        }

        .topics-panel,
        .content-panel,
        .term-card,
        .category-point,
        .state-panel {
          padding: 18px;
        }

        .hero-meta,
        .term-card-head,
        .quiz-cta {
          grid-template-columns: 1fr;
        }

        .term-badge {
          justify-self: start;
        }

        .quiz-cta-button {
          width: 100%;
        }
      }
    `
  ]
})
export class CourseTabDetailComponent {
  private readonly localTabImages: Record<string, string> = {
    'analytical chemistry': 'assets/images/Analytical Chemistry.png',
    'general chemistry': 'assets/images/General Chemistry.png',
    'organic chemistry': 'assets/images/Organic Chemistry.png',
    'physical chemistry': 'assets/images/Physical Chemistry.png'
  };

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalogTabsApi = inject(CatalogTabsApiService);

  private topicRequestVersion = 0;

  protected readonly tabDetails = signal<CatalogTabDetails | null>(null);
  protected readonly topicDetails = signal<CatalogTopicDetails | null>(null);
  protected readonly selectedTopicId = signal<string | null>(null);
  protected readonly isLoading = signal(true);
  protected readonly isTopicDetailsLoading = signal(false);
  protected readonly loadError = signal('');
  protected readonly topicDetailsError = signal('');
  protected readonly isTopicsPanelCollapsed = signal(false);
  protected readonly routeLinks = appRouteLinks;

  protected readonly selectedTopic = computed(() => {
    const topicId = this.selectedTopicId();

    return (
      this.tabDetails()?.topics.find((topic) => topic.id === topicId) ??
      this.tabDetails()?.topics[0] ??
      null
    );
  });

  protected readonly activeTopicTitle = computed(
    () => this.topicDetails()?.title || this.selectedTopic()?.title || 'Topic details'
  );

  protected readonly tabImageUrl = computed(() => {
    const title = this.tabDetails()?.title.trim().toLowerCase();

    return title ? this.localTabImages[title] ?? null : null;
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('tabId')?.trim() ?? ''),
        switchMap((tabId) => this.catalogTabsApi.getTabById(tabId)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (details) => {
          this.tabDetails.set(details);
          this.selectedTopicId.set(details.topics[0]?.id ?? null);
          this.topicDetails.set(null);
          this.loadError.set('');
          this.isLoading.set(false);

          if (details.topics[0]?.id) {
            this.loadTopicDetails(details.topics[0].id);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(this.extractTabErrorMessage(error));
          this.isLoading.set(false);
        }
      });
  }

  protected selectTopic(topicId: string): void {
    if (this.selectedTopicId() === topicId && this.topicDetails()?.id === topicId) {
      return;
    }

    this.selectedTopicId.set(topicId);
    this.loadTopicDetails(topicId);
  }

  protected toggleTopicsPanel(): void {
    this.isTopicsPanelCollapsed.update((value) => !value);
  }

  protected openTopicQuiz(): void {
    const topicId = this.selectedTopic()?.id;
    const tabId = this.tabDetails()?.id;
    const topicTitle = this.selectedTopic()?.title;
    const tabTitle = this.tabDetails()?.title;

    if (!topicId) {
      return;
    }

    void this.router.navigate([appRouteLinks.quiz, topicId], {
      queryParams: {
        ...(tabId ? { tabId } : {}),
        ...(topicTitle ? { topicTitle } : {}),
        ...(tabTitle ? { tabTitle } : {})
      }
    });
  }

  protected trackTopic(index: number, topic: CatalogTopic): string {
    return `${topic.id}-${index}`;
  }

  protected trackTerm(index: number, term: CatalogTopicTerm): string {
    return `${term.id}-${index}`;
  }

  protected trackCategory(index: number, category: CatalogTopicCategory): string {
    return `${category.id}-${index}`;
  }

  protected topicOrder(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  protected termOrder(index: number): string {
    return String(index + 1).padStart(2, '0');
  }

  private loadTopicDetails(topicId: string): void {
    const requestVersion = ++this.topicRequestVersion;

    this.isTopicDetailsLoading.set(true);
    this.topicDetailsError.set('');

    this.catalogTabsApi
      .getTopicById(topicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (details) => {
          if (requestVersion !== this.topicRequestVersion) {
            return;
          }

          this.topicDetails.set(details);
          this.topicDetailsError.set('');
          this.isTopicDetailsLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          if (requestVersion !== this.topicRequestVersion) {
            return;
          }

          this.topicDetailsError.set(this.extractTopicErrorMessage(error));
          this.isTopicDetailsLoading.set(false);
        }
      });
  }

  private extractTabErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage =
      'We could not load this tab right now. Please go back and try again.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }

  private extractTopicErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage =
      'We could not load the terms for this topic right now. Please try another topic or refresh.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}

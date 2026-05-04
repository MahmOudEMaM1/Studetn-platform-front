import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexNoData,
  ApexPlotOptions,
  ApexResponsive,
  ApexStates,
  ApexStroke,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  ChartComponent
} from 'ng-apexcharts';

import { AuthSessionService } from '../../core/services/auth-session.service';
import { StudentProgressApiService } from '../../data-access/student/student-progress-api.service';
import {
  StudentProgress,
  StudentQuizAttemptChartItem
} from '../../data-access/student/student-progress.models';

type ProgressChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  legend: ApexLegend;
  markers: ApexMarkers;
  noData: ApexNoData;
  states: ApexStates;
  responsive: ApexResponsive[];
  colors: string[];
};

interface ProgressMetricCard {
  readonly label: string;
  readonly chartLabel: string;
  readonly value: number;
  readonly note: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './student-dashboard.component.html',
  styleUrl: './student-dashboard.component.scss'
})
export class StudentDashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authSession = inject(AuthSessionService);
  private readonly studentProgressApi = inject(StudentProgressApiService);

  protected readonly progress = signal<StudentProgress | null>(null);
  protected readonly attemptsHistory = signal<StudentQuizAttemptChartItem[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly loadError = signal('');
  protected readonly activeUser = this.authSession.currentUser;

  protected readonly activeUserName = computed(
    () => this.activeUser()?.full_name || this.activeUser()?.username || 'Student'
  );

  protected readonly metrics = computed<ProgressMetricCard[]>(() => {
    const progress = this.progress();

    if (!progress) {
      return [];
    }

    return [
      {
        label: 'Completed Quizzes',
        chartLabel: 'Completed',
        value: progress.completedQuizzes,
        note: 'Finished assessments'
      },
      {
        label: 'Attempts Count',
        chartLabel: 'Attempts',
        value: progress.attemptsCount,
        note: 'Total quiz attempts'
      },
      {
        label: 'Average Score',
        chartLabel: 'Average',
        value: progress.averageScore,
        note: 'Mean score so far'
      },
      {
        label: 'Best Score',
        chartLabel: 'Best',
        value: progress.bestScore,
        note: 'Highest recorded score'
      },
      {
        label: 'Passed Quizzes',
        chartLabel: 'Passed',
        value: progress.passedQuizzesCount,
        note: 'Passed successfully'
      },
      {
        label: 'Failed Quizzes',
        chartLabel: 'Failed',
        value: progress.failedQuizzesCount,
        note: 'Need another try'
      }
    ];
  });

  protected readonly chartOptions = computed<ProgressChartOptions | null>(() => {
    const attempts = this.attemptsHistory();

    if (!this.progress()) {
      return null;
    }

    return {
      series: [
        {
          name: 'Score %',
          data: attempts.map((attempt) => Number(attempt.scorePercentage.toFixed(2)))
        }
      ],
      chart: {
        type: 'line',
        height: 420,
        toolbar: {
          show: false
        },
        animations: {
          enabled: true,
          speed: 460,
          animateGradually: {
            enabled: true,
            delay: 70
          }
        },
        fontFamily: 'Outfit, sans-serif',
        foreColor: '#6817c4',
        background: 'transparent'
      },
      colors: ['#55c9d8'],
      plotOptions: {},
      dataLabels: {
        enabled: false,
        formatter: (value: number) => `${Number(value).toFixed(value % 1 === 0 ? 0 : 2)}`,
        style: {
          fontSize: '12px',
          fontWeight: '700',
          colors: ['#2d2433']
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.34,
          opacityTo: 0.08,
          stops: [0, 90, 100]
        }
      },
      stroke: {
        show: true,
        curve: 'smooth',
        width: 4
      },
      markers: {
        size: 6,
        strokeWidth: 0,
        hover: {
          size: 7
        }
      },
      noData: {
        text: 'No quiz attempts yet',
        align: 'center',
        verticalAlign: 'middle',
        style: {
          color: '#7a6f86',
          fontSize: '14px',
          fontFamily: 'Outfit, sans-serif'
        }
      },
      grid: {
        borderColor: 'rgba(194, 186, 215, 0.34)',
        strokeDashArray: 5,
        padding: {
          left: 10,
          right: 14,
          bottom: 8
        }
      },
      legend: {
        show: false
      },
      states: {
        hover: {
          filter: {
            type: 'none'
          }
        },
        active: {
          filter: {
            type: 'none'
          }
        }
      },
      xaxis: {
        categories: attempts.map((attempt) => `Attempt ${attempt.attemptOrder}`),
        labels: {
          hideOverlappingLabels: false,
          trim: false,
          rotate: 0,
          minHeight: 42,
          maxHeight: 42,
          style: {
            fontSize: '12px',
            fontWeight: 600,
            colors: attempts.map(() => '#5b5068')
          }
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        tooltip: {
          enabled: false
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        title: {
          text: 'Score %',
          style: {
            color: '#7a6f86',
            fontSize: '12px',
            fontWeight: 700
          }
        },
        labels: {
          formatter: (value: number) => `${value.toFixed(0)}%`,
          style: {
            colors: ['#7a6f86']
          }
        }
      },
      tooltip: {
        fillSeriesColor: false,
        marker: {
          show: true
        },
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const attempt = attempts[dataPointIndex];

          if (!attempt) {
            return '';
          }

          return `
            <div style="padding:12px 14px; min-width: 220px; font-family: Outfit, sans-serif;">
              <div style="font-weight:700; color:#2f2638; margin-bottom:6px;">${attempt.topicName}</div>
              <div style="color:#665a70; font-size:12px; margin-bottom:4px;">Attempt ${attempt.attemptOrder}</div>
              <div style="color:#665a70; font-size:12px; margin-bottom:4px;">Score: ${attempt.scorePercentage}%</div>
              <div style="color:${attempt.passed ? '#27835f' : '#b34b65'}; font-size:12px; font-weight:700; margin-bottom:4px;">
                ${attempt.passed ? 'Passed' : 'Failed'}
              </div>
              <div style="color:#7a6f86; font-size:12px;">Submitted: ${attempt.submittedAt}</div>
            </div>
          `;
        },
        y: {
          formatter: (value: number) => `${value}%`
        }
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: {
              height: 360
            },
            markers: {
              size: 5
            },
            xaxis: {
              labels: {
                rotate: -20
              }
            }
          }
        }
      ]
    };
  });

  protected readonly overviewCopy = computed(() => {
    const progress = this.progress();

    if (!progress) {
      return 'Your latest progress metrics will appear here.';
    }

    return `You completed ${progress.completedQuizzes} quizzes with an average score of ${progress.averageScore} and a best score of ${progress.bestScore}.`;
  });

  constructor() {
    forkJoin({
      progress: this.studentProgressApi.getProgress(),
      attempts: this.studentProgressApi.getQuizAttemptsChart()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ progress, attempts }) => {
          this.progress.set(progress);
          this.attemptsHistory.set(attempts);
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
      'We could not load the student progress dashboard right now. Please try again in a moment.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}

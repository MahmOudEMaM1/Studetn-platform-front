import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexNoData,
  ApexNonAxisChartSeries,
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
import { TeacherDashboardApiService } from '../../data-access/teacher/teacher-dashboard-api.service';
import {
  TeacherDashboardStudentSummary,
  TeacherDashboardSummary,
  TeacherDashboardWeakTopic,
  TeacherQuizAttemptAnswer,
  TeacherQuizAttemptAnswerChoice,
  TeacherQuizAttemptDetail,
  TeacherStudentListItem,
  TeacherStudentProgress,
  TeacherStudentScoreRange,
  TeacherStudentTopicProgress,
  TeacherStudentTopicQuizAttempts
} from '../../data-access/teacher/teacher-dashboard.models';

type TeacherAnalysisView = 'overview' | 'students' | 'progress' | 'attempts' | 'review';
type StudentScoreChartView = 'average' | 'range';

type WeakTopicsChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  states: ApexStates;
  noData: ApexNoData;
  responsive: ApexResponsive[];
  colors: string[];
};

type AxisChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  stroke: ApexStroke;
  markers: ApexMarkers;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  grid: ApexGrid;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  states: ApexStates;
  noData: ApexNoData;
  responsive: ApexResponsive[];
  colors: string[];
};

type PassFailChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  tooltip: ApexTooltip;
  stroke: ApexStroke;
  fill: ApexFill;
  states: ApexStates;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  colors: string[];
  noData: ApexNoData;
};

interface TeacherMetricCard {
  readonly label: string;
  readonly value: number;
  readonly note: string;
}

interface TeacherAnalysisCategory {
  readonly id: TeacherAnalysisView;
  readonly label: string;
  readonly endpoint: string;
  readonly description: string;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [ChartComponent],
  templateUrl: './teacher-dashboard.component.html',
  styleUrl: './teacher-dashboard.component.scss'
})
export class TeacherDashboardComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly authSession = inject(AuthSessionService);
  private readonly teacherDashboardApi = inject(TeacherDashboardApiService);

  protected readonly summary = signal<TeacherDashboardSummary | null>(null);
  protected readonly students = signal<TeacherStudentListItem[]>([]);
  protected readonly studentScoreRanges = signal<TeacherStudentScoreRange[]>([]);
  protected readonly studentProgress = signal<TeacherStudentProgress | null>(null);
  protected readonly topicAttempts = signal<TeacherStudentTopicQuizAttempts | null>(null);
  protected readonly selectedAttemptDetail = signal<TeacherQuizAttemptDetail | null>(null);

  protected readonly activeAnalysis = signal<TeacherAnalysisView>('overview');
  protected readonly activeStudentScoreChart = signal<StudentScoreChartView>('average');
  protected readonly selectedStudentId = signal<number | null>(null);
  protected readonly selectedTopicId = signal<number | null>(null);
  protected readonly selectedAttemptId = signal<number | null>(null);
  protected readonly isStudentScoreChartExpanded = signal(false);

  protected readonly isLoading = signal(true);
  protected readonly isAnalysisLoading = signal(false);
  protected readonly isStudentScoreRangesLoading = signal(false);
  private readonly hasLoadedStudentScoreRanges = signal(false);
  protected readonly loadError = signal('');
  protected readonly analysisError = signal('');
  protected readonly studentScoreRangesError = signal('');
  protected readonly activeUser = this.authSession.currentUser;

  protected readonly analysisCategories: TeacherAnalysisCategory[] = [
    {
      id: 'overview',
      label: 'Teacher overview',
      endpoint: '/teacher/dashboard',
      description: 'Class summary, pass/fail split, weak topics, and highlighted students.'
    },
    {
      id: 'students',
      label: 'Students list',
      endpoint: '/teacher/students',
      description: 'Every student with attempts, completed quizzes, average, and best score.'
    },
    {
      id: 'progress',
      label: 'Student progress',
      endpoint: '/teacher/students/{student_id}/progress',
      description: 'Topic-level progress for the selected learner.'
    },
    {
      id: 'attempts',
      label: 'Topic attempts',
      endpoint: '/teacher/students/{student_id}/topics/{topic_id}/quiz-attempts',
      description: 'All quiz attempts for the selected student and topic.'
    },
    {
      id: 'review',
      label: 'Attempt review',
      endpoint: '/teacher/quiz-attempts/{quiz_attempt_id}',
      description: 'Question-level answer review for one selected attempt.'
    }
  ];

  protected readonly activeUserName = computed(
    () => this.activeUser()?.full_name || this.activeUser()?.username || 'Teacher'
  );

  protected readonly selectedStudent = computed<TeacherStudentListItem | null>(() => {
    const studentId = this.selectedStudentId();
    const students = this.students();

    return students.find((student) => student.studentId === studentId) ?? students[0] ?? null;
  });

  protected readonly selectedTopic = computed<TeacherStudentTopicProgress | null>(() => {
    const topicId = this.selectedTopicId();
    const topics = this.studentProgress()?.topics ?? [];

    return topics.find((topic) => topic.topicId === topicId) ?? topics[0] ?? null;
  });

  protected readonly selectedAttempt = computed(() => {
    const attemptId = this.selectedAttemptId();
    const attempts = this.topicAttempts()?.attempts ?? [];

    return attempts.find((attempt) => attempt.attemptId === attemptId) ?? attempts[0] ?? null;
  });

  protected readonly sortedStudents = computed(() =>
    [...this.students()].sort(
      (firstStudent, secondStudent) =>
        secondStudent.averageScore - firstStudent.averageScore ||
        secondStudent.attemptsCount - firstStudent.attemptsCount ||
        firstStudent.fullName.localeCompare(secondStudent.fullName)
    )
  );

  protected readonly sortedStudentScoreRanges = computed(() =>
    [...this.studentScoreRanges()].sort(
      (firstStudent, secondStudent) =>
        secondStudent.bestScore - firstStudent.bestScore ||
        secondStudent.lowScore - firstStudent.lowScore ||
        firstStudent.fullName.localeCompare(secondStudent.fullName)
    )
  );

  protected readonly studentScoreChartNote = computed(() =>
    this.activeStudentScoreChart() === 'average'
      ? 'Sorted by average score'
      : 'Sorted by best score'
  );

  protected readonly studentListMetrics = computed<TeacherMetricCard[]>(() => {
    const students = this.students();
    const studentsWithAttempts = students.filter((student) => student.attemptsCount > 0);
    const topScore = students.reduce(
      (bestScore, student) => Math.max(bestScore, student.bestScore),
      0
    );
    const averageScore =
      studentsWithAttempts.length > 0
        ? Number(
            (
              studentsWithAttempts.reduce(
                (totalScore, student) => totalScore + student.averageScore,
                0
              ) / studentsWithAttempts.length
            ).toFixed(2)
          )
        : 0;

    return [
      {
        label: 'Students',
        value: students.length,
        note: `${studentsWithAttempts.length} have submitted attempts`
      },
      {
        label: 'Class Average',
        value: averageScore,
        note: 'Across students with attempts'
      },
      {
        label: 'Top Score',
        value: topScore,
        note: 'Best score in this roster'
      },
      {
        label: 'No Attempts',
        value: students.length - studentsWithAttempts.length,
        note: 'Students to follow up with'
      }
    ];
  });

  protected readonly metrics = computed<TeacherMetricCard[]>(() => {
    const summary = this.summary();

    if (!summary) {
      return [];
    }

    return [
      {
        label: 'Students',
        value: summary.studentsCount,
        note: `${summary.studentsWithAttemptsCount} with quiz attempts`
      },
      {
        label: 'Attempts',
        value: summary.totalAttemptsCount,
        note: 'Submitted across all tracked quizzes'
      },
      {
        label: 'Average Score',
        value: summary.averageScore,
        note: 'Current teacher-wide average'
      },
      {
        label: 'Passed',
        value: summary.passedAttemptsCount,
        note: 'Attempts above the passing threshold'
      }
    ];
  });

  protected readonly studentProgressMetrics = computed<TeacherMetricCard[]>(() => {
    const progress = this.studentProgress();

    if (!progress) {
      return [];
    }

    return [
      {
        label: 'Completed',
        value: progress.summary.completedQuizzes,
        note: 'Completed quizzes'
      },
      {
        label: 'Attempts',
        value: progress.summary.attemptsCount,
        note: 'Total submitted attempts'
      },
      {
        label: 'Average',
        value: progress.summary.averageScore,
        note: 'Average score'
      },
      {
        label: 'Best',
        value: progress.summary.bestScore,
        note: 'Best recorded score'
      }
    ];
  });

  protected readonly passFailChartOptions = computed<PassFailChartOptions | null>(() => {
    const summary = this.summary();

    if (!summary) {
      return null;
    }

    return {
      series: [summary.passedAttemptsCount, summary.failedAttemptsCount],
      chart: {
        type: 'donut',
        height: 310,
        fontFamily: 'Outfit, sans-serif',
        foreColor: '#61556f'
      },
      labels: ['Passed attempts', 'Failed attempts'],
      legend: {
        position: 'bottom',
        fontSize: '13px',
        fontWeight: 700,
        labels: {
          colors: '#5c5168'
        }
      },
      tooltip: {
        y: {
          formatter: (value: number) => `${value} attempts`
        }
      },
      stroke: {
        width: 0
      },
      fill: {
        opacity: 1
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
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total attempts',
                formatter: () => `${summary.totalAttemptsCount}`
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: {
              height: 280
            }
          }
        }
      ],
      colors: ['#24d4bd', '#ff8c9b'],
      noData: {
        text: 'No attempts data available'
      }
    };
  });

  protected readonly weakTopicsChartOptions = computed<WeakTopicsChartOptions | null>(() => {
    const summary = this.summary();
    const weakTopics = summary?.weakTopics ?? [];

    if (!summary) {
      return null;
    }

    return {
      series: [
        {
          name: 'Average score',
          data: weakTopics.map((topic) => Number(topic.averageScore.toFixed(2)))
        }
      ],
      chart: {
        type: 'bar',
        height: 320,
        toolbar: {
          show: false
        },
        fontFamily: 'Outfit, sans-serif',
        foreColor: '#61556f'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          distributed: true,
          borderRadius: 10,
          barHeight: '58%'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value: number) => `${value}%`,
        style: {
          fontSize: '11px',
          fontWeight: '700',
          colors: ['#2f2638']
        }
      },
      fill: {
        opacity: 1
      },
      xaxis: {
        categories: weakTopics.map((topic) => topic.topicName),
        min: 0,
        max: 100,
        labels: {
          formatter: (value: string | number) => `${value}%`
        }
      },
      yaxis: {
        labels: {
          maxWidth: 220,
          style: {
            fontSize: '12px',
            fontWeight: 700,
            colors: weakTopics.map(() => '#5b5068')
          }
        }
      },
      grid: {
        borderColor: 'rgba(194, 186, 215, 0.34)',
        strokeDashArray: 5
      },
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const topic = weakTopics[dataPointIndex];

          if (!topic) {
            return '';
          }

          return `
            <div style="padding:12px 14px; min-width: 220px; font-family: Outfit, sans-serif;">
              <div style="font-weight:700; color:#2f2638; margin-bottom:6px;">${topic.topicName}</div>
              <div style="color:#665a70; font-size:12px; margin-bottom:4px;">Average score: ${topic.averageScore}%</div>
              <div style="color:#665a70; font-size:12px; margin-bottom:4px;">Attempts: ${topic.attemptsCount}</div>
              <div style="color:#b34b65; font-size:12px; font-weight:700;">Failed attempts: ${topic.failedAttemptsCount}</div>
            </div>
          `;
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
      noData: {
        text: 'No weak topics recorded yet'
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: {
              height: 280
            },
            plotOptions: {
              bar: {
                horizontal: true,
                barHeight: '52%'
              }
            }
          }
        }
      ],
      colors: ['#74d8e7', '#59c5df', '#83d8c8', '#7cc7ff', '#a1b8ff']
    };
  });

  protected readonly studentScoresChartOptions = computed<AxisChartOptions>(() => {
    const students = this.sortedStudents();
    const chartHeight = this.studentScoreChartHeight(students.length);
    const compactChart = this.isStudentScoreChartExpanded();

    return {
      series: [
        {
          name: 'Average score',
          data: students.map((student) => Number(student.averageScore.toFixed(2)))
        }
      ],
      chart: this.axisChartBase('bar', chartHeight),
      colors: ['#58d6d2'],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: compactChart ? 5 : 7,
          barHeight: compactChart ? '36%' : '42%',
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 0.92
      },
      stroke: {
        show: true,
        width: 0
      },
      markers: {
        size: 0
      },
      xaxis: {
        categories: students.map((student) => student.fullName),
        min: 0,
        max: 100,
        labels: {
          formatter: (value: string | number) => `${value}%`,
          style: {
            fontSize: compactChart ? '10px' : '12px',
            fontWeight: 700,
            colors: ['#7a6f86']
          }
        }
      },
      yaxis: {
        labels: {
          maxWidth: 220,
          style: {
            fontSize: compactChart ? '10px' : '12px',
            fontWeight: 800,
            colors: students.map(() => '#4d4259')
          }
        }
      },
      grid: this.softGrid(),
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const student = students[dataPointIndex];

          if (!student) {
            return '';
          }

          return this.tooltipShell(
            student.fullName,
            [
              `Average: ${student.averageScore}%`,
              `Best: ${student.bestScore}%`,
              `Completed quizzes: ${student.completedQuizzes}`,
              `Attempts: ${student.attemptsCount}`,
              student.email
            ],
            student.attemptsCount > 0 ? '#1e7b6e' : '#9a6220'
          );
        }
      },
      legend: this.bottomLegend(),
      states: this.neutralStates(),
      noData: {
        text: 'No students data available'
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: {
              height: this.studentScoreChartHeight(students.length, true)
            },
            yaxis: {
              labels: {
                maxWidth: 150
              }
            }
          }
        }
      ]
    };
  });

  protected readonly studentScoreRangeChartOptions = computed<AxisChartOptions>(() => {
    const students = this.sortedStudentScoreRanges();
    const chartHeight = this.studentScoreChartHeight(students.length);
    const compactChart = this.isStudentScoreChartExpanded();

    return {
      series: [
        {
          name: 'Best score',
          data: students.map((student) => Number(student.bestScore.toFixed(2)))
        },
        {
          name: 'Low score',
          data: students.map((student) => Number(student.lowScore.toFixed(2)))
        }
      ],
      chart: this.axisChartBase('bar', chartHeight),
      colors: ['#58d6d2', '#ff8c9b'],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: compactChart ? 5 : 7,
          barHeight: compactChart ? '44%' : '52%'
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 0.94
      },
      stroke: {
        show: true,
        width: 0
      },
      markers: {
        size: 0
      },
      xaxis: {
        categories: students.map((student) => student.fullName),
        min: 0,
        max: 100,
        labels: {
          formatter: (value: string | number) => `${value}%`,
          style: {
            fontSize: compactChart ? '10px' : '12px',
            fontWeight: 700,
            colors: ['#7a6f86']
          }
        }
      },
      yaxis: {
        labels: {
          maxWidth: 220,
          style: {
            fontSize: compactChart ? '10px' : '12px',
            fontWeight: 800,
            colors: students.map(() => '#4d4259')
          }
        }
      },
      grid: this.softGrid(),
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const student = students[dataPointIndex];

          if (!student) {
            return '';
          }

          return this.tooltipShell(
            student.fullName,
            [
              `Best: ${student.bestScore}%`,
              `Low: ${student.lowScore}%`,
              `Attempts: ${student.attemptsCount}`,
              student.email
            ],
            student.attemptsCount > 0 ? '#1e7b6e' : '#9a6220'
          );
        }
      },
      legend: this.bottomLegend(),
      states: this.neutralStates(),
      noData: {
        text: this.isStudentScoreRangesLoading()
          ? 'Loading score ranges...'
          : 'No score range data available'
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: {
              height: this.studentScoreChartHeight(students.length, true)
            },
            yaxis: {
              labels: {
                maxWidth: 150
              }
            }
          }
        }
      ]
    };
  });

  protected readonly activeStudentScoreChartOptions = computed(() =>
    this.activeStudentScoreChart() === 'average'
      ? this.studentScoresChartOptions()
      : this.studentScoreRangeChartOptions()
  );

  protected readonly topicProgressChartOptions = computed<AxisChartOptions>(() => {
    const topics = this.studentProgress()?.topics ?? [];

    return {
      series: [
        {
          name: 'Best score',
          data: topics.map((topic) => Number(topic.bestScore.toFixed(2)))
        }
      ],
      chart: this.axisChartBase('bar', 360),
      colors: ['#58d6d2'],
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: '44%'
        }
      },
      dataLabels: {
        enabled: false
      },
      fill: {
        opacity: 0.94
      },
      stroke: {
        show: true,
        width: 0
      },
      markers: {
        size: 0
      },
      xaxis: {
        categories: topics.map((topic) => topic.topicName),
        min: 0,
        max: 100,
        labels: {
          formatter: (value: string | number) => `${value}%`
        }
      },
      yaxis: {
        labels: {
          maxWidth: 260,
          style: {
            fontSize: '12px',
            fontWeight: 700,
            colors: topics.map(() => '#5b5068')
          }
        }
      },
      grid: this.softGrid(),
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const topic = topics[dataPointIndex];

          if (!topic) {
            return '';
          }

          return this.tooltipShell(
            topic.topicName,
            [
              `Best: ${topic.bestScore}%`,
              `Attempts: ${topic.attemptsCount}`,
              topic.isImproving ? 'Trend: improving' : 'Trend: needs follow-up'
            ],
            topic.isImproving ? '#1e7b6e' : '#9a6220'
          );
        }
      },
      legend: this.bottomLegend(),
      states: this.neutralStates(),
      noData: {
        text: 'No topic progress recorded yet'
      },
      responsive: this.axisResponsive()
    };
  });

  protected readonly attemptsTrendChartOptions = computed<AxisChartOptions>(() => {
    const attempts = this.topicAttempts()?.attempts ?? [];

    return {
      series: [
        {
          name: 'Score %',
          data: attempts.map((attempt) => Number(attempt.scorePercentage.toFixed(2)))
        }
      ],
      chart: this.axisChartBase('line', 340),
      colors: ['#55c9d8'],
      plotOptions: {},
      dataLabels: {
        enabled: false
      },
      fill: {
        type: 'gradient',
        gradient: {
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
          size: 8
        }
      },
      xaxis: {
        categories: attempts.map((attempt) => this.formatDateLabel(attempt.submittedAt)),
        labels: {
          rotate: -18,
          trim: false,
          style: {
            fontSize: '12px',
            fontWeight: 700,
            colors: attempts.map(() => '#5b5068')
          }
        }
      },
      yaxis: this.scoreYAxis(),
      grid: this.softGrid(),
      tooltip: {
        custom: ({ dataPointIndex }: { dataPointIndex: number }) => {
          const attempt = attempts[dataPointIndex];

          if (!attempt) {
            return '';
          }

          return this.tooltipShell(
            `Attempt #${attempt.attemptId}`,
            [
              `Score: ${attempt.scorePercentage}%`,
              `Correct: ${attempt.correctAnswersCount}/${attempt.totalQuestions}`,
              attempt.passed ? 'Status: Passed' : 'Status: Failed',
              `Submitted: ${attempt.submittedAt}`
            ],
            attempt.passed ? '#1e7b6e' : '#b34b65'
          );
        }
      },
      legend: {
        show: false
      },
      states: this.neutralStates(),
      noData: {
        text: 'No attempts for this topic yet'
      },
      responsive: this.axisResponsive()
    };
  });

  protected readonly attemptResultChartOptions = computed<PassFailChartOptions | null>(() => {
    const detail = this.selectedAttemptDetail();

    if (!detail) {
      return null;
    }

    return {
      series: [detail.summary.correctAnswersCount, detail.summary.wrongAnswersCount],
      chart: {
        type: 'donut',
        height: 260,
        fontFamily: 'Outfit, sans-serif',
        foreColor: '#61556f'
      },
      labels: ['Correct', 'Wrong'],
      legend: this.bottomLegend(),
      tooltip: {
        y: {
          formatter: (value: number) => `${value} answers`
        }
      },
      stroke: {
        width: 0
      },
      fill: {
        opacity: 1
      },
      states: this.neutralStates(),
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Score',
                formatter: () => `${detail.summary.scorePercentage}%`
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 900,
          options: {
            chart: {
              height: 250
            }
          }
        }
      ],
      colors: ['#24d4bd', '#ff8c9b'],
      noData: {
        text: 'No attempt result available'
      }
    };
  });

  protected readonly topStudents = computed<TeacherDashboardStudentSummary[]>(
    () => this.summary()?.topStudents ?? []
  );
  protected readonly weakStudents = computed<TeacherDashboardStudentSummary[]>(
    () => this.summary()?.weakStudents ?? []
  );
  protected readonly weakTopics = computed<TeacherDashboardWeakTopic[]>(
    () => this.summary()?.weakTopics ?? []
  );

  constructor() {
    forkJoin({
      summary: this.teacherDashboardApi.getDashboard(),
      students: this.teacherDashboardApi.getStudents()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ summary, students }) => {
          this.summary.set(summary);
          this.students.set(students);
          this.selectedStudentId.set(students[0]?.studentId ?? null);
          this.isLoading.set(false);
        },
        error: (error: HttpErrorResponse) => {
          this.loadError.set(this.extractErrorMessage(error));
          this.isLoading.set(false);
        }
      });
  }

  protected selectAnalysis(analysis: TeacherAnalysisView): void {
    this.activeAnalysis.set(analysis);
    this.analysisError.set('');

    if (analysis === 'progress') {
      this.loadSelectedStudentProgress();
      return;
    }

    if (analysis === 'attempts') {
      this.loadSelectedTopicAttempts();
      return;
    }

    if (analysis === 'review') {
      this.openAttemptReviewAnalysis();
    }
  }

  protected selectStudentScoreChart(chart: StudentScoreChartView): void {
    this.activeStudentScoreChart.set(chart);
    this.studentScoreRangesError.set('');

    if (chart === 'range') {
      this.loadStudentScoreRanges();
    }
  }

  protected selectStudent(studentId: number): void {
    if (this.selectedStudentId() === studentId) {
      return;
    }

    this.selectedStudentId.set(studentId);
    this.selectedTopicId.set(null);
    this.selectedAttemptId.set(null);
    this.studentProgress.set(null);
    this.topicAttempts.set(null);
    this.selectedAttemptDetail.set(null);

    if (this.activeAnalysis() === 'progress') {
      this.loadSelectedStudentProgress();
      return;
    }

    if (this.activeAnalysis() === 'attempts') {
      this.loadSelectedTopicAttempts();
      return;
    }

    if (this.activeAnalysis() === 'review') {
      this.openAttemptReviewAnalysis();
    }
  }

  protected openTopicAttempts(topicId: number): void {
    this.selectedTopicId.set(topicId);
    this.selectedAttemptId.set(null);
    this.topicAttempts.set(null);
    this.selectedAttemptDetail.set(null);
    this.activeAnalysis.set('attempts');
    this.loadSelectedTopicAttempts();
  }

  protected openAttemptReview(attemptId: number): void {
    this.selectedAttemptId.set(attemptId);
    this.selectedAttemptDetail.set(null);
    this.activeAnalysis.set('review');
    this.loadSelectedAttemptDetail();
  }

  protected openStudentScoreChart(): void {
    this.isStudentScoreChartExpanded.set(true);
  }

  protected closeStudentScoreChart(): void {
    this.isStudentScoreChartExpanded.set(false);
  }

  protected isCorrectChoice(
    answer: TeacherQuizAttemptAnswer,
    choice: TeacherQuizAttemptAnswerChoice
  ): boolean {
    return choice.key === answer.correctAnswer || choice.text === answer.correctAnswerText;
  }

  protected isSelectedWrongChoice(
    answer: TeacherQuizAttemptAnswer,
    choice: TeacherQuizAttemptAnswerChoice
  ): boolean {
    const isSelected = choice.key === answer.selectedAnswer || choice.text === answer.selectedAnswerText;

    return isSelected && !this.isCorrectChoice(answer, choice);
  }

  protected formatDateLabel(value: string): string {
    if (!value) {
      return 'No date';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  protected studentInitials(name: string): string {
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return initials || 'S';
  }

  protected scoreStatusLabel(student: TeacherStudentListItem): string {
    if (student.attemptsCount === 0) {
      return 'No attempts';
    }

    if (student.averageScore >= 80) {
      return 'Strong';
    }

    if (student.averageScore >= 60) {
      return 'Stable';
    }

    return 'Needs support';
  }

  private openAttemptReviewAnalysis(): void {
    if (this.topicAttempts()?.attempts.length) {
      this.loadSelectedAttemptDetail();
      return;
    }

    this.loadSelectedTopicAttempts(true);
  }

  private loadStudentScoreRanges(): void {
    if (this.hasLoadedStudentScoreRanges() || this.isStudentScoreRangesLoading()) {
      return;
    }

    this.isStudentScoreRangesLoading.set(true);
    this.studentScoreRangesError.set('');

    this.teacherDashboardApi
      .getStudentScoreRanges()
      .pipe(
        finalize(() => this.isStudentScoreRangesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (scoreRanges) => {
          this.studentScoreRanges.set(scoreRanges);
          this.hasLoadedStudentScoreRanges.set(true);
        },
        error: (error: HttpErrorResponse) => {
          this.studentScoreRangesError.set(this.extractErrorMessage(error));
        }
      });
  }

  private loadSelectedStudentProgress(afterLoad?: () => void): void {
    const studentId = this.resolveSelectedStudentId();

    if (!studentId) {
      this.analysisError.set('No student is available for this analysis yet.');
      return;
    }

    const currentProgress = this.studentProgress();

    if (currentProgress?.student.studentId === studentId) {
      this.ensureSelectedTopic(currentProgress);
      afterLoad?.();
      return;
    }

    this.isAnalysisLoading.set(true);
    this.analysisError.set('');

    this.teacherDashboardApi
      .getStudentProgress(studentId)
      .pipe(
        finalize(() => this.isAnalysisLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (progress) => {
          this.studentProgress.set(progress);
          this.ensureSelectedTopic(progress);
          afterLoad?.();
        },
        error: (error: HttpErrorResponse) => {
          this.analysisError.set(this.extractErrorMessage(error));
        }
      });
  }

  private loadSelectedTopicAttempts(loadReviewAfterAttempts = false): void {
    const studentId = this.resolveSelectedStudentId();

    if (!studentId) {
      this.analysisError.set('No student is available for this analysis yet.');
      return;
    }

    const progress = this.studentProgress();

    if (progress?.student.studentId !== studentId) {
      this.loadSelectedStudentProgress(() => this.loadSelectedTopicAttempts(loadReviewAfterAttempts));
      return;
    }

    const topicId = this.selectedTopicId() ?? progress.topics[0]?.topicId ?? null;

    if (!topicId) {
      this.analysisError.set('This student does not have topic attempts yet.');
      return;
    }

    this.selectedTopicId.set(topicId);

    const currentAttempts = this.topicAttempts();

    if (
      currentAttempts?.student.studentId === studentId &&
      currentAttempts.topic.topicId === topicId
    ) {
      this.ensureSelectedAttempt(currentAttempts);

      if (loadReviewAfterAttempts) {
        this.loadSelectedAttemptDetail();
      }

      return;
    }

    this.isAnalysisLoading.set(true);
    this.analysisError.set('');

    this.teacherDashboardApi
      .getStudentTopicQuizAttempts(studentId, topicId)
      .pipe(
        finalize(() => this.isAnalysisLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (attempts) => {
          this.topicAttempts.set(attempts);
          this.ensureSelectedAttempt(attempts);

          if (loadReviewAfterAttempts) {
            this.loadSelectedAttemptDetail();
          }
        },
        error: (error: HttpErrorResponse) => {
          this.analysisError.set(this.extractErrorMessage(error));
        }
      });
  }

  private loadSelectedAttemptDetail(): void {
    const attemptId = this.selectedAttemptId() ?? this.topicAttempts()?.attempts[0]?.attemptId ?? null;

    if (!attemptId) {
      this.analysisError.set('No quiz attempt is available for review yet.');
      return;
    }

    this.selectedAttemptId.set(attemptId);
    this.isAnalysisLoading.set(true);
    this.analysisError.set('');

    this.teacherDashboardApi
      .getQuizAttempt(attemptId)
      .pipe(
        finalize(() => this.isAnalysisLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (detail) => {
          this.selectedAttemptDetail.set(detail);
        },
        error: (error: HttpErrorResponse) => {
          this.analysisError.set(this.extractErrorMessage(error));
        }
      });
  }

  private resolveSelectedStudentId(): number | null {
    return this.selectedStudentId() ?? this.students()[0]?.studentId ?? null;
  }

  private ensureSelectedTopic(progress: TeacherStudentProgress): void {
    const selectedTopicId = this.selectedTopicId();
    const selectedTopicExists = progress.topics.some((topic) => topic.topicId === selectedTopicId);

    if (!selectedTopicExists) {
      this.selectedTopicId.set(progress.topics[0]?.topicId ?? null);
    }
  }

  private ensureSelectedAttempt(attempts: TeacherStudentTopicQuizAttempts): void {
    const selectedAttemptId = this.selectedAttemptId();
    const selectedAttemptExists = attempts.attempts.some(
      (attempt) => attempt.attemptId === selectedAttemptId
    );

    if (!selectedAttemptExists) {
      this.selectedAttemptId.set(attempts.attempts[0]?.attemptId ?? null);
    }
  }

  private axisChartBase(type: 'bar' | 'line', height: number): ApexChart {
    return {
      type,
      height,
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        speed: 420,
        animateGradually: {
          enabled: true,
          delay: 60
        }
      },
      fontFamily: 'Outfit, sans-serif',
      foreColor: '#61556f',
      background: 'transparent'
    };
  }

  private studentScoreChartHeight(studentCount: number, isMobile = false): number {
    if (this.isStudentScoreChartExpanded()) {
      return isMobile ? 620 : 720;
    }

    const baseHeight = isMobile ? 420 : 460;
    const rowHeight = isMobile ? 14 : 16;

    return Math.max(baseHeight, Math.min(680, studentCount * rowHeight + 126));
  }

  private percentDataLabels(): ApexDataLabels {
    return {
      enabled: true,
      formatter: (value: number) => `${Number(value).toFixed(value % 1 === 0 ? 0 : 2)}%`,
      style: {
        fontSize: '11px',
        fontWeight: '700',
        colors: ['#2f2638']
      }
    };
  }

  private scoreYAxis(): ApexYAxis {
    return {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: {
        formatter: (value: number) => `${value.toFixed(0)}%`,
        style: {
          colors: ['#7a6f86']
        }
      }
    };
  }

  private softGrid(): ApexGrid {
    return {
      borderColor: 'rgba(194, 186, 215, 0.34)',
      strokeDashArray: 5,
      padding: {
        left: 10,
        right: 14,
        bottom: 8
      }
    };
  }

  private bottomLegend(): ApexLegend {
    return {
      position: 'bottom',
      fontSize: '13px',
      fontWeight: 700,
      labels: {
        colors: '#5c5168'
      }
    };
  }

  private neutralStates(): ApexStates {
    return {
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
    };
  }

  private axisResponsive(): ApexResponsive[] {
    return [
      {
        breakpoint: 900,
        options: {
          chart: {
            height: 300
          },
          xaxis: {
            labels: {
              rotate: -20
            }
          }
        }
      }
    ];
  }

  private tooltipShell(title: string, rows: string[], statusColor: string): string {
    return `
      <div style="padding:12px 14px; min-width: 230px; font-family: Outfit, sans-serif;">
        <div style="font-weight:800; color:#2f2638; margin-bottom:6px;">${title}</div>
        ${rows
          .map(
            (row, index) =>
              `<div style="color:${index === rows.length - 1 ? statusColor : '#665a70'}; font-size:12px; margin-bottom:4px; font-weight:${index === rows.length - 1 ? 800 : 500};">${row}</div>`
          )
          .join('')}
      </div>
    `;
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const fallbackMessage =
      'We could not load the teacher dashboard right now. Please try again in a moment.';
    const errorMessage = error.error?.message;

    return typeof errorMessage === 'string' && errorMessage.trim().length > 0
      ? errorMessage
      : fallbackMessage;
  }
}

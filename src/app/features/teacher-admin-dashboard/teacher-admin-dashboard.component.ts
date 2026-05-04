import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { appRouteLinks } from '../../core/routing/app-route-paths';

interface TeacherMetric {
  readonly label: string;
  readonly value: string;
  readonly note: string;
}

interface ReviewItem {
  readonly course: string;
  readonly owner: string;
  readonly status: string;
}

interface ActivityItem {
  readonly title: string;
  readonly detail: string;
}

@Component({
  selector: 'app-teacher-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './teacher-admin-dashboard.component.html',
  styleUrl: './teacher-admin-dashboard.component.scss'
})
export class TeacherAdminDashboardComponent {
  protected readonly routeLinks = appRouteLinks;

  protected readonly metrics: TeacherMetric[] = [
    {
      label: 'Active Courses',
      value: '18',
      note: '+3 this month'
    },
    {
      label: 'Pending Reviews',
      value: '07',
      note: 'Needs approval today'
    },
    {
      label: 'Live Students',
      value: '1,284',
      note: 'Across all classrooms'
    }
  ];

  protected readonly reviewQueue: ReviewItem[] = [
    {
      course: 'Physics Lab Simulations',
      owner: 'Dr. Mariam Adel',
      status: 'Awaiting final review'
    },
    {
      course: 'Modern Algebra Practice Bank',
      owner: 'Mr. Youssef Salem',
      status: 'Needs quiz approval'
    },
    {
      course: 'Creative Writing Sprint',
      owner: 'Ms. Hana Fawzy',
      status: 'Ready to publish'
    }
  ];

  protected readonly activityFeed: ActivityItem[] = [
    {
      title: 'New teacher onboarding completed',
      detail: '4 new instructors were assigned to semester 2 courses.'
    },
    {
      title: 'Low engagement alert',
      detail: 'Chemistry 101 dropped below the weekly completion target.'
    },
    {
      title: 'Assessment synced',
      detail: 'The mathematics final revision quiz is now visible to students.'
    }
  ];
}

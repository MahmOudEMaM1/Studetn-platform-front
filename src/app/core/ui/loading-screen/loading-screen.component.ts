import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-screen',
  standalone: true,
  templateUrl: './loading-screen.component.html',
  styleUrl: './loading-screen.component.scss'
})
export class LoadingScreenComponent {
  readonly label = input('Loading');
  readonly title = input('Preparing your content');
  readonly description = input('Please wait while we load the latest data for this page.');
  readonly compact = input(false);
}

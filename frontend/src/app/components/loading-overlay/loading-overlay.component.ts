import { Component, Input } from '@angular/core';
import { MatProgressSpinnerModule, ProgressSpinnerMode } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.css'],
  standalone: true,
  imports: [
    MatProgressSpinnerModule
  ],
})

export class LoadingOverlayComponent {
  @Input() diameter = 76;
  @Input() mode: ProgressSpinnerMode = 'indeterminate';
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule
  ],
})

export class EmptyStateComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() buttonLabel = '';
  @Input() topMargin = '220px';

  @Output() buttonClick = new EventEmitter<void>();
}

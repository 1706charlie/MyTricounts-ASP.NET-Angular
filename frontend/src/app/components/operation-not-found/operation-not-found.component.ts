import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

@Component({
  selector: 'app-operation-not-found',
  standalone: true,
  imports: [
    CommonModule, 
    EmptyStateComponent
  ],
  templateUrl: './operation-not-found.component.html'
})

export class OperationNotFoundComponent {
  @Input() backUrl = '/';

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate([this.backUrl]);
  }
}

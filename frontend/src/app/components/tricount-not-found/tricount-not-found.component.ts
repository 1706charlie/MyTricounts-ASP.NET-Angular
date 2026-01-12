import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

@Component({
  selector: 'app-tricount-not-found',
  templateUrl: './tricount-not-found.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    EmptyStateComponent
  ]
})

export class TricountNotFoundComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
}

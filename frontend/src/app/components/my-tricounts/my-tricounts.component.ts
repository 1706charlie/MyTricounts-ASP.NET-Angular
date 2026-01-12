import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TricountCardComponent } from '../tricount-card/tricount-card.component';
import { CommonModule } from '@angular/common';
import { TricountService } from 'src/app/services/tricount.service';
import { Tricount } from 'src/app/models/tricount';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-my-tricounts',
  templateUrl: './my-tricounts.component.html',
  styleUrls: ['./my-tricounts.component.css'],
  standalone: true,
  imports: [
    NavBarComponent, 
    MatButtonModule, 
    MatIconModule,
    MatTooltipModule,
    CommonModule,
    TricountCardComponent,
    EmptyStateComponent,
    LoadingOverlayComponent
  ]
})

export class MyTricountsComponent implements OnInit {
  constructor(
    private router: Router, 
    private tricountService: TricountService,
  ) {}

  isRefreshing = false;

  // getter pour accéder directement à la cache du service
  get tricounts(): Tricount[] {
    return this.tricountService.tricounts;
  }
  
  ngOnInit() {
    this.loadPage();
  }

  refresh() {
    this.isRefreshing = true;
    this.loadPage(true);
  }

  private loadPage(force: boolean = false) {
    if (force) this.tricountService.clearBalancesCache(); // on vide la cache des balances lorsque qu'on clique sur le bouton refresh

    this.tricountService.loadUserTricounts(force).subscribe({
      complete: () => {
        this.isRefreshing = false;
      }
    });
  }

  openAddTricount() {
    this.router.navigate(['tricount/add'])
  }

  openTricount(tricount: Tricount) {
    this.router.navigate(['tricount', tricount.id]);
  }

}

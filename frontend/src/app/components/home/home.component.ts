import { Component, OnInit } from '@angular/core';
import { NavBarComponent } from '../nav-bar/nav-bar.component';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { TricountService } from 'src/app/services/tricount.service';
import { Tricount } from 'src/app/models/tricount';
import { A } from 'node_modules/@angular/cdk/activedescendant-key-manager.d-Bjic5obv';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  standalone: true,
  imports: [
    NavBarComponent, 
    MatButtonModule, 
    MatIconModule,
    MatTooltipModule,
    CommonModule,
    MatCardModule
  ]
})
export class HomeComponent implements OnInit {
  message = '';
  isRefreshing = false;
  get tricounts(): Tricount[] {
    return this.TricountService.tricounts;
  }

  constructor(
    private router: Router, 
    private TricountService: TricountService
  ) {}
  

  ngOnInit(): void {
    this.refresh();
  }
  
  refresh() {
    this.isRefreshing = true;
    this.TricountService.getMyTricounts().subscribe({
      error: err => this.message = err.message,
      complete: () => this.isRefreshing = false
    });
  }
}

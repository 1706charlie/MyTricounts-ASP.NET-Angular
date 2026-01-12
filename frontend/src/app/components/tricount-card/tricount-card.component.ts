import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Tricount } from 'src/app/models/tricount';

@Component({
  selector: 'app-tricount-card',
  templateUrl: './tricount-card.component.html',
  styleUrls: ['./tricount-card.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule
  ]
})

export class TricountCardComponent {
  @Input() tricount!: Tricount;

  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    if (this.tricount!.id! < 0) return;
    this.cardClick.emit();
  }

  get friendsText(): string {
    const nbParticipants = this.tricount.participants.length;
    const nbFriends = nbParticipants - 1; // on retire le créateur

    if (nbFriends === 0) return "you're alone";
    if (nbFriends === 1) return 'with 1 friend';
    return `with ${nbFriends} friends`;
  }
  
}

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { Operation } from 'src/app/models/operation';
import { Tricount } from 'src/app/models/tricount';

@Component({
  selector: 'app-operation-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule
  ],
  templateUrl: './operation-card.component.html',
  styleUrls: ['./operation-card.component.css'],
})

export class OperationCardComponent {
  @Input() operation!: Operation;
  @Input() tricount!: Tricount;

  @Output() cardClick = new EventEmitter<void>();

  onCardClick() {
    if (this.operation!.id! < 0) return;
    this.cardClick.emit();
  }

  get initiatorName(): string {
    const initiator = this.tricount.participants.find(p => p.id === this.operation.initiatorId);
    return initiator!.fullName!;
  }
}

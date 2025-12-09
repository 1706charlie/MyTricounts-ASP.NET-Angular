import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

export interface DialogData {
  title: string;
  message: string;
  positiveText: string;
  negativeText: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close(true)">
        {{ data.positiveText }}
      </button>

      <button mat-button (click)="close(false)">
        {{ data.negativeText }}
      </button>

    </mat-dialog-actions>
  `
})
export class DialogComponent {
  constructor(
    private ref: MatDialogRef<DialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  close(result: boolean) {
    this.ref.close(result);
  }
}
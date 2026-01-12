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
  templateUrl: './dialog.component.html',
  standalone: true,
  imports: [
    CommonModule, 
    MatDialogModule, 
    MatButtonModule
  ],
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

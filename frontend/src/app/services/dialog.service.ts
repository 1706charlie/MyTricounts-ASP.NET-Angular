import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogComponent, DialogData } from 'src/app/components/dialog/dialog.component';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog) {}

  openDialog(data: DialogData): Observable<boolean> {
    return this.dialog.open(DialogComponent, {
      width: '300px',
      disableClose: true,   // force l’utilisateur à cliquer Yes/No
      data
    }).afterClosed();
  }
}
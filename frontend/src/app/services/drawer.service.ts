import { Injectable } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

/**
 * Service permettant de contrôler le drawer (menu latéral) depuis n'importe quel composant.
 * 
 * But : Centraliser la gestion du drawer pour permettre sa manipulation depuis des composants
 * qui n'ont pas d'accès direct à l'instance MatSidenav (ex: nav-bar).
 * 
 * Principe :
 * 1. Le composant app.component enregistre son drawer via register()
 * 2. D'autres composants (ex: nav-bar) peuvent ouvrir/fermer le drawer via open()/close()
 * 3. Évite de passer des références ou des événements entre composants
 */
@Injectable({ providedIn: 'root' })
export class DrawerService {
  /** Référence privée au drawer (MatSidenav) enregistré par app.component */
  private _sidenav?: MatSidenav;

  /**
   * Enregistre le drawer dans le service.
   * Appelé une fois par app.component dans ngAfterViewInit().
   * @param sidenav Instance du MatSidenav à contrôler
   */
  register(sidenav: MatSidenav) {
    this._sidenav = sidenav;
  }

  /**
   * Ouvre le drawer.
   * Peut être appelé depuis n'importe quel composant (ex: bouton menu dans nav-bar).
   */
  open() {
    this._sidenav?.open();
  }

  /**
   * Ferme le drawer.
   * Peut être appelé depuis n'importe quel composant.
   */
  close() {
    this._sidenav?.close();
  }
}

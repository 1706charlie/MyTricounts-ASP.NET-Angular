import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";

/*
    MatTableState agit comme une mémoire d’état pour une table Angular Material :
    elle conserve le tri, le filtre et la pagination.

    Elle n’exécute rien automatiquement ; ce sont les composants extérieurs
    qui utilisent ses méthodes publiques bind() et restoreState()
    pour enregistrer ou restaurer ces informations.

    Ce choix de conception rend la classe flexible, indépendante
    et réutilisable avec n’importe quelle table Angular Material.
*/

export class MatTableState {
    public sortActive: string;
    public sortDirection: 'asc' | 'desc' = 'asc';
    public pageIndex: number = 0;
    public pageSize: number;
    public filter: string = '';

    constructor(active: string, direction: 'asc' | 'desc', pageSize: number) {
        this.sortActive = active;
        this.sortDirection = direction;
        this.pageSize = pageSize;
    }
    /*
        Remettre le tableau dans le même état qu’avant le rechargement des données : 
            •	remettre le tri sur la même colonne et dans la même direction,
            •	remettre la pagination sur la même page et taille,
            •	réappliquer le même filtre texte.

        Pour que restoreState() puisse réappliquer quelque chose,
        il faut évidemment qu’un état ait été enregistré avant — et c’est bind() qui s’en charge.
    */

    public restoreState(dataSource: MatTableDataSource<any>) {
        this.setSort(dataSource.sort!, this.sortActive, this.sortDirection);
        this.setPage(dataSource.paginator!, this.pageIndex, this.pageSize);
        this.setFilter(dataSource, this.filter);
    }

    // state recoit le tri , la direction , la page, la taille de page du datasource
    public bind(dataSource: MatTableDataSource<any>) {
        // MatSort émet un événement sortChange. Soucription à cet événement 
        dataSource.sort?.sortChange.subscribe((e: { active: string, direction: 'asc' | 'desc' }) => {
            this.sortActive = e.active;
            this.sortDirection = e.direction;
        });
        // MatPaginator émet un événement page. Soucription à cet évenement
        dataSource.paginator?.page.subscribe((e: PageEvent) => {
            this.pageIndex = e.pageIndex;
            this.pageSize = e.pageSize;
        });
    }

    // see: https://github.com/angular/components/issues/10242#issuecomment-470726829
    private setSort(sort: MatSort, active: string, direction: 'asc' | 'desc') {
        if (active) {
            sort.sort({ id: '', start: direction, disableClear: false });
            sort.sort({ id: active, start: direction, disableClear: false });
        }
    }

    // see: https://github.com/angular/components/issues/8417#issuecomment-453253715
    private setPage(paginator: MatPaginator, pageIndex: number, pageSize: number) {
        paginator.pageIndex = pageIndex;
        paginator.pageSize = pageSize;
    }

    private setFilter(dataSource: MatTableDataSource<any>, filter: string) {
        dataSource.filter = filter;
    }

}

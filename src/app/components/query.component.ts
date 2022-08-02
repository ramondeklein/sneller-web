import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, first, Observable, Subject } from 'rxjs';

import { SnellerResult, SnellerService } from '../services/sneller.service';
import { Token, TokenService } from '../services/token.service';
import { Endpoint, EndpointService } from '../services/endpoint.service';
import { Named } from '../services/storage.service';

@Component({
  selector: 'query',
  templateUrl: './query.component.html',
  styleUrls: ['./query.component.scss']
})
export class QueryComponent {
  readonly endpoints: Observable<Endpoint[]>;
  readonly tokens: Observable<Token[]>;
  readonly databases = new BehaviorSubject<string[]>([]);
  readonly tables = new BehaviorSubject<string[]>([]);
  readonly stats = new Subject<SnellerResult>();
  readonly endpoint = new FormControl<Endpoint|null>(null);
  readonly token = new FormControl<Token|null>(null);
  readonly selectedDatabase = new FormControl<string>("");
  readonly selectedTable = new FormControl<string>("");
  readonly query = new FormControl<string>("");
  readonly results = new FormControl<string>("");
  
  constructor(private snellerService: SnellerService, private endPointService: EndpointService, private tokenService: TokenService) {
    this.endpoints = this.endPointService.get();
    this.tokens = this.tokenService.get();

    this.databases.subscribe(databases => {
      if (databases.length > 0) {
        // select an active database
        const selectedDatabase = this.selectedDatabase.value;
        if (!selectedDatabase || !databases.includes(selectedDatabase)) {
          this.selectedDatabase.setValue(databases[0]);
        }
      } else {
        // reset active database
        this.selectedDatabase.setValue("");
      }
    });

    this.tables.subscribe(tables => {
      if (tables.length > 0) {
        // select an active table
        const selectedTable = this.selectedTable.value;
        if (!selectedTable || !tables.includes(selectedTable)) {
          this.selectedTable.setValue(tables[0]);
        }
      } else {
        // reset active table
        this.selectedTable.setValue("");
      }
    })

    combineLatest([this.endpoint.valueChanges, this.token.valueChanges]).subscribe(([endpoint, token]) => {
      if (endpoint && token) {
        this.databases.next([]);
        this.snellerService.getDatabases(endpoint.value, token.value).pipe(first()).subscribe(databases => this.databases.next(databases));
      } else {
        this.databases.next([]);
      }
    });

    combineLatest([this.endpoint.valueChanges, this.token.valueChanges, this.selectedDatabase.valueChanges]).subscribe(([endpoint, token, selectedDatabase]) => {
      if (endpoint && token && selectedDatabase) {
        this.tables.next([]);
        this.snellerService.getTables(endpoint.value, token.value, selectedDatabase).pipe(first()).subscribe(tables => this.tables.next(tables));
      } else {
        this.tables.next([]);
      }
    });

    combineLatest([this.endpoint.valueChanges, this.token.valueChanges, this.selectedDatabase.valueChanges, this.selectedTable.valueChanges]).subscribe(([endpoint, token, database, table]) => {
      if (endpoint && token && database && table) {
        let query = this.query.value;
        if (!query) {
          query = `SELECT * FROM "${table}" LIMIT 1`;
        } else {
          query = query.replace(/FROM\s+"[^"]*"/i,`FROM "${table}"`);
        }
        this.query.setValue(query);
      }
    });
  }

  name(named: Named): string {
    return named?.name ?? "";
}

  getAsCurl() {
    const endpoint = this.endpoint.value?.value;
    const token = this.token.value?.value;
    if (endpoint && token && this.selectedDatabase.value && this.query.value) {
      return this.snellerService.curl(endpoint, token, this.selectedDatabase.value, this.query.value);
    }
    return "";
  }

  onExecute() {
    const endpoint = this.endpoint.value?.value;
    const token = this.token.value?.value;
    if (endpoint && token && this.selectedDatabase.value && this.query.value) {
      this.snellerService.executeQuery(endpoint, token, this.selectedDatabase.value, this.query.value)
      .pipe(first())
      .subscribe(r => {
        this.results.setValue(r.data);
        this.stats.next(r);
      });
    }
  }
}
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { dumpPrettyText, loadAll } from 'ion-js';
import JSBI from 'jsbi';

export class SnellerResult {
  public data = "";
  public snellerVersion = "";
  public queryID = "";
  public maxScannedBytes = 0;
  public totalTableBytes = 0;
  public hits: JSBI | null = null;
  public misses: JSBI | null = null;
  public duration = 0;
}

@Injectable({
  providedIn: 'root'
})
export class SnellerService {

  constructor(private http: HttpClient) { }

  curl(endPoint: string, token: string, database: string, query: string): string {
    const q = new URLSearchParams();
    q.set("database", database);
    const escapedQuery = query.replaceAll("'","\\'");
    return `curl '${endPoint}/executeQuery?${q.toString()}' -H 'accept: application/json' -H 'authorization: Bearer ${token}' --data-raw $'${escapedQuery}'`
  }

  executeQuery(endPoint: string, token: string, database: string, query: string): Observable<SnellerResult> {
    const start = new Date().getTime();

    const params = {
      "database": database
    }
    const headers = {
      "Accept": "application/ion",
      "Authorization": `Bearer ${token}`
    };

    return this.http.post(`${endPoint}/executeQuery`, query, {
      observe: 'response',
      responseType: 'arraybuffer',
      headers,
      params}).pipe(map(resp => {
        const result = new SnellerResult();
        result.duration = new Date().getTime() - start;
        if (resp.status != 200) {
          result.data = `${resp.status}: ${resp.statusText}`;
          return result;
        }
        result.snellerVersion = resp.headers.get("x-sneller-version") ?? "";
        result.queryID = resp.headers.get("x-sneller-query-id") ?? "";
        const maxScannedBytes = resp.headers.get("x-sneller-max-scanned-bytes");
        if (maxScannedBytes) {
          result.maxScannedBytes = parseInt(maxScannedBytes, 10);
        }
        const totalTableBytes = resp.headers.get("x-sneller-total-table-bytes");
        if (totalTableBytes) {
          result.totalTableBytes = parseInt(totalTableBytes, 10);
        }
        if (resp.body) {
          let ionData = loadAll(resp.body);
          if (ionData.length > 0) {
            const annotations = ionData[ionData.length-1];
            result.hits = annotations.get("hits")?.bigIntValue() ?? JSBI.BigInt(0);
            result.misses = annotations.get("misses")?.bigIntValue() ?? JSBI.BigInt(0);
          }
          result.data = dumpPrettyText(ionData)
        }
        return result;
      }));
  }

  getDatabases(endPoint: string, token: string): Observable<string[]> {
    const headers = {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    };
    return this.http.get<{name: string}[]>(`${endPoint}/databases`, {headers}).pipe(map(dbs => dbs.map(db => db.name)),map(dbs => dbs.sort()));
  }

  getTables(endPoint: string, token: string, database: string): Observable<string[]> {
    const params = {
      "database": database
    }
    const headers = {
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`
    };
    return this.http.get<string[]>(`${endPoint}/tables`, {headers,params}).pipe(map(tables => tables.sort()));
  }

}

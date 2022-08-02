import { Injectable } from '@angular/core';
import { Named, StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class EndpointService extends StorageService<Endpoint> {
  constructor() {
    super("endpoints");
  }
}

export class Endpoint implements Named {
  public readonly value: string

  constructor (
    public readonly name: string,
    public readonly description: string,
    value: string) {
      if (!value.startsWith("https://") && !value.startsWith("http://")) {
        value = "https://" + value;
      }
      this.value = value;  
    }
}

import { Injectable } from '@angular/core';
import { Named, StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class TokenService extends StorageService<Token> {
  constructor() {
    super("tokens");
  }
}

export class Token implements Named {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly value: string) {
  }
}
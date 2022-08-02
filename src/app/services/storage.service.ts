import { Observable } from "rxjs";
import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";

export interface Named {
    name: string;
    description: string;
    value: string;
}

export abstract class StorageService<T extends Named>  {
    private readonly items: BehaviorSubject<T[]>;

    constructor(public readonly key: string) { 
        this.items = new BehaviorSubject<T[]>(this.load())
    }

    get(): Observable<T[]> {
        return this.items;
    }

    set(item: T): void {
        const items = this.items.value.filter(t => t.name !== item.name);
        items.push(item);
        items.sort((a, b) => a.name.localeCompare(b.name));
        this.store(items);
    }

    delete(name: string): void {
        this.store(this.items.value.filter(t => t.name !== name));
    }

    private load(): T[] {
        const jsonTokens = localStorage.getItem(this.key);
        if (!jsonTokens) {
            return [];
        }
        return JSON.parse(jsonTokens) as T[];
    }

    private store(items: T[]) {
        localStorage.setItem(this.key, JSON.stringify(items));
        this.items.next(items);
    }
}

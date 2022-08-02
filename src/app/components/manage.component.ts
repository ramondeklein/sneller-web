import { Component, Directive, OnInit } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { combineLatest, Observable, Subject, map } from "rxjs";
import { Named, StorageService } from "../services/storage.service";
import { TokenService, Token } from "../services/token.service";
import { Endpoint, EndpointService } from "../services/endpoint.service";
import { ActivatedRoute } from "@angular/router";

@Directive()
export abstract class ManageComponent<TStorageService extends StorageService<T>, T extends Named> implements OnInit {
    readonly label: string;
    readonly items: Observable<T[]>;
    readonly editForm = new FormGroup({
        name: new FormControl<string>(""),
        description: new FormControl<string>(""),
        item: new FormControl<string>("")
    });

    constructor(readonly activatedRoute: ActivatedRoute, readonly storageService: TStorageService, label: string) {
        this.label = label;
        this.items = this.storageService.get();
    }

    ngOnInit(): void {
        combineLatest([this.items, this.activatedRoute.params.pipe(map(c => c['id']))]).subscribe(([items, id]) => {
            const selectedItem = items.find(i => i.name === id);
            if (selectedItem) {
                this.editForm.patchValue({
                    name: selectedItem.name,
                    description: selectedItem.description,
                    item: selectedItem.value,
                });
            }
        });
    }

    onDelete(name: string) {
        this.storageService.delete(name);
    }

    abstract getRoute(item: T): string;

    onSave() {
        const {name, description, item} = this.editForm.value;
        if (name && item) {
            const newItem = this.create(name, description ?? "", item);
            this.storageService.set(newItem);
        }
    }

    protected abstract create(name: string, description: string, item: string): T;
}


@Component({
    selector: 'manage-tokens',
    templateUrl: './manage.component.html',
    styleUrls: ['./manage.component.scss']
})
export class ManageTokensComponent extends ManageComponent<TokenService, Token> {
    constructor(activatedRoute: ActivatedRoute, tokenService: TokenService) {
        super(activatedRoute, tokenService, "Token");
    }

    getRoute(item: Token): string {
        return `/configuration/tokens/${item.name}`
    }

    protected create(name: string, description: string, item: string) {
        return new Token(name, description, item);
    }
}

@Component({
    selector: 'manage-endpoints',
    templateUrl: './manage.component.html',
    styleUrls: ['./manage.component.scss']
})
export class ManageEndpointsComponent extends ManageComponent<EndpointService, Endpoint> {
    constructor(activatedRoute: ActivatedRoute, endpointService: EndpointService) {
        super(activatedRoute, endpointService, "Endpoint");
    }

    getRoute(item: Endpoint): string {
        return `/configuration/endpoints/${item.name}`
    }

    protected create(name: string, description: string, item: string) {
        return new Endpoint(name, description, item);
    }
}
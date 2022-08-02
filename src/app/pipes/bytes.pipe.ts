import { Pipe, PipeTransform } from "@angular/core";

@Pipe({name: 'bytes'})
export class BytesPipe implements PipeTransform {
    transform(bytes: number | undefined | null) {
        if (bytes === undefined || bytes === null) {
            return "-";
        }
        return bytes.toLocaleString();
    }
}
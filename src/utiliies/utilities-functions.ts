export class UtilitiesFunctions {

    /**
     * Genera un id único
     * @param length Longitud del id
     * @returns Id único
     */
    static generateHexString(length: number): string {
        let ret = "";
        while (ret.length < length) { ret += Math.random().toString(16).substring(2); }
        const datePart = new Date().getTime().toString(36);
        return `${ret.substring(0, length)}-${datePart}`;
    }

    static capitalizeFirst(text: string) {
        text = text.trim();
        return `${(text[0] || '').toUpperCase()}${text.slice(1).toLowerCase()}`;
    }
}

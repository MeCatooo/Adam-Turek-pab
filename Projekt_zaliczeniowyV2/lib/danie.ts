export class Danie {
    _id?: string
    nazwa: string
    cena: number
    kategoria: Kategoria

    constructor(danie: Danie){
        this._id = danie._id
        this.nazwa = danie.nazwa
        this.cena = danie.cena
        this.kategoria = danie.kategoria
    }
}
export enum Kategoria{
    przystawka = "przystawka",
    zupa = "zupa",
    danie_główne = "danie_główne",
    deser = "deser",
    napoje_bezalkoholowe = "napoje_bezalkoholowe",
    napoje_alkohowe = "napoje_alkohowe"
}
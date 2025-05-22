export interface IBenchmark {
    hideAll(): void;
    showAll(): void;
    findIdx(id: any): number;
    run(): void;
    add(count: number): void;
    update(): void;
    unselect(): void;
    select(idx: number): void;
    delete(idx: number): void;
    updateRows(): void;
    removeAllRows(): void;
    runLots(): void;
    clear(): void;
    swapRows(): void;
    appendRows(): void;
    createRow(data: IRow): void;
}

export interface IRow {
    id: number;
    label: string;
}
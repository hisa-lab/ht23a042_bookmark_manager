interface Color {
    readonly rgb: string;
    opacity: number;
    alias?: string;
    }
    const tq: Color = { rgb: '00afcc', opacity: 1 };
    tq.alias = 'turquoise';
    tq.rgb = '03c1ff'; // error TS2540: Cannot assign to 'rgb' because it is a read-only property.

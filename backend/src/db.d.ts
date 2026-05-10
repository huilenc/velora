export interface PaymentLink {
    id: string;
    amount: number;
    description: string;
    seller: string;
    status: "pendiente" | "pagado";
    createdAt: string;
}
export declare const db: PaymentLink[];
export declare function createLink(amount: number, description: string, seller: string): PaymentLink;
export declare function getLinkById(id: string): PaymentLink | undefined;
export declare function markAsPaid(id: string): PaymentLink | undefined;
//# sourceMappingURL=db.d.ts.map
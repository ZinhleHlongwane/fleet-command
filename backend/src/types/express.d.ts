export {};

declare global {
  namespace Express {
    interface Request {
      operator?: {
        id: number;
        email?: string;
        name?: string;
      };
    }
  }
}
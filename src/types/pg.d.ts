declare module "pg" {
  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized?: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export interface QueryResultRow {
    [column: string]: any;
  }

  export interface QueryResult<R extends QueryResultRow = any> {
    rows: R[];
    command: string;
    rowCount: number | null;
    oid: number;
    fields: any[];
  }

  export interface PoolClient {
    query<R extends QueryResultRow = any>(queryText: string, values?: any[]): Promise<QueryResult<R>>;
    release(err?: Error | boolean): void;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    connect(): Promise<PoolClient>;
    query<R extends QueryResultRow = any>(queryText: string, values?: any[]): Promise<QueryResult<R>>;
    on(event: string, listener: (...args: any[]) => void): this;
    end(): Promise<void>;
  }
}

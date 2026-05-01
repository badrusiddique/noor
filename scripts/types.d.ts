/**
 * Local ambient module declaration for better-sqlite3.
 * Avoids requiring `@types/better-sqlite3` as a new dev dependency.
 * Covers only the surface used by scripts/build-db.ts and scripts/verify-db.ts.
 */

declare module 'better-sqlite3' {
  type RunResult = {
    changes: number;
    lastInsertRowid: number | bigint;
  };

  type PragmaOptions = { simple?: boolean };

  type Statement<TParams extends unknown[] = unknown[]> = {
    run(...params: TParams): RunResult;
    get(...params: TParams): unknown;
    all(...params: TParams): unknown[];
    iterate(...params: TParams): IterableIterator<unknown>;
  };

  type Transaction<TArgs extends unknown[]> = (...args: TArgs) => unknown;

  type DatabaseOptions = {
    readonly?: boolean;
    fileMustExist?: boolean;
    timeout?: number;
    verbose?: ((message?: unknown, ...optionalParams: unknown[]) => void) | null;
  };

  type DatabaseInstance = {
    prepare<TParams extends unknown[] = unknown[]>(sql: string): Statement<TParams>;
    exec(sql: string): DatabaseInstance;
    pragma(pragma: string, options?: PragmaOptions): unknown;
    transaction<TArgs extends unknown[]>(fn: (...args: TArgs) => void): Transaction<TArgs>;
    close(): void;
    readonly open: boolean;
    readonly inTransaction: boolean;
  };

  type DatabaseConstructor = {
    new (path: string, options?: DatabaseOptions): DatabaseInstance;
    (path: string, options?: DatabaseOptions): DatabaseInstance;
  };

  const Database: DatabaseConstructor;
  export = Database;
}

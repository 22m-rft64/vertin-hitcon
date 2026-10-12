export {};

declare global {
  type Result<T, E = Error> =
    | { type: "ok"; value: T }
    | { type: "err"; error: E };

  function Ok<T>(value: T): Result<T, never>;
  function Err<E>(error: E): Result<never, E>;
}

export type Result<T, E = Error> =
  | { type: "ok"; value: T }
  | { type: "err"; error: E };

/**
 * 성공을 반환하는 헬퍼 함수
 */
export const Ok = <T>(value: T): Result<T, never> => ({ type: "ok", value });

/**
 * 실패를 반환하는 헬퍼 함수
 */
export const Err = <E>(error: E): Result<never, E> => ({ type: "err", error });

/**
 * Result가 성공인지 확인하는 타입 가드
 */
export const isOk = <T, E>(
  result: Result<T, E>,
): result is { type: "ok"; value: T } => result.type === "ok";

/**
 * Result가 실패인지 확인하는 타입 가드
 */
export const isErr = <T, E>(
  result: Result<T, E>,
): result is { type: "err"; error: E } => result.type === "err";

/**
 * Result에서 값을 추출. 실패면 throw
 */
export const unwrap = <T, E>(result: Result<T, E>): T => {
  if (isOk(result)) return result.value;
  throw result.error;
};

/**
 * Result에서 값을 추출. 실패면 기본값 반환
 */
export const unwrapOr = <T, E>(result: Result<T, E>, defaultValue: T): T =>
  isOk(result) ? result.value : defaultValue;

/**
 * Result의 성공 값을 변환
 */
export const map = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U,
): Result<U, E> => (isOk(result) ? Ok(fn(result.value)) : result);

/**
 * Result의 성공 값을 다른 Result로 변환 (flatMap/chain)
 */
export const flatMap = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>,
): Result<U, E> => (isOk(result) ? fn(result.value) : result);

/**
 * async 함수를 Result로 래핑
 */
export const tryAsync = async <T>(
  fn: () => Promise<T>,
): Promise<Result<T, Error>> => {
  try {
    return Ok(await fn());
  } catch (e) {
    return Err(e instanceof Error ? e : new Error(String(e)));
  }
};

/**
 * async 함수를 Result로 래핑 (커스텀 에러 변환)
 */
export const tryAsyncWith = async <T, E>(
  fn: () => Promise<T>,
  mapError: (e: unknown) => E,
): Promise<Result<T, E>> => {
  try {
    return Ok(await fn());
  } catch (e) {
    return Err(mapError(e));
  }
};

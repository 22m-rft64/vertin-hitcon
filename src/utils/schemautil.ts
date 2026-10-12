interface SchemaFieldInfo {
  defaultValue?: unknown;
  instance?: string;
}

export const getSchemaDefaultValue = (schemaField: unknown): unknown => {
  if (!schemaField) return undefined;

  const field = schemaField as SchemaFieldInfo;

  // SchemaType의 defaultValue 속성 확인
  if (field.defaultValue !== undefined) {
    // 함수인 경우 실행 결과 반환
    if (typeof field.defaultValue === "function") {
      return (field.defaultValue as () => unknown)();
    }
    return field.defaultValue;
  }

  // 타입에 따른 기본값 설정
  if (field.instance === "Array") return [];
  if (field.instance === "String") return "";
  if (field.instance === "Number") return 0;
  if (field.instance === "Boolean") return false;
  if (field.instance === "Date") return new Date();
  if (field.instance === "ObjectID") return null;
  if (field.instance === "Mixed") return {};

  return null;
};

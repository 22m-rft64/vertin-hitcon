/**
 * 파일 목록을 포맷팅합니다.
 */
export const formatFiles = (files?: { url: string; name?: string }[]): string => {
  if (!files || files.length === 0) return "No files.";

  const formatted = files
    .map((file) => {
      if (file.name) {
        return `[${file.name}](${file.url})`;
      }
      return file.url;
    })
    .join("\n- ");

  return `- ${formatted}`;
};

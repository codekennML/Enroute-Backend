export const handleArrayBuffer = (message: ArrayBuffer | string): string => {
  if (message instanceof ArrayBuffer) {
    const decoder = new TextDecoder();
    return decoder.decode(message);
  }
  return message;
};

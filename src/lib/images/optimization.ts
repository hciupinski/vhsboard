import { getResizedDimensions } from "./resize";
const MAX_BYTES = 2 * 1024 * 1024;
const ERROR = "Nie udało się przygotować zdjęcia. Wybierz mniejszy plik JPEG, PNG lub WebP.";
export async function optimizeImageForUpload(file: File): Promise<File> {
  let bitmap: ImageBitmap | undefined;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const { width, height } = getResizedDimensions(bitmap.width, bitmap.height, 1920);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error(ERROR);
    context.drawImage(bitmap, 0, 0, width, height);
    for (const quality of [0.82, 0.72, 0.62]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (!blob || blob.type !== "image/webp") throw new Error(ERROR);
      if (blob.size > 0 && blob.size <= MAX_BYTES)
        return new File([blob], `${file.name.replace(/\.[^.]*$/, "")}.webp`, {
          type: "image/webp",
        });
    }
    throw new Error(ERROR);
  } catch {
    throw new Error(ERROR);
  } finally {
    bitmap?.close();
  }
}

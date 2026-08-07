import Image from "next/image";

export function CatalogImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={600}
      height={600}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
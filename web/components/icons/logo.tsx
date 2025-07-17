import Image, { type ImageProps } from "next/image";

type DevExLogoProps = Omit<Omit<ImageProps, "src">, "alt">;

export function DevExLogoDark(props: DevExLogoProps) {
  return <Image src="/logo.png" alt="" height={30} width={30} {...props} />;
}

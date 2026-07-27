import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Documentos | Jared Muñoz",
};

export default function Documents() {
  return (
    <div className="flex flex-row gap-2">
      <Link href="/documents/flowers.avif">
        <Image
          src="/flowers.avif"
          alt="Flowers"
          width={124}
          height={124}
          className="object-contain bg-amber-100/70 object-center aspect-square rounded-md"
        />
      </Link>
      <Link href="/documents/lavender.avif">
        <Image
          src="/lavender.avif"
          alt="Lavender"
          width={124}
          height={124}
          className="object-contain bg-amber-100/70 object-center aspect-square rounded-md"
        />
      </Link>
      <Link href="/documents/max.avif">
        <Image
          src="/max.avif"
          alt="Max"
          width={124}
          height={124}
          className="object-contain bg-amber-100/70 object-center aspect-square rounded-md"
        />
      </Link>
      <Link href="/documents/sheets.avif">
        <Image
          src="/sheets.avif"
          alt="Sheets"
          width={124}
          height={124}
          className="object-contain bg-amber-100/70 object-center aspect-square rounded-md"
        />
      </Link>
      <Link href="/documents/violin.avif">
        <Image
          src="/violin.avif"
          alt="Violin"
          width={124}
          height={124}
          className="object-contain bg-amber-100/70 object-center aspect-square rounded-md"
        />
      </Link>
    </div>
  );
}

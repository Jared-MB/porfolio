import Image from "next/image";

export default async function FilePage({
  params,
}: PageProps<"/documents/[file]">) {
  const { file } = await params;

  return (
    <div>
      <Image src={`/${file}`} alt="" width={520} height={460} />
    </div>
  );
}

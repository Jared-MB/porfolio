export default function Home() {
  return (
    <div className="grid place-content-center h-full">
      <div className="flex flex-col gap-y-4">
        <h1 className="text-[clamp(3rem,13vw,8rem)] leading-[1.05] font-semibold text-balance">
          I'm Jared <br />
          Muñoz.
        </h1>
        <p className="max-w-xl text-lg sm:text-xl lg:text-2xl">
          {" "}
          <strong>Design Engineer &amp; DX.</strong> Building products people
          love to use, and developers want to work with.
        </p>
      </div>
    </div>
  );
}

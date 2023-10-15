import Link from "next/link";

export default function Home() {
  return (
    <>
      <main className="flex w-full flex-col items-center justify-center">
        <h1>Tatak Badges</h1>
        <div className="flex gap-1">
          <Link href="/dashboard">Get started</Link>
          <Link href="/docs">Read docs</Link>
        </div>
      </main>
    </>
  );
}

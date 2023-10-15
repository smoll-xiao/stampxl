import { type AppType } from "next/app";

import { api } from "@tatak-badges/utils/api";

import "@tatak-badges/styles/globals.css";
import { ThemeProvider } from "@tatak-badges/components/layout/ThemeProvider";
import Head from "next/head";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Tatak Badges</title>
        <meta
          name="description"
          content="Collect virtual pixel badges to showcase your personality and achievements."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
      >
        <main className="container m-auto flex min-h-screen justify-center p-4">
          <Component {...pageProps} />
        </main>
      </ThemeProvider>
    </>
  );
};

export default api.withTRPC(MyApp);

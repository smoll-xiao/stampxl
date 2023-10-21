import { type AppType } from "next/app";

import { api } from "@stampxl/utils/api";

import "@stampxl/styles/globals.css";
import { ThemeProvider } from "@stampxl/components/layout/ThemeProvider";
import Head from "next/head";
import {Toaster} from "react-hot-toast";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Stampxl</title>
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
        <Toaster/>
      </ThemeProvider>
    </>
  );
};

export default api.withTRPC(MyApp);

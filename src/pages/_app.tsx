import { type AppType } from "next/app";

import { api } from "@stampxl/utils/api";

import "@stampxl/styles/globals.css";
import { ThemeProvider } from "@stampxl/components/layout/ThemeProvider";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@stampxl/components/common/Tooltip";

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>Stampxl | Collect, Trade, Pixel Badges</title>
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
        <TooltipProvider>
          <main className="container m-auto flex min-h-screen justify-center">
            <Component {...pageProps} />
          </main>
        </TooltipProvider>
        <Toaster />
      </ThemeProvider>
    </>
  );
};

export default api.withTRPC(MyApp);
